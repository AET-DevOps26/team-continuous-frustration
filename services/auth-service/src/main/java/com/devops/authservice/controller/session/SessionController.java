package com.devops.authservice.controller.session;

import com.devops.authservice.service.JwtService;
import com.devops.authservice.service.SessionService;
import com.devops.authservice.service.TokenCookieService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class SessionController {

    private final JwtService jwtService;
    private final SessionService sessionService;
    private final TokenCookieService tokenCookieService;

    public SessionController(JwtService jwtService, SessionService sessionService,
                             TokenCookieService tokenCookieService) {
        this.jwtService = jwtService;
        this.sessionService = sessionService;
        this.tokenCookieService = tokenCookieService;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
        return extractAccessToken(request)
                .flatMap(token -> {
                    try {
                        Claims claims = jwtService.getClaims(token);
                        return Optional.of(Map.<String, Object>of(
                                "id", claims.getSubject(),
                                "email", claims.get("email", String.class),
                                "username", claims.get("username", String.class)
                        ));
                    } catch (JwtException e) {
                        return Optional.<Map<String, Object>>empty();
                    }
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        extractSessionId(request).ifPresent(sessionService::revoke);
        tokenCookieService.clearAll(response);
        return ResponseEntity.noContent().build();
    }

    private Optional<String> extractAccessToken(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> "access_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    private Optional<UUID> extractSessionId(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> "session_id".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .flatMap(value -> {
                    try { return Optional.of(UUID.fromString(value)); }
                    catch (IllegalArgumentException e) { return Optional.empty(); }
                });
    }
}
