package com.devops.studyservice.controller;

import com.devops.studyservice.exception.DeckNotFoundException;
import com.devops.studyservice.exception.InvalidRequestException;
import com.devops.studyservice.exception.StudyRecordNotFoundException;
import com.devops.studyservice.model.Error;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleDeckNotFoundReturns404WithCode() {
        ResponseEntity<Error> result = handler.handleDeckNotFound(new DeckNotFoundException("deck-1"));

        assertThat(result.getStatusCode().value()).isEqualTo(404);
        assertThat(result.getBody().getCode()).isEqualTo("DECK_NOT_FOUND");
        assertThat(result.getBody().getMessage()).contains("deck-1");
    }

    @Test
    void handleStudyRecordNotFoundReturns404WithCode() {
        ResponseEntity<Error> result =
                handler.handleStudyRecordNotFound(new StudyRecordNotFoundException("deck-1", "card-1"));

        assertThat(result.getStatusCode().value()).isEqualTo(404);
        assertThat(result.getBody().getCode()).isEqualTo("FLASHCARD_NOT_FOUND");
        assertThat(result.getBody().getMessage()).contains("card-1").contains("deck-1");
    }

    @Test
    void handleInvalidRequestReturns400WithCode() {
        ResponseEntity<Error> result =
                handler.handleInvalidRequest(new InvalidRequestException("Invalid deck identifier: not-a-uuid"));

        assertThat(result.getStatusCode().value()).isEqualTo(400);
        assertThat(result.getBody().getCode()).isEqualTo("INVALID_REQUEST");
        assertThat(result.getBody().getMessage()).contains("not-a-uuid");
    }

    @Test
    void handleValidationReturns400WithFirstFieldError() {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "deckCreateRequest");
        binding.addError(new FieldError("deckCreateRequest", "tags", "size must be between 0 and 10"));
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(binding);

        ResponseEntity<Error> result = handler.handleValidation(ex);

        assertThat(result.getStatusCode().value()).isEqualTo(400);
        assertThat(result.getBody().getCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(result.getBody().getMessage()).isEqualTo("tags: size must be between 0 and 10");
    }

    @Test
    void handleUnexpectedReturns500WithGenericMessage() {
        ResponseEntity<Error> result = handler.handleUnexpected(new RuntimeException("boom"));

        assertThat(result.getStatusCode().value()).isEqualTo(500);
        assertThat(result.getBody().getCode()).isEqualTo("INTERNAL_ERROR");
    }
}
