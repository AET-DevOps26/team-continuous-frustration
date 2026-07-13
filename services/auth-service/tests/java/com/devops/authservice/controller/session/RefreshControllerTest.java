package com.devops.authservice.controller.session;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import com.devops.authservice.service.SessionService;
import com.devops.authservice.service.TokenCookieService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

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
class RefreshControllerTest {

    @Mock
    private SessionService sessionService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TokenCookieService tokenCookieService;

    private RefreshController controller;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        controller = new RefreshController(sessionService, userRepository, tokenCookieService);
    }

    @Test
    void refresh_issuesNewAccessToken_whenSessionAndUserValid() {
        UUID sessionId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        SessionEntity session = mock(SessionEntity.class);
        when(session.getUserId()).thenReturn(userId);
        when(sessionService.validate(sessionId)).thenReturn(Optional.of(session));

        UserEntity user = mock(UserEntity.class);
        when(user.getId()).thenReturn(userId);
        when(user.getEmail()).thenReturn("user@example.com");
        when(user.getUsername()).thenReturn("alice");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("session_id", sessionId.toString()));
        MockHttpServletResponse response = new MockHttpServletResponse();

        ResponseEntity<Void> result = controller.refresh(request, response);

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        verify(tokenCookieService).issueAccessToken(eq(userId), eq("user@example.com"), eq("alice"),
                eq(response));
    }

    @Test
    void refresh_returns401_whenNoSessionCookie() {
        ResponseEntity<Void> result =
                controller.refresh(new MockHttpServletRequest(), new MockHttpServletResponse());

        assertThat(result.getStatusCode().value()).isEqualTo(401);
        verify(tokenCookieService, never()).issueAccessToken(any(), any(), any(), any());
    }

    @Test
    void refresh_returns401_whenSessionCookieIsNotAUuid() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("session_id", "not-a-uuid"));

        ResponseEntity<Void> result = controller.refresh(request, new MockHttpServletResponse());

        assertThat(result.getStatusCode().value()).isEqualTo(401);
        verify(sessionService, never()).validate(any());
    }

    @Test
    void refresh_returns401_whenSessionInvalid() {
        UUID sessionId = UUID.randomUUID();
        when(sessionService.validate(sessionId)).thenReturn(Optional.empty());
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("session_id", sessionId.toString()));

        ResponseEntity<Void> result = controller.refresh(request, new MockHttpServletResponse());

        assertThat(result.getStatusCode().value()).isEqualTo(401);
        verify(tokenCookieService, never()).issueAccessToken(any(), any(), any(), any());
    }

    @Test
    void refresh_returns401_whenUserMissing() {
        UUID sessionId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SessionEntity session = mock(SessionEntity.class);
        when(session.getUserId()).thenReturn(userId);
        when(sessionService.validate(sessionId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("session_id", sessionId.toString()));

        ResponseEntity<Void> result = controller.refresh(request, new MockHttpServletResponse());

        assertThat(result.getStatusCode().value()).isEqualTo(401);
        verify(tokenCookieService, never()).issueAccessToken(any(), any(), any(), any());
    }
}
