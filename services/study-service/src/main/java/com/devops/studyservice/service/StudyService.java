package com.devops.studyservice.service;

import com.devops.studyservice.entity.DeckEntity;
import com.devops.studyservice.entity.StudyRecordEntity;
import com.devops.studyservice.exception.InvalidRequestException;
import com.devops.studyservice.exception.StudyRecordNotFoundException;
import com.devops.studyservice.model.StudyStatus;
import com.devops.studyservice.repository.StudyRecordRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class StudyService {

    private static final double HARD_INTERVAL_MULTIPLIER = 1.2;
    private static final double EASY_INTERVAL_MULTIPLIER = 1.3;

    private final StudyRecordRepository studyRecordRepository;

    @Value("${study.ease.default:2.5}")
    private double defaultEaseFactor = 2.5;

    @Value("${study.ease.min:1.3}")
    private double minEaseFactor = 1.3;

    @Value("${study.ease.again-penalty:0.20}")
    private double againEasePenalty = 0.20;

    @Value("${study.ease.hard-penalty:0.15}")
    private double hardEasePenalty = 0.15;

    @Value("${study.ease.easy-bonus:0.15}")
    private double easyEaseBonus = 0.15;

    @Value("${study.hard-first-step-minutes:10}")
    private long hardFirstStepMinutes = 10;

    public StudyService(StudyRecordRepository studyRecordRepository) {
        this.studyRecordRepository = studyRecordRepository;
    }

    public List<String> listFlashcardIds(DeckEntity deck) {
        return studyRecordRepository.findByDeckIdOrderByFlashcardIdAsc(deck.getId()).stream()
                .map(StudyRecordEntity::getFlashcardId)
                .toList();
    }

    public List<StudyRecordEntity> getDueFlashcards(DeckEntity deck) {
        return studyRecordRepository.findTop5ByDeckIdAndDueAtLessThanEqualOrderByDueAtAsc(deck.getId(), Instant.now());
    }

    public StudyRecordEntity createRecord(DeckEntity deck, String flashcardId) {
        if (studyRecordRepository.existsByDeckIdAndFlashcardId(deck.getId(), flashcardId)) {
            throw new InvalidRequestException("Flashcard is already tracked in this deck: " + flashcardId);
        }
        StudyRecordEntity record = new StudyRecordEntity();
        record.setDeckId(deck.getId());
        record.setFlashcardId(flashcardId);
        record.setIntervalDays(0);
        record.setEaseFactor(defaultEaseFactor);
        record.setDueAt(Instant.now());
        return studyRecordRepository.save(record);
    }

    public StudyRecordEntity updateStatus(DeckEntity deck, String flashcardId, StudyStatus status) {
        StudyRecordEntity record = findRecord(deck, flashcardId);
        Instant now = Instant.now();

        double ease = record.getEaseFactor();
        int intervalDays = record.getIntervalDays();
        boolean stillLearning = intervalDays <= 0;
        Instant dueAt = now;

        switch (status) {
            case AGAIN -> {
                intervalDays = 0;
                ease = Math.max(minEaseFactor, ease - againEasePenalty);
            }
            case HARD -> {
                intervalDays = Math.max(1, (int) Math.round(Math.max(intervalDays, 1) * HARD_INTERVAL_MULTIPLIER));
                ease = Math.max(minEaseFactor, ease - hardEasePenalty);
                // A card that hasn't graduated past the reset state yet gets a short
                // learning-step retry instead of jumping straight to a full day.
                dueAt = stillLearning ? now.plus(hardFirstStepMinutes, ChronoUnit.MINUTES) : now.plus(intervalDays, ChronoUnit.DAYS);
            }
            case GOOD -> {
                intervalDays = intervalDays <= 0 ? 1 : (int) Math.round(intervalDays * ease);
                dueAt = now.plus(intervalDays, ChronoUnit.DAYS);
            }
            case EASY -> {
                intervalDays = intervalDays <= 0 ? 2 : (int) Math.round(intervalDays * ease * EASY_INTERVAL_MULTIPLIER);
                ease = ease + easyEaseBonus;
                dueAt = now.plus(intervalDays, ChronoUnit.DAYS);
            }
        }

        record.setIntervalDays(intervalDays);
        record.setEaseFactor(ease);
        record.setDueAt(dueAt);
        record.setUpdatedAt(now);
        return studyRecordRepository.save(record);
    }

    @Transactional
    public void deleteRecord(DeckEntity deck, String flashcardId) {
        StudyRecordEntity record = findRecord(deck, flashcardId);
        studyRecordRepository.delete(record);
    }

    public long countTotal(UUID deckId) {
        return studyRecordRepository.countByDeckId(deckId);
    }

    public long countDueToday(UUID deckId) {
        Instant endOfToday = Instant.now().truncatedTo(ChronoUnit.DAYS).plus(1, ChronoUnit.DAYS).minusNanos(1);
        return studyRecordRepository.countByDeckIdAndDueAtLessThanEqual(deckId, endOfToday);
    }

    private StudyRecordEntity findRecord(DeckEntity deck, String flashcardId) {
        return studyRecordRepository.findByDeckIdAndFlashcardId(deck.getId(), flashcardId)
                .orElseThrow(() -> new StudyRecordNotFoundException(deck.getId().toString(), flashcardId));
    }
}
