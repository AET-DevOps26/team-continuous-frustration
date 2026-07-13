package com.devops.authservice.controller;

import com.devops.authservice.domain.user.exception.EmailAlreadyExistsException;
import com.devops.authservice.domain.user.exception.UsernameAlreadyExistsException;
import com.devops.authservice.model.ErrorResponse;
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
    void handleEmailConflict_returns409WithCode() {
        ResponseEntity<ErrorResponse> result =
                handler.handleEmailConflict(new EmailAlreadyExistsException("user@example.com"));

        assertThat(result.getStatusCode().value()).isEqualTo(409);
        assertThat(result.getBody().getCode()).isEqualTo("EMAIL_ALREADY_EXISTS");
        assertThat(result.getBody().getMessage()).contains("user@example.com");
    }

    @Test
    void handleUsernameConflict_returns409WithCode() {
        ResponseEntity<ErrorResponse> result =
                handler.handleUsernameConflict(new UsernameAlreadyExistsException("alice"));

        assertThat(result.getStatusCode().value()).isEqualTo(409);
        assertThat(result.getBody().getCode()).isEqualTo("USERNAME_ALREADY_EXISTS");
    }

    @Test
    void handleValidation_returns422WithFirstFieldError() {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "registerRequest");
        binding.addError(new FieldError("registerRequest", "email", "must not be blank"));
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(binding);

        ResponseEntity<ErrorResponse> result = handler.handleValidation(ex);

        assertThat(result.getStatusCode().value()).isEqualTo(422);
        assertThat(result.getBody().getCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(result.getBody().getMessage()).isEqualTo("email: must not be blank");
    }
}
