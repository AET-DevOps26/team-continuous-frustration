package com.devops.studyservice.controller;

import com.devops.studyservice.exception.DeckNotFoundException;
import com.devops.studyservice.exception.InvalidRequestException;
import com.devops.studyservice.exception.StudyRecordNotFoundException;
import com.devops.studyservice.model.Error;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DeckNotFoundException.class)
    public ResponseEntity<Error> handleDeckNotFound(DeckNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "DECK_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(StudyRecordNotFoundException.class)
    public ResponseEntity<Error> handleStudyRecordNotFound(StudyRecordNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "FLASHCARD_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Error> handleInvalidRequest(InvalidRequestException ex) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Error> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Error> handleUnexpected(Exception ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred.");
    }

    private ResponseEntity<Error> error(HttpStatus status, String code, String message) {
        Error body = new Error();
        body.setCode(code);
        body.setMessage(message);
        return ResponseEntity.status(status).body(body);
    }
}
