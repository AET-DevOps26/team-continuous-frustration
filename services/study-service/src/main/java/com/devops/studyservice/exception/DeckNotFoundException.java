package com.devops.studyservice.exception;

public class DeckNotFoundException extends RuntimeException {

    public DeckNotFoundException(String deckId) {
        super("Deck not found: " + deckId);
    }
}
