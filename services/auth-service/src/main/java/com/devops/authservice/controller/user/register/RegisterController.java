package com.devops.authservice.controller.user.register;

import com.devops.authservice.domain.user.register.RegisterInput;
import com.devops.authservice.domain.user.register.RegisterInteractor;
import com.devops.authservice.domain.user.register.RegisterOutput;
import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.model.RegisterRequest;
import com.devops.authservice.model.RegisterResponse;
import com.devops.authservice.service.SessionService;
import com.devops.authservice.service.TokenCookieService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class RegisterController {

    private final RegisterInteractor interactor;
    private final SessionService sessionService;
    private final TokenCookieService tokenCookieService;

    public RegisterController(RegisterInteractor interactor, SessionService sessionService,
                              TokenCookieService tokenCookieService) {
        this.interactor = interactor;
        this.sessionService = sessionService;
        this.tokenCookieService = tokenCookieService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> registerUser(
            @Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        RegisterOutput output = interactor.execute(decode(request));

        SessionEntity session = sessionService.create(output.id());
        tokenCookieService.issue(output.id(), output.email(), output.username(), session, response);

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
