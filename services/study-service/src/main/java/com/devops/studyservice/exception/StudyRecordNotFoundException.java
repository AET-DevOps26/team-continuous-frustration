package com.devops.studyservice.exception;

public class StudyRecordNotFoundException extends RuntimeException {

    public StudyRecordNotFoundException(String deckId, String flashcardId) {
        super("Flashcard " + flashcardId + " not found in deck " + deckId);
    }
}
