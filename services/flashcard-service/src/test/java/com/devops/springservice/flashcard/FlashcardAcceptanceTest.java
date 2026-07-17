package com.devops.springservice.flashcard;

import com.devops.springservice.model.Flashcard;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Acceptance tests: drive the running service over HTTP (random port) against a
 * real PostgreSQL, authenticating with a signed JWT cookie exactly like the
 * gateway would. Exercises the full create → read → update → batch → delete
 * lifecycle end-to-end, plus authentication and per-user isolation.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class FlashcardAcceptanceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private FlashcardRepository repository;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();

    @BeforeEach
    void reset() {
        repository.deleteAll();
    }

    private HttpHeaders authFor(UUID userId) {
        String token = Jwts.builder()
                .subject(userId.toString())
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.COOKIE, "access_token=" + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    @Test
    void unauthenticatedRequestIsRejected() {
        ResponseEntity<String> response = rest.getForEntity("/api/v1/flashcards", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void fullLifecycleWithUserIsolation() {
        String createBody = """
                {"question":"What is a hypervisor?","answer":"Runs VMs.",
                 "source_ref":"upload-1","source_name":"lecture.pdf"}""";

        // Create as user A
        ResponseEntity<Flashcard> created = rest.exchange(
                "/api/v1/flashcards", HttpMethod.POST,
                new HttpEntity<>(createBody, authFor(userA)), Flashcard.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = created.getBody().getId();
        assertThat(created.getBody().getSourceName()).isEqualTo("lecture.pdf");

        // List as A returns the card
        ResponseEntity<Flashcard[]> list = rest.exchange(
                "/api/v1/flashcards", HttpMethod.GET,
                new HttpEntity<>(authFor(userA)), Flashcard[].class);
        assertThat(list.getBody()).hasSize(1);

        // User B cannot see user A's card
        ResponseEntity<String> asB = rest.exchange(
                "/api/v1/flashcards/" + id, HttpMethod.GET,
                new HttpEntity<>(authFor(userB)), String.class);
        assertThat(asB.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        // Update as A
        String updateBody = "{\"question\":\"Q2\",\"answer\":\"A2\",\"source_ref\":\"upload-2\"}";
        ResponseEntity<Flashcard> updated = rest.exchange(
                "/api/v1/flashcards/" + id, HttpMethod.PUT,
                new HttpEntity<>(updateBody, authFor(userA)), Flashcard.class);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody().getQuestion()).isEqualTo("Q2");

        // Batch-get as A
        ResponseEntity<Flashcard[]> batch = rest.exchange(
                "/api/v1/flashcards/batch-get", HttpMethod.POST,
                new HttpEntity<>("{\"ids\":[\"" + id + "\"]}", authFor(userA)), Flashcard[].class);
        assertThat(batch.getBody()).hasSize(1);

        // Delete as A
        ResponseEntity<Void> deleted = rest.exchange(
                "/api/v1/flashcards/" + id, HttpMethod.DELETE,
                new HttpEntity<>(authFor(userA)), Void.class);
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Now gone
        ResponseEntity<String> afterDelete = rest.exchange(
                "/api/v1/flashcards/" + id, HttpMethod.GET,
                new HttpEntity<>(authFor(userA)), String.class);
        assertThat(afterDelete.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
