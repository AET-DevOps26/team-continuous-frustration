package com.devops.apigateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class SessionAuthGlobalFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/api/v1/auth/",
            "/oauth2/",
            "/login/oauth2/"
    );

    private final WebClient authClient;

    public SessionAuthGlobalFilter(@Value("${auth.service.url}") String authServiceUrl) {
        this.authClient = WebClient.builder().baseUrl(authServiceUrl).build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (PUBLIC_PREFIXES.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        HttpCookie sessionCookie = exchange.getRequest().getCookies().getFirst("session_id");
        if (sessionCookie == null) {
            return reject(exchange);
        }

        return authClient.get()
                .uri("/api/v1/auth/me")
                .cookie("session_id", sessionCookie.getValue())
                .retrieve()
                .toBodilessEntity()
                .flatMap(resp -> chain.filter(exchange))
                .onErrorResume(ex -> reject(exchange));
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
