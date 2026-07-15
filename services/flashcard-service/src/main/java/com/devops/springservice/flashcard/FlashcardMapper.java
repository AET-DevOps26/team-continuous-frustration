package com.devops.springservice.flashcard;

import com.devops.springservice.model.Flashcard;

import java.time.ZoneOffset;

/** Maps between the persistence entity and the API model (generated from openapi.yaml). */
final class FlashcardMapper {

    private FlashcardMapper() {
    }

    static Flashcard toModel(FlashcardEntity entity) {
        return new Flashcard(
                entity.getId().toString(),
                entity.getQuestion(),
                entity.getAnswer(),
                entity.getSourceRef(),
                entity.getLastUpdated().atOffset(ZoneOffset.UTC)
        ).sourceName(entity.getSourceName());
    }
}
