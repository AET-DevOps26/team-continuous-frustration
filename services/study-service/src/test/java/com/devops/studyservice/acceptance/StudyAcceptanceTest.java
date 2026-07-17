package com.devops.studyservice.acceptance;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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
 * Acceptance tests driving the study service over HTTP against a real
 * PostgreSQL, authenticating with a signed JWT cookie. Exercises the deck
 * lifecycle, deck-flashcard membership, study-status updates, and per-user
 * isolation end-to-end.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class StudyAcceptanceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final String userA = UUID.randomUUID().toString();
    private final String userB = UUID.randomUUID().toString();

    private HttpHeaders authFor(String userId) {
        String token = Jwts.builder()
                .subject(userId)
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.COOKIE, "access_token=" + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String createDeck(String userId, String name) throws Exception {
        ResponseEntity<String> response = rest.exchange("/api/v1/decks", HttpMethod.POST,
                new HttpEntity<>("{\"name\":\"" + name + "\",\"tags\":[\"cs\"]}", authFor(userId)), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return objectMapper.readTree(response.getBody()).get("id").asText();
    }

    @Test
    void unauthenticatedIsRejected() {
        ResponseEntity<String> response = rest.getForEntity("/api/v1/decks", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void deckLifecycleWithUserIsolation() throws Exception {
        String deckId = createDeck(userA, "Algorithms");

        // Owner sees the deck in their list
        ResponseEntity<String> list = rest.exchange("/api/v1/decks", HttpMethod.GET,
                new HttpEntity<>(authFor(userA)), String.class);
        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(list.getBody()).contains(deckId);

        // Owner can fetch it; another user cannot
        assertThat(rest.exchange("/api/v1/decks/" + deckId, HttpMethod.GET,
                new HttpEntity<>(authFor(userA)), String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rest.exchange("/api/v1/decks/" + deckId, HttpMethod.GET,
                new HttpEntity<>(authFor(userB)), String.class).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void flashcardMembershipAndStudyStatusFlow() throws Exception {
        String deckId = createDeck(userA, "Databases");
        String flashcardId = UUID.randomUUID().toString();

        // Add a flashcard to the deck
        ResponseEntity<String> added = rest.exchange("/api/v1/decks/" + deckId + "/flashcards", HttpMethod.POST,
                new HttpEntity<>("{\"flashcard_id\":\"" + flashcardId + "\"}", authFor(userA)), String.class);
        assertThat(added.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // It shows up in the deck's flashcard id list
        ResponseEntity<String> ids = rest.exchange("/api/v1/decks/" + deckId + "/flashcards", HttpMethod.GET,
                new HttpEntity<>(authFor(userA)), String.class);
        assertThat(ids.getBody()).contains(flashcardId);

        // Report a study result (spaced repetition), then remove it
        ResponseEntity<String> studied = rest.exchange(
                "/api/v1/decks/" + deckId + "/flashcards/" + flashcardId + "/study-status", HttpMethod.PATCH,
                new HttpEntity<>("{\"study_status\":\"good\"}", authFor(userA)), String.class);
        assertThat(studied.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Void> deleted = rest.exchange(
                "/api/v1/decks/" + deckId + "/flashcards/" + flashcardId + "/study-status", HttpMethod.DELETE,
                new HttpEntity<>(authFor(userA)), Void.class);
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
