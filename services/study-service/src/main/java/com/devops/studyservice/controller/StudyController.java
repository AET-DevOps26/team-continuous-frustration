package com.devops.studyservice.controller;

import com.devops.studyservice.api.DefaultApi;
import com.devops.studyservice.entity.DeckEntity;
import com.devops.studyservice.entity.StudyRecordEntity;
import com.devops.studyservice.model.Deck;
import com.devops.studyservice.model.DeckCreateRequest;
import com.devops.studyservice.model.DeckOverview;
import com.devops.studyservice.model.StudyDueDateRecord;
import com.devops.studyservice.model.StudyFlashcardCreateRequest;
import com.devops.studyservice.model.StudyStatusUpdateRequest;
import com.devops.studyservice.service.DeckService;
import com.devops.studyservice.service.StudyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@RestController
public class StudyController implements DefaultApi {

    private final DeckService deckService;
    private final StudyService studyService;

    public StudyController(DeckService deckService, StudyService studyService) {
        this.deckService = deckService;
        this.studyService = studyService;
    }

    @Override
    public ResponseEntity<List<Deck>> listDecks() {
        List<Deck> decks = deckService.listDecks(currentUserId()).stream()
                .map(StudyController::toDeck)
                .toList();
        return ResponseEntity.ok(decks);
    }

    @Override
    public ResponseEntity<Deck> getDeckById(String deckId) {
        DeckEntity deck = deckService.requireDeck(deckId, currentUserId());
        return ResponseEntity.ok(toDeck(deck));
    }

    @Override
    public ResponseEntity<Deck> createDeck(DeckCreateRequest request) {
        DeckEntity deck = deckService.createDeck(currentUserId(), request.getName(), request.getTags());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDeck(deck));
    }

    @Override
    public ResponseEntity<List<DeckOverview>> listDeckOverviews() {
        List<DeckOverview> overviews = deckService.listDecks(currentUserId()).stream()
                .map(deck -> toDeckOverview(deck, studyService.countTotal(deck.getId()), studyService.countDueToday(deck.getId())))
                .toList();
        return ResponseEntity.ok(overviews);
    }

    @Override
    public ResponseEntity<List<StudyDueDateRecord>> getDueFlashcardsForDeck(String deckId) {
        DeckEntity deck = deckService.requireDeck(deckId, currentUserId());
        List<StudyDueDateRecord> records = studyService.getDueFlashcards(deck).stream()
                .map(StudyController::toRecord)
                .toList();
        return ResponseEntity.ok(records);
    }

    @Override
    public ResponseEntity<List<String>> listDeckFlashcardIds(String deckId) {
        DeckEntity deck = deckService.requireDeck(deckId, currentUserId());
        return ResponseEntity.ok(studyService.listFlashcardIds(deck));
    }

    @Override
    public ResponseEntity<StudyDueDateRecord> createDeckFlashcardRecord(String deckId, StudyFlashcardCreateRequest request) {
        DeckEntity deck = deckService.requireDeck(deckId, currentUserId());
        StudyRecordEntity record = studyService.createRecord(deck, request.getFlashcardId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toRecord(record));
    }

    @Override
    public ResponseEntity<StudyDueDateRecord> updateFlashcardStudyStatus(String deckId, String flashcardId, StudyStatusUpdateRequest request) {
        DeckEntity deck = deckService.requireDeck(deckId, currentUserId());
        StudyRecordEntity record = studyService.updateStatus(deck, flashcardId, request.getStudyStatus());
        return ResponseEntity.ok(toRecord(record));
    }

    @Override
    public ResponseEntity<Void> deleteDeckFlashcardRecord(String deckId, String flashcardId) {
        DeckEntity deck = deckService.requireDeck(deckId, currentUserId());
        studyService.deleteRecord(deck, flashcardId);
        return ResponseEntity.noContent().build();
    }

    private static String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private static Deck toDeck(DeckEntity entity) {
        return new Deck(entity.getId().toString(), entity.getName(), entity.getTags());
    }

    private static DeckOverview toDeckOverview(DeckEntity entity, long cards, long dueToday) {
        return new DeckOverview(entity.getId().toString(), entity.getName(), entity.getTags(), (int) cards, (int) dueToday);
    }

    private static StudyDueDateRecord toRecord(StudyRecordEntity entity) {
        StudyDueDateRecord record = new StudyDueDateRecord(
                entity.getDeckId().toString(),
                entity.getFlashcardId(),
                OffsetDateTime.ofInstant(entity.getDueAt(), ZoneOffset.UTC),
                entity.getIntervalDays(),
                entity.getEaseFactor()
        );
        if (entity.getUpdatedAt() != null) {
            record.setUpdatedAt(OffsetDateTime.ofInstant(entity.getUpdatedAt(), ZoneOffset.UTC));
        }
        return record;
    }
}
