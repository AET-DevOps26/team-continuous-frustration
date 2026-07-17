package com.devops.apigateway;

import com.github.tomakehurst.wiremock.WireMockServer;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.any;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;

/**
 * Acceptance tests for the gateway: start it for real and route to a WireMock
 * stub standing in for every downstream service. Verifies routing, edge
 * authentication (reject / forward), identity-header injection, public-path
 * bypass, and the transparent access-token refresh via the session cookie.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GatewayRoutingAcceptanceTest {

    private static final String SECRET = "gateway-acceptance-secret-at-least-32-bytes!!";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes());

    private static final WireMockServer BACKEND = new WireMockServer(options().dynamicPort());

    @LocalServerPort
    private int port;

    private WebTestClient client;

    @BeforeAll
    static void startBackend() {
        BACKEND.start();
    }

    @AfterAll
    static void stopBackend() {
        BACKEND.stop();
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        String base = "http://localhost:" + BACKEND.port();
        registry.add("JWT_SECRET", () -> SECRET);
        registry.add("AUTH_SERVICE_URL", () -> base);
        registry.add("FLASHCARD_SERVICE_URL", () -> base);
        registry.add("GENAI_SERVICE_URL", () -> base);
        registry.add("UPLOAD_SERVICE_URL", () -> base);
    }

    @BeforeEach
    void setUp() {
        client = WebTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
        BACKEND.resetAll();
        // Default: any downstream call succeeds.
        BACKEND.stubFor(any(anyUrl()).atPriority(10)
                .willReturn(aResponse().withStatus(200).withBody("downstream-ok")));
    }

    private String token(UUID userId, long ttlMillis) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", "user@example.com")
                .claim("username", "alice")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttlMillis))
                .signWith(KEY)
                .compact();
    }

    @Test
    void protectedRouteWithoutCookieIsRejected() {
        client.get().uri("/api/v1/flashcards").exchange()
                .expectStatus().isUnauthorized();

        BACKEND.verify(0, getRequestedFor(urlEqualTo("/api/v1/flashcards")));
    }

    @Test
    void validTokenIsForwardedWithUserHeaders() {
        UUID userId = UUID.randomUUID();

        client.get().uri("/api/v1/flashcards")
                .cookie("access_token", token(userId, 900_000L))
                .exchange()
                .expectStatus().isOk();

        BACKEND.verify(getRequestedFor(urlEqualTo("/api/v1/flashcards"))
                .withHeader("X-User-Id", equalTo(userId.toString())));
    }

    @Test
    void publicAuthRouteIsForwardedWithoutAuthentication() {
        client.post().uri("/api/v1/auth/login")
                .bodyValue("{}")
                .exchange()
                .expectStatus().isOk();

        BACKEND.verify(postRequestedFor(urlEqualTo("/api/v1/auth/login")));
    }

    @Test
    void expiredTokenIsRefreshedViaSessionThenForwarded() {
        UUID userId = UUID.randomUUID();
        String freshToken = token(userId, 900_000L);

        // Auth service issues a fresh access token cookie on refresh.
        BACKEND.stubFor(post(urlEqualTo("/api/v1/auth/refresh")).atPriority(1)
                .willReturn(aResponse().withStatus(200)
                        .withHeader("Set-Cookie", "access_token=" + freshToken + "; Path=/; HttpOnly")));

        client.get().uri("/api/v1/flashcards")
                .cookie("access_token", token(userId, -1_000L)) // already expired
                .cookie("session_id", UUID.randomUUID().toString())
                .exchange()
                .expectStatus().isOk();

        BACKEND.verify(postRequestedFor(urlEqualTo("/api/v1/auth/refresh")));
        BACKEND.verify(getRequestedFor(urlEqualTo("/api/v1/flashcards"))
                .withHeader("X-User-Id", equalTo(userId.toString())));
    }
}
