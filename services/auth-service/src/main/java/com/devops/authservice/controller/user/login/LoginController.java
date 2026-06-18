package com.devops.authservice.controller.user.login;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import com.devops.authservice.service.SessionService;
import com.devops.authservice.service.TokenCookieService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class LoginController {

    private final UserRepository userRepository;
    private final SessionService sessionService;
    private final TokenCookieService tokenCookieService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public LoginController(UserRepository userRepository, SessionService sessionService,
                           TokenCookieService tokenCookieService) {
        this.userRepository = userRepository;
        this.sessionService = sessionService;
        this.tokenCookieService = tokenCookieService;
    }

    record LoginRequest(String email, String password) {}

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        UserEntity user = userRepository.findByEmail(request.email()).orElse(null);

        if (user == null || user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401)
                    .body(Map.of("code", "INVALID_CREDENTIALS", "message", "Invalid email or password."));
        }

        SessionEntity session = sessionService.create(user.getId());
        tokenCookieService.issue(user.getId(), user.getEmail(), user.getUsername(), session, response);

        return ResponseEntity.ok(Map.of(
                "id", user.getId().toString(),
                "email", user.getEmail(),
                "username", user.getUsername()
        ));
    }
}
