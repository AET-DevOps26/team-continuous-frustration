package com.devops.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.List;

@Component
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthGlobalFilter.class);

    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/api/v1/auth/",
            "/oauth2/",
            "/login/oauth2/"
    );

    private final SecretKey key;
    private final WebClient authClient;

    public JwtAuthGlobalFilter(
            @Value("${jwt.secret}") String secret,
            @Value("${auth.service.url}") String authServiceUrl) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.authClient = WebClient.builder().baseUrl(authServiceUrl).build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (PUBLIC_PREFIXES.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        HttpCookie accessCookie = exchange.getRequest().getCookies().getFirst("access_token");

        if (accessCookie != null) {
            try {
                Claims claims = Jwts.parser().verifyWith(key).build()
                        .parseSignedClaims(accessCookie.getValue()).getPayload();
                return chain.filter(withUserHeaders(exchange, claims));
            } catch (ExpiredJwtException e) {
                return refreshThenForward(exchange, chain);
            } catch (JwtException e) {
                log.warn("Invalid JWT: {}", e.getMessage());
                return reject(exchange);
            }
        }

        HttpCookie sessionCookie = exchange.getRequest().getCookies().getFirst("session_id");
        if (sessionCookie != null) {
            return refreshThenForward(exchange, chain);
        }

        return reject(exchange);
    }

    private Mono<Void> refreshThenForward(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpCookie sessionCookie = exchange.getRequest().getCookies().getFirst("session_id");
        if (sessionCookie == null) {
            return reject(exchange);
        }

        return authClient.post()
                .uri("/api/v1/auth/refresh")
                .cookie("session_id", sessionCookie.getValue())
                .exchangeToMono(refreshResp -> {
                    if (!refreshResp.statusCode().is2xxSuccessful()) {
                        return refreshResp.releaseBody().then(reject(exchange));
                    }

                    List<String> setCookies = refreshResp.headers().asHttpHeaders()
                            .get(HttpHeaders.SET_COOKIE);

                    if (setCookies == null) {
                        return refreshResp.releaseBody().then(reject(exchange));
                    }

                    String newToken = setCookies.stream()
                            .filter(c -> c.startsWith("access_token="))
                            .map(c -> c.split(";")[0].substring("access_token=".length()))
                            .findFirst().orElse(null);

                    if (newToken == null) {
                        return refreshResp.releaseBody().then(reject(exchange));
                    }

                    try {
                        Claims claims = Jwts.parser().verifyWith(key).build()
                                .parseSignedClaims(newToken).getPayload();

                        // Forward new access_token cookie to client
                        String accessTokenSetCookie = setCookies.stream()
                                .filter(c -> c.startsWith("access_token="))
                                .findFirst().orElse(null);

                        return refreshResp.releaseBody().then(Mono.defer(() -> {
                            if (accessTokenSetCookie != null) {
                                exchange.getResponse().getHeaders()
                                        .add(HttpHeaders.SET_COOKIE, accessTokenSetCookie);
                            }
                            return chain.filter(withUserHeaders(exchange, claims));
                        }));
                    } catch (JwtException e) {
                        log.warn("Refreshed token is invalid: {}", e.getMessage());
                        return refreshResp.releaseBody().then(reject(exchange));
                    }
                })
                .onErrorResume(ex -> {
                    log.error("Refresh call failed: {}", ex.getMessage());
                    return reject(exchange);
                });
    }

    private ServerWebExchange withUserHeaders(ServerWebExchange exchange, Claims claims) {
        return exchange.mutate()
                .request(r -> r
                        .header("X-User-Id", claims.getSubject())
                        .header("X-User-Email", claims.get("email", String.class))
                        .header("X-User-Name", claims.get("username", String.class)))
                .build();
    }

    private Mono<Void> reject(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
