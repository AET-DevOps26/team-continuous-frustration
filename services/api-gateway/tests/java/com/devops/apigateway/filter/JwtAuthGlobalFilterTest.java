package com.devops.apigateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthGlobalFilterTest {

    private static final String SECRET = "test-secret-key-that-is-at-least-32-bytes!!";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes());

    private final JwtAuthGlobalFilter filter =
            new JwtAuthGlobalFilter(SECRET, "http://localhost:1");

    private GatewayFilterChain chainReturning(Mono<Void> result) {
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(result);
        return chain;
    }

    private String validToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", "user@example.com")
                .claim("username", "alice")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 900_000L))
                .signWith(KEY)
                .compact();
    }

    @Test
    void publicPath_isForwardedWithoutAuthentication() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login"));
        GatewayFilterChain chain = chainReturning(Mono.empty());

        filter.filter(exchange, chain).block();

        verify(chain, times(1)).filter(exchange);
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void validAccessToken_forwardsWithUserHeaders() {
        UUID userId = UUID.randomUUID();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/flashcards")
                        .cookie(new HttpCookie("access_token", validToken(userId))));

        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, chain).block();

        org.mockito.ArgumentCaptor<ServerWebExchange> captor =
                org.mockito.ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(chain).filter(captor.capture());
        ServerHttpRequest forwarded = captor.getValue().getRequest();
        assertThat(forwarded.getHeaders().getFirst("X-User-Id")).isEqualTo(userId.toString());
        assertThat(forwarded.getHeaders().getFirst("X-User-Email")).isEqualTo("user@example.com");
        assertThat(forwarded.getHeaders().getFirst("X-User-Name")).isEqualTo("alice");
    }

    @Test
    void noCookies_isRejectedWith401() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/flashcards"));
        GatewayFilterChain chain = chainReturning(Mono.empty());

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void invalidAccessTokenWithoutSession_isRejectedWith401() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/flashcards")
                        .cookie(new HttpCookie("access_token", "garbage.token.value")));
        GatewayFilterChain chain = chainReturning(Mono.empty());

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void tokenSignedWithDifferentKey_isRejectedWith401() {
        SecretKey otherKey = Keys.hmacShaKeyFor("a-totally-different-secret-key-32-bytes!!".getBytes());
        String foreignToken = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("email", "user@example.com")
                .claim("username", "alice")
                .expiration(new Date(System.currentTimeMillis() + 900_000L))
                .signWith(otherKey)
                .compact();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/flashcards")
                        .cookie(new HttpCookie("access_token", foreignToken)));
        GatewayFilterChain chain = chainReturning(Mono.empty());

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void filterHasHighestPrecedenceOrder() {
        assertThat(filter.getOrder()).isEqualTo(-1);
    }
}
