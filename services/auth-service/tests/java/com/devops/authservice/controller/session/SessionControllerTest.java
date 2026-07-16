package com.devops.authservice.controller.session;

import com.devops.authservice.service.JwtService;
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

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class SessionControllerTest {

    private final JwtService jwtService =
            new JwtService("test-secret-key-that-is-at-least-32-bytes!!", 900_000L);

    @Mock
    private SessionService sessionService;
    @Mock
    private TokenCookieService tokenCookieService;

    private SessionController controller;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        controller = new SessionController(jwtService, sessionService, tokenCookieService);
    }

    @Test
    void me_returnsClaims_whenAccessTokenValid() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generate(userId, "user@example.com", "alice");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("access_token", token));

        ResponseEntity<Map<String, Object>> result = controller.me(request);

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody()).containsEntry("id", userId.toString())
                .containsEntry("email", "user@example.com")
                .containsEntry("username", "alice");
    }

    @Test
    void me_returns401_whenNoCookiePresent() {
        ResponseEntity<Map<String, Object>> result = controller.me(new MockHttpServletRequest());
        assertThat(result.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void me_returns401_whenTokenInvalid() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("access_token", "garbage.token.value"));

        ResponseEntity<Map<String, Object>> result = controller.me(request);

        assertThat(result.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void logout_revokesSession_clearsCookies_andReturns204() {
        UUID sessionId = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("session_id", sessionId.toString()));
        MockHttpServletResponse response = new MockHttpServletResponse();

        ResponseEntity<Void> result = controller.logout(request, response);

        assertThat(result.getStatusCode().value()).isEqualTo(204);
        verify(sessionService).revoke(sessionId);
        verify(tokenCookieService).clearAll(response);
    }

    @Test
    void logout_stillClearsCookies_whenNoSessionCookie() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        ResponseEntity<Void> result = controller.logout(new MockHttpServletRequest(), response);

        assertThat(result.getStatusCode().value()).isEqualTo(204);
        verifyNoInteractions(sessionService);
        verify(tokenCookieService).clearAll(response);
    }
}
