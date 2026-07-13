package com.devops.authservice.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-secret-key-that-is-at-least-32-bytes!!";
    private static final long EXPIRATION_MS = 900_000L;

    private final JwtService jwtService = new JwtService(SECRET, EXPIRATION_MS);

    @Test
    void generateThenParse_roundTripsAllClaims() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.generate(userId, "user@example.com", "alice");
        Claims claims = jwtService.getClaims(token);

        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("user@example.com");
        assertThat(claims.get("username", String.class)).isEqualTo("alice");
    }

    @Test
    void generatedToken_hasExpiryInTheFuture() {
        String token = jwtService.generate(UUID.randomUUID(), "user@example.com", "alice");
        Claims claims = jwtService.getClaims(token);

        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }

    @Test
    void getExpirationMs_returnsConfiguredValue() {
        assertThat(jwtService.getExpirationMs()).isEqualTo(EXPIRATION_MS);
    }

    @Test
    void getClaims_rejectsGarbageToken() {
        assertThatThrownBy(() -> jwtService.getClaims("not-a-jwt"))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void getClaims_rejectsTokenSignedWithDifferentKey() {
        JwtService otherIssuer = new JwtService("a-completely-different-secret-key-32b!!!", EXPIRATION_MS);
        String foreignToken = otherIssuer.generate(UUID.randomUUID(), "e@x.com", "bob");

        assertThatThrownBy(() -> jwtService.getClaims(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void getClaims_rejectsExpiredToken() {
        JwtService shortLived = new JwtService(SECRET, -1_000L);
        String expired = shortLived.generate(UUID.randomUUID(), "e@x.com", "bob");

        assertThatThrownBy(() -> jwtService.getClaims(expired))
                .isInstanceOf(JwtException.class);
    }
}
