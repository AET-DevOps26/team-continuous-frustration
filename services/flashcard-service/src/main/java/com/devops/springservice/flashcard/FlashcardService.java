package com.devops.springservice.flashcard;

import com.devops.springservice.model.Flashcard;
import com.devops.springservice.model.FlashcardCreateRequest;
import com.devops.springservice.model.FlashcardUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Business logic for flashcard management. Every operation is scoped to the
 * owning user so that users can only ever read or mutate their own flashcards.
 */
@Service
@Transactional
public class FlashcardService {

    private final FlashcardRepository repository;

    public FlashcardService(FlashcardRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Flashcard> listForUser(UUID userId) {
        return repository.findByUserIdOrderByLastUpdatedDesc(userId).stream()
                .map(FlashcardMapper::toModel)
                .toList();
    }

    @Transactional(readOnly = true)
    public Flashcard getForUser(UUID userId, UUID flashcardId) {
        return FlashcardMapper.toModel(requireOwned(userId, flashcardId));
    }

    public Flashcard create(UUID userId, FlashcardCreateRequest request) {
        FlashcardEntity entity = new FlashcardEntity(
                userId,
                request.getQuestion(),
                request.getAnswer(),
                request.getSourceRef(),
                request.getSourceName()
        );
        return FlashcardMapper.toModel(repository.save(entity));
    }

    public Flashcard update(UUID userId, UUID flashcardId, FlashcardUpdateRequest request) {
        FlashcardEntity entity = requireOwned(userId, flashcardId);
        entity.setQuestion(request.getQuestion());
        entity.setAnswer(request.getAnswer());
        entity.setSourceRef(request.getSourceRef());
        // Flush so @PreUpdate runs and the mapped response carries the new timestamp.
        return FlashcardMapper.toModel(repository.saveAndFlush(entity));
    }

    public void delete(UUID userId, UUID flashcardId) {
        if (repository.deleteByIdAndUserId(flashcardId, userId) == 0) {
            throw new FlashcardNotFoundException(flashcardId);
        }
    }

    private FlashcardEntity requireOwned(UUID userId, UUID flashcardId) {
        return repository.findByIdAndUserId(flashcardId, userId)
                .orElseThrow(() -> new FlashcardNotFoundException(flashcardId));
    }
}
