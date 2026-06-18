package com.devops.authservice.controller.session;

import com.devops.authservice.repository.UserRepository;
import com.devops.authservice.service.SessionService;
import com.devops.authservice.service.TokenCookieService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class RefreshController {

    private final SessionService sessionService;
    private final UserRepository userRepository;
    private final TokenCookieService tokenCookieService;

    public RefreshController(SessionService sessionService, UserRepository userRepository,
                             TokenCookieService tokenCookieService) {
        this.sessionService = sessionService;
        this.userRepository = userRepository;
        this.tokenCookieService = tokenCookieService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
        return extractSessionId(request)
                .flatMap(sessionService::validate)
                .flatMap(session -> userRepository.findById(session.getUserId())
                        .map(user -> {
                            tokenCookieService.issueAccessToken(
                                    user.getId(), user.getEmail(), user.getUsername(), response);
                            return ResponseEntity.<Void>ok().build();
                        }))
                .orElseGet(() -> ResponseEntity.status(401).build());
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
