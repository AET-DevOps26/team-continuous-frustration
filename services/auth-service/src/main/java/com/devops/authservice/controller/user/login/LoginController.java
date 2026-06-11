package com.devops.authservice.controller.user.login;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import com.devops.authservice.service.SessionService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class LoginController {

    private final UserRepository userRepository;
    private final SessionService sessionService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public LoginController(UserRepository userRepository, SessionService sessionService) {
        this.userRepository = userRepository;
        this.sessionService = sessionService;
    }

    record LoginRequest(String email, String password) {}

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequest request,
            HttpServletResponse response) {

        UserEntity user = userRepository.findByEmail(request.email()).orElse(null);

        if (user == null || user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401)
                    .body(Map.of("code", "INVALID_CREDENTIALS", "message", "Invalid email or password."));
        }

        SessionEntity session = sessionService.create(user.getId());
        Duration maxAge = Duration.between(LocalDateTime.now(), session.getExpiresAt());
        ResponseCookie cookie = ResponseCookie.from("session_id", session.getId().toString())
                .httpOnly(true)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(Map.of(
                "id", user.getId().toString(),
                "email", user.getEmail(),
                "username", user.getUsername()
        ));
    }
}
