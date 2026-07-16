package com.devops.springservice.flashcard;

import com.devops.springservice.model.Flashcard;
import com.devops.springservice.model.FlashcardBatchGetRequest;
import com.devops.springservice.model.FlashcardCreateRequest;
import com.devops.springservice.model.FlashcardUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * CRUD endpoints for flashcards. Every request is scoped to the authenticated
 * user, whose id is taken from the validated JWT subject.
 */
@RestController
@RequestMapping("/api/v1/flashcards")
public class FlashcardController {

    private final FlashcardService service;

    public FlashcardController(FlashcardService service) {
        this.service = service;
    }

    @GetMapping
    public List<Flashcard> list(@AuthenticationPrincipal String subject) {
        return service.listForUser(currentUserId(subject));
    }

    @PostMapping
    public ResponseEntity<Flashcard> create(
            @AuthenticationPrincipal String subject,
            @Valid @RequestBody FlashcardCreateRequest request) {
        Flashcard created = service.create(currentUserId(subject), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/batch-get")
    public List<Flashcard> getByIds(
            @AuthenticationPrincipal String subject,
            @Valid @RequestBody FlashcardBatchGetRequest request) {
        List<UUID> flashcardIds = request.getIds().stream().map(UUID::fromString).toList();
        return service.getForUser(currentUserId(subject), flashcardIds);
    }

    @GetMapping("/{flashcard_id}")
    public Flashcard getById(
            @AuthenticationPrincipal String subject,
            @PathVariable("flashcard_id") UUID flashcardId) {
        return service.getForUser(currentUserId(subject), flashcardId);
    }

    @PutMapping("/{flashcard_id}")
    public Flashcard update(
            @AuthenticationPrincipal String subject,
            @PathVariable("flashcard_id") UUID flashcardId,
            @Valid @RequestBody FlashcardUpdateRequest request) {
        return service.update(currentUserId(subject), flashcardId, request);
    }

    @DeleteMapping("/{flashcard_id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String subject,
            @PathVariable("flashcard_id") UUID flashcardId) {
        service.delete(currentUserId(subject), flashcardId);
        return ResponseEntity.noContent().build();
    }

    private UUID currentUserId(String subject) {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Missing authenticated user");
        }
        return UUID.fromString(subject);
    }
}
