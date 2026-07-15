package com.devops.springservice.flashcard;

import com.devops.springservice.model.Error;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Translates flashcard errors into the unified error schema defined in the
 * OpenAPI specification.
 */
@RestControllerAdvice(assignableTypes = FlashcardController.class)
public class FlashcardExceptionHandler {

    @ExceptionHandler(FlashcardNotFoundException.class)
    public ResponseEntity<Error> handleNotFound(FlashcardNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new Error(ex.getMessage()).code("FLASHCARD_NOT_FOUND"));
    }

    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            MethodArgumentNotValidException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<Error> handleBadRequest(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new Error("Invalid request.").code("BAD_REQUEST"));
    }
}
