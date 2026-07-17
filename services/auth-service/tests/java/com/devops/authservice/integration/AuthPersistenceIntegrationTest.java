package com.devops.authservice.integration;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.SessionStatus;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.SessionRepository;
import com.devops.authservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the auth persistence layer against a real PostgreSQL
 * (Testcontainers), exercising the Liquibase-migrated schema and the derived
 * repository queries used for authentication and session management.
 */
@SpringBootTest
@Testcontainers
class AuthPersistenceIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    private UserEntity newUser(String email, String username) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash("$2a$10$hashplaceholderhashplaceholderhashplaceholder");
        return user;
    }

    @Test
    void userUniquenessAndLookups() {
        UserEntity saved = userRepository.save(newUser("a@test.local", "alice"));

        assertThat(saved.getId()).isNotNull();
        assertThat(userRepository.existsByEmail("a@test.local")).isTrue();
        assertThat(userRepository.existsByUsername("alice")).isTrue();
        assertThat(userRepository.existsByEmail("missing@test.local")).isFalse();
        assertThat(userRepository.findByEmail("a@test.local")).isPresent();
        assertThat(userRepository.findByEmail("a@test.local").get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void findByGoogleId() {
        UserEntity user = newUser("g@test.local", "googler");
        user.setPasswordHash(null);
        user.setGoogleId("google-123");
        userRepository.save(user);

        assertThat(userRepository.findByGoogleId("google-123")).isPresent();
        assertThat(userRepository.findByGoogleId("nope")).isEmpty();
    }

    @Test
    void sessionLookupIsScopedByStatus() {
        UserEntity user = userRepository.save(newUser("s@test.local", "sam"));

        SessionEntity session = new SessionEntity();
        session.setId(UUID.randomUUID());
        session.setUserId(user.getId());
        session.setStatus(SessionStatus.ACTIVE);
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusDays(1));
        session.setLastUsedAt(LocalDateTime.now());
        sessionRepository.save(session);

        assertThat(sessionRepository.findByIdAndStatus(session.getId(), SessionStatus.ACTIVE)).isPresent();
        assertThat(sessionRepository.findByIdAndStatus(session.getId(), SessionStatus.REVOKED)).isEmpty();

        session.setStatus(SessionStatus.REVOKED);
        sessionRepository.save(session);
        assertThat(sessionRepository.findByIdAndStatus(session.getId(), SessionStatus.ACTIVE)).isEmpty();
    }
}
