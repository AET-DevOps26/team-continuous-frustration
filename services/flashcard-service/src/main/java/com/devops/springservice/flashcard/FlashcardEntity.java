package com.devops.springservice.flashcard;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A flashcard owned by a single user.
 * <p>
 * {@code userId} references the user id issued by the origin auth service
 * (authdb). It is intentionally a plain, indexed column with no cross-database
 * foreign key: each service owns its own database.
 */
@Entity
@Table(name = "flashcards")
public class FlashcardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false)
    private String question;

    @Column(nullable = false)
    private String answer;

    @Column(nullable = false)
    private String sourceRef;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;

    protected FlashcardEntity() {
        // Required by JPA.
    }

    public FlashcardEntity(UUID userId, String question, String answer, String sourceRef) {
        this.userId = userId;
        this.question = question;
        this.answer = answer;
        this.sourceRef = sourceRef;
    }

    @PrePersist
    @PreUpdate
    void touchLastUpdated() {
        this.lastUpdated = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getSourceRef() {
        return sourceRef;
    }

    public void setSourceRef(String sourceRef) {
        this.sourceRef = sourceRef;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }
}
