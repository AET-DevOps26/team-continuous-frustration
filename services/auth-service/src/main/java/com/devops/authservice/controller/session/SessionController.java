package com.devops.authservice.controller.session;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import com.devops.authservice.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class SessionController {

    private final SessionService sessionService;
    private final UserRepository userRepository;

    public SessionController(SessionService sessionService, UserRepository userRepository) {
        this.sessionService = sessionService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
        return extractSessionId(request)
                .flatMap(sessionService::validate)
                .flatMap(session -> userRepository.findById(session.getUserId()))
                .map(user -> ResponseEntity.ok(toMap(user)))
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        extractSessionId(request).ifPresent(sessionService::revoke);

        ResponseCookie clear = ResponseCookie.from("session_id", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clear.toString());

        return ResponseEntity.noContent().build();
    }

    private Optional<UUID> extractSessionId(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> "session_id".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .map(value -> {
                    try { return UUID.fromString(value); } catch (IllegalArgumentException e) { return null; }
                })
                .filter(id -> id != null);
    }

    private Map<String, Object> toMap(UserEntity user) {
        return Map.of(
                "id", user.getId().toString(),
                "email", user.getEmail(),
                "username", user.getUsername()
        );
    }
}
