package com.devops.authservice.config;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import com.devops.authservice.service.SessionService;
import com.devops.authservice.service.TokenCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final SessionService sessionService;
    private final TokenCookieService tokenCookieService;
    private final String frontendUrl;

    public OAuth2SuccessHandler(UserRepository userRepository, SessionService sessionService,
                                TokenCookieService tokenCookieService,
                                @Value("${frontend.url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.sessionService = sessionService;
        this.tokenCookieService = tokenCookieService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String googleId = oAuth2User.getAttribute("sub");

        UserEntity user = userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new IllegalStateException("User not found after OAuth2 login"));

        SessionEntity session = sessionService.create(user.getId());
        tokenCookieService.issue(user.getId(), user.getEmail(), user.getUsername(), session, response);

        response.sendRedirect(frontendUrl + "/oauth-callback");
    }
}
