package com.devops.springservice.controller.user.register;

import com.devops.springservice.api.AuthApi;
import com.devops.springservice.domain.user.register.RegisterInput;
import com.devops.springservice.domain.user.register.RegisterInteractor;
import com.devops.springservice.domain.user.register.RegisterOutput;
import com.devops.springservice.model.RegisterRequest;
import com.devops.springservice.model.RegisterResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RegisterController implements AuthApi {

    private final RegisterInteractor interactor;

    public RegisterController(RegisterInteractor interactor) {
        this.interactor = interactor;
    }

    @Override
    public ResponseEntity<RegisterResponse> registerUser(RegisterRequest request) {
        RegisterInput input = decode(request);
        RegisterOutput output = interactor.execute(input);
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
