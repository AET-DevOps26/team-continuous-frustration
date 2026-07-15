package com.devops.studyservice.service;

import com.devops.studyservice.entity.DeckEntity;
import com.devops.studyservice.entity.StudyRecordEntity;
import com.devops.studyservice.exception.InvalidRequestException;
import com.devops.studyservice.exception.StudyRecordNotFoundException;
import com.devops.studyservice.model.StudyStatus;
import com.devops.studyservice.repository.StudyRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudyServiceTest {

    private static final String FLASHCARD_ID = "card-1";

    @Mock
    private StudyRecordRepository studyRecordRepository;

    private StudyService studyService;
    private DeckEntity deck;

    @BeforeEach
    void setUp() {
        studyService = new StudyService(studyRecordRepository);
        deck = new DeckEntity();
        ReflectionTestUtils.setField(deck, "id", UUID.randomUUID());
    }

    private StudyRecordEntity existingRecord(int intervalDays, double easeFactor) {
        StudyRecordEntity record = new StudyRecordEntity();
        record.setDeckId(deck.getId());
        record.setFlashcardId(FLASHCARD_ID);
        record.setIntervalDays(intervalDays);
        record.setEaseFactor(easeFactor);
        record.setDueAt(Instant.now());
        return record;
    }

    @Test
    void createRecordPersistsNewRecordDueImmediately() {
        when(studyRecordRepository.existsByDeckIdAndFlashcardId(deck.getId(), FLASHCARD_ID)).thenReturn(false);
        when(studyRecordRepository.save(any(StudyRecordEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        StudyRecordEntity result = studyService.createRecord(deck, FLASHCARD_ID);

        assertThat(result.getDeckId()).isEqualTo(deck.getId());
        assertThat(result.getFlashcardId()).isEqualTo(FLASHCARD_ID);
        assertThat(result.getIntervalDays()).isZero();
        assertThat(result.getDueAt()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    void createRecordThrowsWhenFlashcardAlreadyTrackedInDeck() {
        when(studyRecordRepository.existsByDeckIdAndFlashcardId(deck.getId(), FLASHCARD_ID)).thenReturn(true);

        assertThatThrownBy(() -> studyService.createRecord(deck, FLASHCARD_ID))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void updateStatusGoodAdvancesNewCardByOneDay() {
        StudyRecordEntity record = existingRecord(0, 2.5);
        when(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), FLASHCARD_ID)).thenReturn(Optional.of(record));
        when(studyRecordRepository.save(record)).thenReturn(record);

        StudyRecordEntity result = studyService.updateStatus(deck, FLASHCARD_ID, StudyStatus.GOOD);

        assertThat(result.getIntervalDays()).isEqualTo(1);
        assertThat(result.getUpdatedAt()).isNotNull();
        assertThat(result.getDueAt()).isAfter(Instant.now().plus(23, ChronoUnit.HOURS));
    }

    @Test
    void updateStatusAgainMakesCardImmediatelyDueAndLowersEase() {
        StudyRecordEntity record = existingRecord(5, 2.5);
        when(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), FLASHCARD_ID)).thenReturn(Optional.of(record));
        when(studyRecordRepository.save(record)).thenReturn(record);

        StudyRecordEntity result = studyService.updateStatus(deck, FLASHCARD_ID, StudyStatus.AGAIN);

        assertThat(result.getIntervalDays()).isZero();
        assertThat(result.getEaseFactor()).isLessThan(2.5);
        assertThat(result.getDueAt()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    void updateStatusEasyGrowsIntervalAndEaseFasterThanGood() {
        StudyRecordEntity easyRecord = existingRecord(4, 2.5);
        StudyRecordEntity goodRecord = existingRecord(4, 2.5);
        when(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), "easy-card")).thenReturn(Optional.of(easyRecord));
        when(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), "good-card")).thenReturn(Optional.of(goodRecord));
        when(studyRecordRepository.save(any(StudyRecordEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        StudyRecordEntity easyResult = studyService.updateStatus(deck, "easy-card", StudyStatus.EASY);
        StudyRecordEntity goodResult = studyService.updateStatus(deck, "good-card", StudyStatus.GOOD);

        assertThat(easyResult.getIntervalDays()).isGreaterThan(goodResult.getIntervalDays());
        assertThat(easyResult.getEaseFactor()).isGreaterThan(2.5);
    }

    @Test
    void updateStatusThrowsWhenFlashcardNotTrackedInDeck() {
        when(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), "missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studyService.updateStatus(deck, "missing", StudyStatus.GOOD))
                .isInstanceOf(StudyRecordNotFoundException.class);
    }

    @Test
    void deleteRecordThrowsWhenNotFound() {
        when(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), "missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studyService.deleteRecord(deck, "missing"))
                .isInstanceOf(StudyRecordNotFoundException.class);
    }

    @Test
    void deleteRecordRemovesExistingRecord() {
        StudyRecordEntity record = existingRecord(0, 2.5);
        when(studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), FLASHCARD_ID)).thenReturn(Optional.of(record));

        studyService.deleteRecord(deck, FLASHCARD_ID);

        verify(studyRecordRepository).delete(record);
    }

    @Test
    void getDueFlashcardsDelegatesToRepositoryWithCurrentDeck() {
        List<StudyRecordEntity> due = List.of(existingRecord(0, 2.5));
        when(studyRecordRepository.findTop5ByDeckIdAndDueAtLessThanEqualOrderByDueAtAsc(eq(deck.getId()), any(Instant.class)))
                .thenReturn(due);

        List<StudyRecordEntity> result = studyService.getDueFlashcards(deck);

        assertThat(result).isEqualTo(due);
    }

    @Test
    void listFlashcardIdsMapsRecordsToFlashcardIds() {
        StudyRecordEntity record = existingRecord(0, 2.5);
        when(studyRecordRepository.findByDeckIdOrderByFlashcardIdAsc(deck.getId())).thenReturn(List.of(record));

        assertThat(studyService.listFlashcardIds(deck)).containsExactly(FLASHCARD_ID);
    }
}
