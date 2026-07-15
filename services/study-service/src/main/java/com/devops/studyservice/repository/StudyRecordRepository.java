package com.devops.studyservice.repository;

import com.devops.studyservice.entity.StudyRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyRecordRepository extends JpaRepository<StudyRecordEntity, UUID> {

    List<StudyRecordEntity> findByDeckIdOrderByFlashcardIdAsc(UUID deckId);

    Optional<StudyRecordEntity> findByDeckIdAndFlashcardId(UUID deckId, String flashcardId);

    boolean existsByDeckIdAndFlashcardId(UUID deckId, String flashcardId);

    List<StudyRecordEntity> findTop5ByDeckIdAndDueAtLessThanEqualOrderByDueAtAsc(UUID deckId, Instant now);

    long countByDeckId(UUID deckId);

    long countByDeckIdAndDueAtLessThanEqual(UUID deckId, Instant threshold);

    void deleteByDeckIdAndFlashcardId(UUID deckId, String flashcardId);
}
