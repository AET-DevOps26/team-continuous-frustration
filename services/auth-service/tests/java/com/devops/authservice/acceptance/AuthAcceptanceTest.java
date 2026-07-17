package com.devops.authservice.acceptance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Acceptance tests driving the auth service over HTTP against a real PostgreSQL.
 * Exercises the end-to-end authentication flows exactly as a client would:
 * registration, session cookies, /me, token refresh, login, and logout.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class AuthAcceptanceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    private static final String PASSWORD = "Password123!";

    private String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@test.local";
    }

    private ResponseEntity<String> register(String email, String username) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"email\":\"%s\",\"username\":\"%s\",\"password\":\"%s\"}"
                .formatted(email, username, PASSWORD);
        return rest.exchange("/api/v1/auth/register", HttpMethod.POST,
                new HttpEntity<>(body, headers), String.class);
    }

    private Map<String, String> cookiesFrom(ResponseEntity<?> response) {
        Map<String, String> jar = new HashMap<>();
        List<String> setCookies = response.getHeaders().get(HttpHeaders.SET_COOKIE);
        if (setCookies != null) {
            for (String setCookie : setCookies) {
                String pair = setCookie.split(";", 2)[0];
                int eq = pair.indexOf('=');
                if (eq > 0) {
                    jar.put(pair.substring(0, eq), pair.substring(eq + 1));
                }
            }
        }
        return jar;
    }

    private HttpHeaders withCookies(Map<String, String> jar) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String cookie = jar.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("; "));
        if (!cookie.isBlank()) {
            headers.add(HttpHeaders.COOKIE, cookie);
        }
        return headers;
    }

    @Test
    void registerIssuesSessionCookiesAndMeReturnsUser() {
        String email = uniqueEmail();
        ResponseEntity<String> registered = register(email, "user" + System.nanoTime());

        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, String> jar = cookiesFrom(registered);
        assertThat(jar).containsKeys("access_token", "session_id");

        ResponseEntity<String> me = rest.exchange("/api/v1/auth/me", HttpMethod.GET,
                new HttpEntity<>(withCookies(jar)), String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody()).contains(email);
    }

    @Test
    void meWithoutCookieIsUnauthorized() {
        ResponseEntity<String> me = rest.getForEntity("/api/v1/auth/me", String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refreshRotatesAccessTokenFromSession() {
        Map<String, String> jar = cookiesFrom(register(uniqueEmail(), "user" + System.nanoTime()));

        ResponseEntity<String> refreshed = rest.exchange("/api/v1/auth/refresh", HttpMethod.POST,
                new HttpEntity<>(withCookies(jar)), String.class);

        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cookiesFrom(refreshed)).containsKey("access_token");
    }

    @Test
    void loginWithWrongPasswordIsUnauthorized() {
        String email = uniqueEmail();
        register(email, "user" + System.nanoTime());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> login = rest.exchange("/api/v1/auth/login", HttpMethod.POST,
                new HttpEntity<>("{\"email\":\"" + email + "\",\"password\":\"wrong\"}", headers), String.class);

        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void loginWithValidCredentialsSucceeds() {
        String email = uniqueEmail();
        register(email, "user" + System.nanoTime());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> login = rest.exchange("/api/v1/auth/login", HttpMethod.POST,
                new HttpEntity<>("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}", headers),
                String.class);

        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cookiesFrom(login)).containsKeys("access_token", "session_id");
        assertThat(login.getBody()).contains(email);
    }

    @Test
    void logoutRevokesSessionSoRefreshFails() {
        Map<String, String> jar = cookiesFrom(register(uniqueEmail(), "user" + System.nanoTime()));

        ResponseEntity<Void> logout = rest.exchange("/api/v1/auth/logout", HttpMethod.POST,
                new HttpEntity<>(withCookies(jar)), Void.class);
        assertThat(logout.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // The session is revoked, so a refresh with the same session_id is rejected.
        ResponseEntity<String> refresh = rest.exchange("/api/v1/auth/refresh", HttpMethod.POST,
                new HttpEntity<>(withCookies(jar)), String.class);
        assertThat(refresh.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void duplicateEmailIsRejected() {
        String email = uniqueEmail();
        assertThat(register(email, "user" + System.nanoTime()).getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> duplicate = register(email, "user" + System.nanoTime());
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }
}
