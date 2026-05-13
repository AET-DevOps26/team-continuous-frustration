package com.devops.springservice.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invalid_tokens")
public class InvalidTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 2000)
    private String token;

    @Column(nullable = false)
    private Instant invalidatedAt = Instant.now();

    public InvalidTokenEntity() {
    }

    public InvalidTokenEntity(String token) {
        this.token = token;
        this.invalidatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public Instant getInvalidatedAt() {
        return invalidatedAt;
    }
}