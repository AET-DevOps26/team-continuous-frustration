package com.devops.springservice.flashcard;

import java.util.UUID;

/** Thrown when a flashcard does not exist or is not owned by the current user. */
public class FlashcardNotFoundException extends RuntimeException {

    public FlashcardNotFoundException(UUID id) {
        super("Flashcard not found: " + id);
    }
}
