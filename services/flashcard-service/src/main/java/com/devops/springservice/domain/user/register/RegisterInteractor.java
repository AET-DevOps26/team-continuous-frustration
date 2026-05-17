package com.devops.springservice.domain.user.register;

import com.devops.springservice.domain.user.exception.EmailAlreadyExistsException;
import com.devops.springservice.domain.user.exception.UsernameAlreadyExistsException;
import com.devops.springservice.entity.UserEntity;
import com.devops.springservice.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class RegisterInteractor {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public RegisterInteractor(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public RegisterOutput execute(RegisterInput input) {
        if (userRepository.existsByEmail(input.email())) {
            throw new EmailAlreadyExistsException(input.email());
        }
        if (userRepository.existsByUsername(input.username())) {
            throw new UsernameAlreadyExistsException(input.username());
        }

        UserEntity user = new UserEntity();
        user.setEmail(input.email());
        user.setUsername(input.username());
        user.setPasswordHash(passwordEncoder.encode(input.password()));

        UserEntity saved = userRepository.save(user);

        return new RegisterOutput(saved.getId(), saved.getEmail(), saved.getUsername());
    }
}
