package com.devops.springservice.flashcard;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the persistence layer against a real PostgreSQL
 * (Testcontainers). Liquibase migrations run on startup and Hibernate validates
 * the entity mapping against the migrated schema, so these exercise the real
 * SQL, constraints, and derived queries — not mocks.
 */
@SpringBootTest
@Testcontainers
class FlashcardRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private static final UUID USER_A = UUID.randomUUID();
    private static final UUID USER_B = UUID.randomUUID();

    @Autowired
    private FlashcardRepository repository;

    @BeforeEach
    void reset() {
        repository.deleteAll();
    }

    @Test
    void persistsGeneratedIdAndTimestampScopedByUser() {
        FlashcardEntity a1 = repository.save(new FlashcardEntity(USER_A, "Qa1", "A", "u1", "a.pdf"));
        repository.save(new FlashcardEntity(USER_A, "Qa2", "A", "u1", "a.pdf"));
        repository.save(new FlashcardEntity(USER_B, "Qb1", "A", "u2", "b.pdf"));

        assertThat(a1.getId()).isNotNull();
        assertThat(a1.getLastUpdated()).isNotNull();
        assertThat(repository.findByUserIdOrderByLastUpdatedDesc(USER_A)).hasSize(2);
        assertThat(repository.findByUserIdOrderByLastUpdatedDesc(USER_B)).hasSize(1);
    }

    @Test
    void findByIdAndUserIdEnforcesOwnership() {
        FlashcardEntity a = repository.save(new FlashcardEntity(USER_A, "Q", "A", "u", "a.pdf"));

        assertThat(repository.findByIdAndUserId(a.getId(), USER_A)).isPresent();
        assertThat(repository.findByIdAndUserId(a.getId(), USER_B)).isEmpty();
    }

    @Test
    void findByIdInAndUserIdReturnsOnlyOwnedMatches() {
        FlashcardEntity a = repository.save(new FlashcardEntity(USER_A, "Q", "A", "u", "a.pdf"));
        FlashcardEntity b = repository.save(new FlashcardEntity(USER_B, "Q", "A", "u", "b.pdf"));

        List<FlashcardEntity> found = repository.findByIdInAndUserId(List.of(a.getId(), b.getId()), USER_A);

        assertThat(found).extracting(FlashcardEntity::getId).containsExactly(a.getId());
    }

    // Derived delete queries require an active transaction, which the
    // FlashcardService provides in production via @Transactional.
    @Test
    @Transactional
    void deleteByIdAndUserIdReturnsAffectedCount() {
        FlashcardEntity a = repository.save(new FlashcardEntity(USER_A, "Q", "A", "u", "a.pdf"));

        assertThat(repository.deleteByIdAndUserId(a.getId(), USER_B)).isZero();
        assertThat(repository.deleteByIdAndUserId(a.getId(), USER_A)).isEqualTo(1L);
        assertThat(repository.findById(a.getId())).isEmpty();
    }

    @Test
    void persistsLongTextAndNullableSourceName() {
        String longAnswer = "x".repeat(5000);
        FlashcardEntity saved = repository.save(new FlashcardEntity(USER_A, "Q", longAnswer, "u", null));

        FlashcardEntity reloaded = repository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getAnswer()).hasSize(5000);
        assertThat(reloaded.getSourceName()).isNull();
    }
}
