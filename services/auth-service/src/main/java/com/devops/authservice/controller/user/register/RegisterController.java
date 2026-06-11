package com.devops.authservice.controller.user.register;

import com.devops.authservice.domain.user.register.RegisterInput;
import com.devops.authservice.domain.user.register.RegisterInteractor;
import com.devops.authservice.domain.user.register.RegisterOutput;
import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.model.RegisterRequest;
import com.devops.authservice.model.RegisterResponse;
import com.devops.authservice.service.SessionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/auth")
public class RegisterController {

    private final RegisterInteractor interactor;
    private final SessionService sessionService;

    public RegisterController(RegisterInteractor interactor, SessionService sessionService) {
        this.interactor = interactor;
        this.sessionService = sessionService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> registerUser(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        RegisterOutput output = interactor.execute(decode(request));

        SessionEntity session = sessionService.create(output.id());
        Duration maxAge = Duration.between(LocalDateTime.now(), session.getExpiresAt());
        ResponseCookie cookie = ResponseCookie.from("session_id", session.getId().toString())
                .httpOnly(true)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(encode(output));
    }

    private RegisterInput decode(RegisterRequest request) {
        return new RegisterInput(request.getEmail(), request.getPassword(), request.getUsername());
    }

    private RegisterResponse encode(RegisterOutput output) {
        RegisterResponse response = new RegisterResponse();
        response.setId(output.id());
        response.setEmail(output.email());
        response.setUsername(output.username());
        return response;
    }
}
