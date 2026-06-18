package com.devops.springservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
public class SessionAuthFilter extends OncePerRequestFilter {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String authServiceUrl;

    public SessionAuthFilter(@Value("${auth.service.url}") String authServiceUrl) {
        this.authServiceUrl = authServiceUrl;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        extractSessionId(request).ifPresent(sessionId -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.COOKIE, "session_id=" + sessionId);
                ResponseEntity<Void> authResponse = restTemplate.exchange(
                        authServiceUrl + "/api/v1/auth/me",
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        Void.class
                );
                if (authResponse.getStatusCode().is2xxSuccessful()) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            sessionId, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (HttpClientErrorException ignored) {
                // Session invalid or expired — proceed unauthenticated
            }
        });

        filterChain.doFilter(request, response);
    }

    private Optional<String> extractSessionId(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> "session_id".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
