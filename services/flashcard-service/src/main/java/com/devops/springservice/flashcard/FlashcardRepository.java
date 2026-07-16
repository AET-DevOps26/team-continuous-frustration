package com.devops.springservice.flashcard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FlashcardRepository extends JpaRepository<FlashcardEntity, UUID> {

    List<FlashcardEntity> findByUserIdOrderByLastUpdatedDesc(UUID userId);

    Optional<FlashcardEntity> findByIdAndUserId(UUID id, UUID userId);

    List<FlashcardEntity> findByIdInAndUserId(List<UUID> ids, UUID userId);

    long deleteByIdAndUserId(UUID id, UUID userId);
}
