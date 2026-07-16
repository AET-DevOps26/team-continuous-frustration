package com.devops.studyservice.controller;

import com.devops.studyservice.entity.DeckEntity;
import com.devops.studyservice.entity.StudyRecordEntity;
import com.devops.studyservice.model.Deck;
import com.devops.studyservice.model.DeckCreateRequest;
import com.devops.studyservice.model.DeckOverview;
import com.devops.studyservice.model.StudyDueDateRecord;
import com.devops.studyservice.model.StudyFlashcardCreateRequest;
import com.devops.studyservice.model.StudyStatus;
import com.devops.studyservice.model.StudyStatusUpdateRequest;
import com.devops.studyservice.service.DeckService;
import com.devops.studyservice.service.StudyService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudyControllerTest {

    private static final String USER_ID = UUID.randomUUID().toString();
    private static final String FLASHCARD_ID = "card-1";

    @Mock
    private DeckService deckService;
    @Mock
    private StudyService studyService;

    private StudyController controller;
    private DeckEntity deck;

    @BeforeEach
    void setUp() {
        controller = new StudyController(deckService, studyService);
        deck = new DeckEntity();
        ReflectionTestUtils.setField(deck, "id", UUID.randomUUID());
        deck.setUserId(USER_ID);
        deck.setName("Biology");
        deck.setTags(List.of("science", "bio"));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(USER_ID, null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private StudyRecordEntity record(String flashcardId) {
        StudyRecordEntity record = new StudyRecordEntity();
        record.setDeckId(deck.getId());
        record.setFlashcardId(flashcardId);
        record.setDueAt(Instant.now());
        record.setIntervalDays(0);
        record.setEaseFactor(2.5);
        return record;
    }

    @Test
    void listDecksReturns200WithCallersDecks() {
        when(deckService.listDecks(USER_ID)).thenReturn(List.of(deck));

        ResponseEntity<List<Deck>> response = controller.listDecks();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getId()).isEqualTo(deck.getId().toString());
        assertThat(response.getBody().get(0).getTags()).containsExactly("science", "bio");
    }

    @Test
    void createDeckReturns201WithCreatedDeck() {
        DeckCreateRequest request = new DeckCreateRequest("Biology", List.of("science", "bio"));
        when(deckService.createDeck(USER_ID, "Biology", List.of("science", "bio"))).thenReturn(deck);

        ResponseEntity<Deck> response = controller.createDeck(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody().getName()).isEqualTo("Biology");
    }

    @Test
    void listDeckOverviewsReturns200WithCardCounts() {
        when(deckService.listDecks(USER_ID)).thenReturn(List.of(deck));
        when(studyService.countTotal(deck.getId())).thenReturn(3L);
        when(studyService.countDueToday(deck.getId())).thenReturn(1L);

        ResponseEntity<List<DeckOverview>> response = controller.listDeckOverviews();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        DeckOverview overview = response.getBody().get(0);
        assertThat(overview.getCards()).isEqualTo(3);
        assertThat(overview.getDueToday()).isEqualTo(1);
    }

    @Test
    void getDueFlashcardsForDeckReturns200WithDueRecords() {
        String deckId = deck.getId().toString();
        when(deckService.requireDeck(deckId, USER_ID)).thenReturn(deck);
        when(studyService.getDueFlashcards(deck)).thenReturn(List.of(record(FLASHCARD_ID)));

        ResponseEntity<List<StudyDueDateRecord>> response = controller.getDueFlashcardsForDeck(deckId);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getFlashcardId()).isEqualTo(FLASHCARD_ID);
        assertThat(response.getBody().get(0).getDeckId()).isEqualTo(deckId);
    }

    @Test
    void listDeckFlashcardIdsReturns200WithIds() {
        String deckId = deck.getId().toString();
        when(deckService.requireDeck(deckId, USER_ID)).thenReturn(deck);
        when(studyService.listFlashcardIds(deck)).thenReturn(List.of(FLASHCARD_ID));

        ResponseEntity<List<String>> response = controller.listDeckFlashcardIds(deckId);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsExactly(FLASHCARD_ID);
    }

    @Test
    void createDeckFlashcardRecordReturns201() {
        String deckId = deck.getId().toString();
        when(deckService.requireDeck(deckId, USER_ID)).thenReturn(deck);
        when(studyService.createRecord(deck, FLASHCARD_ID)).thenReturn(record(FLASHCARD_ID));

        ResponseEntity<StudyDueDateRecord> response =
                controller.createDeckFlashcardRecord(deckId, new StudyFlashcardCreateRequest(FLASHCARD_ID));

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody().getFlashcardId()).isEqualTo(FLASHCARD_ID);
    }

    @Test
    void updateFlashcardStudyStatusReturns200WithUpdatedRecord() {
        String deckId = deck.getId().toString();
        StudyRecordEntity updated = record(FLASHCARD_ID);
        updated.setIntervalDays(1);
        updated.setUpdatedAt(Instant.now());
        when(deckService.requireDeck(deckId, USER_ID)).thenReturn(deck);
        when(studyService.updateStatus(deck, FLASHCARD_ID, StudyStatus.GOOD)).thenReturn(updated);

        ResponseEntity<StudyDueDateRecord> response = controller.updateFlashcardStudyStatus(
                deckId, FLASHCARD_ID, new StudyStatusUpdateRequest(StudyStatus.GOOD));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().getUpdatedAt()).isNotNull();
    }

    @Test
    void deleteDeckFlashcardRecordReturns204AndDeletesRecord() {
        String deckId = deck.getId().toString();
        when(deckService.requireDeck(deckId, USER_ID)).thenReturn(deck);

        ResponseEntity<Void> response = controller.deleteDeckFlashcardRecord(deckId, FLASHCARD_ID);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(studyService).deleteRecord(deck, FLASHCARD_ID);
    }
}
