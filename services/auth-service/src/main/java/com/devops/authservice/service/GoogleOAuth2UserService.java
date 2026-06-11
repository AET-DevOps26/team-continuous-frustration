package com.devops.authservice.service;

import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GoogleOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public GoogleOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User oAuth2User = super.loadUser(request);

        String googleId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        UserEntity user = userRepository.findByGoogleId(googleId).orElseGet(() -> {
            UserEntity newUser = new UserEntity();
            newUser.setGoogleId(googleId);
            newUser.setEmail(email);
            newUser.setUsername(deriveUsername(email, name));
            newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            return userRepository.save(newUser);
        });

        if (user.getPasswordHash() == null) {
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            userRepository.save(user);
        }

        return oAuth2User;
    }

    private String deriveUsername(String email, String name) {
        String base = email != null
                ? email.split("@")[0]
                : name.replaceAll("\\s+", "_").toLowerCase();
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }
}
