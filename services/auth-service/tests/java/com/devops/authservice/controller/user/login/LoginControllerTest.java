package com.devops.authservice.controller.user.login;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import com.devops.authservice.service.SessionService;
import com.devops.authservice.service.TokenCookieService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginControllerTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private SessionService sessionService;
    @Mock
    private TokenCookieService tokenCookieService;

    private LoginController controller;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        controller = new LoginController(userRepository, sessionService, tokenCookieService);
    }

    @Test
    void login_succeeds_withCorrectCredentials_andIssuesCookies() {
        UUID userId = UUID.randomUUID();
        String hash = new BCryptPasswordEncoder().encode("correct-password");
        UserEntity user = mock(UserEntity.class);
        when(user.getId()).thenReturn(userId);
        when(user.getEmail()).thenReturn("user@example.com");
        when(user.getUsername()).thenReturn("alice");
        when(user.getPasswordHash()).thenReturn(hash);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        SessionEntity session = mock(SessionEntity.class);
        when(sessionService.create(userId)).thenReturn(session);

        MockHttpServletResponse response = new MockHttpServletResponse();
        ResponseEntity<Map<String, Object>> result = controller.login(
                new LoginController.LoginRequest("user@example.com", "correct-password"), response);

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody()).containsEntry("email", "user@example.com")
                .containsEntry("username", "alice")
                .containsEntry("id", userId.toString());
        verify(tokenCookieService).issue(eq(userId), eq("user@example.com"), eq("alice"),
                eq(session), any(MockHttpServletResponse.class));
    }

    @Test
    void login_returns401_whenUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        ResponseEntity<Map<String, Object>> result = controller.login(
                new LoginController.LoginRequest("missing@example.com", "whatever"),
                new MockHttpServletResponse());

        assertThat(result.getStatusCode().value()).isEqualTo(401);
        assertThat(result.getBody()).containsEntry("code", "INVALID_CREDENTIALS");
        verify(sessionService, never()).create(any());
        verify(tokenCookieService, never()).issue(any(), any(), any(), any(), any());
    }

    @Test
    void login_returns401_whenPasswordDoesNotMatch() {
        String hash = new BCryptPasswordEncoder().encode("the-real-password");
        UserEntity user = mock(UserEntity.class);
        when(user.getPasswordHash()).thenReturn(hash);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ResponseEntity<Map<String, Object>> result = controller.login(
                new LoginController.LoginRequest("user@example.com", "wrong-password"),
                new MockHttpServletResponse());

        assertThat(result.getStatusCode().value()).isEqualTo(401);
        assertThat(result.getBody()).containsEntry("code", "INVALID_CREDENTIALS");
        verify(tokenCookieService, never()).issue(any(), any(), any(), any(), any());
    }

    @Test
    void login_returns401_whenAccountHasNoPassword() {
        UserEntity user = mock(UserEntity.class);
        when(user.getPasswordHash()).thenReturn(null);
        when(userRepository.findByEmail("oauth@example.com")).thenReturn(Optional.of(user));

        ResponseEntity<Map<String, Object>> result = controller.login(
                new LoginController.LoginRequest("oauth@example.com", "anything"),
                new MockHttpServletResponse());

        assertThat(result.getStatusCode().value()).isEqualTo(401);
        verify(tokenCookieService, never()).issue(any(), any(), any(), any(), any());
    }
}
