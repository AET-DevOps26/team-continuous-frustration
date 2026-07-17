package com.devops.studyservice.integration;

import com.devops.studyservice.entity.DeckEntity;
import com.devops.studyservice.entity.StudyRecordEntity;
import com.devops.studyservice.repository.DeckRepository;
import com.devops.studyservice.repository.StudyRecordRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the study persistence layer against a real PostgreSQL
 * (Testcontainers): deck ownership queries, deck-tag element collection, and the
 * spaced-repetition study-record queries (due lookups, counts, deletes).
 */
@SpringBootTest
@Testcontainers
class StudyPersistenceIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private static final String USER_A = "user-a";
    private static final String USER_B = "user-b";

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private StudyRecordRepository studyRecordRepository;

    private DeckEntity newDeck(String userId, String name) {
        DeckEntity deck = new DeckEntity();
        deck.setUserId(userId);
        deck.setName(name);
        deck.setTags(List.of("cs", "exam"));
        return deck;
    }

    private StudyRecordEntity newRecord(UUID deckId, String flashcardId, Instant dueAt) {
        StudyRecordEntity record = new StudyRecordEntity();
        record.setDeckId(deckId);
        record.setFlashcardId(flashcardId);
        record.setDueAt(dueAt);
        record.setIntervalDays(1);
        record.setEaseFactor(2.5);
        return record;
    }

    // @Transactional keeps the session open so the lazy @ElementCollection tags load.
    @Test
    @Transactional
    void decksAreScopedToOwnerAndPersistTags() {
        deckRepository.save(newDeck(USER_A, "Algorithms"));
        DeckEntity owned = deckRepository.save(newDeck(USER_A, "Databases"));
        deckRepository.save(newDeck(USER_B, "Networks"));

        assertThat(deckRepository.findByUserIdOrderByCreatedAtAsc(USER_A)).hasSize(2);
        assertThat(deckRepository.findByIdAndUserId(owned.getId(), USER_A)).isPresent();
        assertThat(deckRepository.findByIdAndUserId(owned.getId(), USER_B)).isEmpty();
        assertThat(deckRepository.findById(owned.getId()).orElseThrow().getTags())
                .containsExactlyInAnyOrder("cs", "exam");
    }

    @Test
    void studyRecordDueQueriesAndCounts() {
        DeckEntity deck = deckRepository.save(newDeck(USER_A, "Deck"));
        UUID deckId = deck.getId();
        Instant now = Instant.now();

        studyRecordRepository.save(newRecord(deckId, "c1", now.minus(1, ChronoUnit.DAYS))); // due
        studyRecordRepository.save(newRecord(deckId, "c2", now.minus(2, ChronoUnit.HOURS))); // due
        studyRecordRepository.save(newRecord(deckId, "c3", now.plus(3, ChronoUnit.DAYS)));   // not due

        assertThat(studyRecordRepository.countByDeckId(deckId)).isEqualTo(3L);
        assertThat(studyRecordRepository.countByDeckIdAndDueAtLessThanEqual(deckId, now)).isEqualTo(2L);
        assertThat(studyRecordRepository.existsByDeckIdAndFlashcardId(deckId, "c1")).isTrue();
        assertThat(studyRecordRepository.existsByDeckIdAndFlashcardId(deckId, "nope")).isFalse();

        List<StudyRecordEntity> due =
                studyRecordRepository.findTop5ByDeckIdAndDueAtLessThanEqualOrderByDueAtAsc(deckId, now);
        assertThat(due).extracting(StudyRecordEntity::getFlashcardId).containsExactly("c1", "c2");

        List<String> allByCard = studyRecordRepository.findByDeckIdOrderByFlashcardIdAsc(deckId)
                .stream().map(StudyRecordEntity::getFlashcardId).toList();
        assertThat(allByCard).containsExactly("c1", "c2", "c3");
    }

    @Test
    @Transactional
    void deleteRecordByDeckAndFlashcard() {
        DeckEntity deck = deckRepository.save(newDeck(USER_A, "Deck"));
        studyRecordRepository.save(newRecord(deck.getId(), "c1", Instant.now()));

        assertThat(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), "c1")).isPresent();
        studyRecordRepository.deleteByDeckIdAndFlashcardId(deck.getId(), "c1");
        assertThat(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), "c1")).isEmpty();
    }
}
