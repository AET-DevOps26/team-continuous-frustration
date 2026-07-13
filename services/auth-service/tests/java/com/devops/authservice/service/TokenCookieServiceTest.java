package com.devops.authservice.service;

import com.devops.authservice.entity.SessionEntity;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TokenCookieServiceTest {

    private final JwtService jwtService =
            new JwtService("test-secret-key-that-is-at-least-32-bytes!!", 900_000L);
    private final TokenCookieService service = new TokenCookieService(jwtService);

    @Test
    void issue_setsHttpOnlySecureSessionAndAccessCookies() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        SessionEntity session = new SessionEntity();
        session.setId(UUID.randomUUID());
        session.setExpiresAt(LocalDateTime.now().plusDays(1));

        service.issue(UUID.randomUUID(), "user@example.com", "alice", session, response);

        List<String> cookies = response.getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(cookies).hasSize(2);
        assertThat(cookies).anySatisfy(c -> assertThat(c)
                .startsWith("session_id=" + session.getId())
                .contains("HttpOnly").contains("Secure").contains("SameSite=Lax"));
        assertThat(cookies).anySatisfy(c -> assertThat(c)
                .startsWith("access_token=")
                .contains("HttpOnly").contains("Secure").contains("SameSite=Lax"));
    }

    @Test
    void issueAccessToken_setsOnlyAccessCookieWithValidJwt() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        UUID userId = UUID.randomUUID();

        service.issueAccessToken(userId, "user@example.com", "alice", response);

        List<String> cookies = response.getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(cookies).hasSize(1);
        String accessCookie = cookies.get(0);
        assertThat(accessCookie).startsWith("access_token=");

        String jwt = accessCookie.substring("access_token=".length(), accessCookie.indexOf(';'));
        assertThat(jwtService.getClaims(jwt).getSubject()).isEqualTo(userId.toString());
    }

    @Test
    void clearAll_expiresBothCookies() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.clearAll(response);

        List<String> cookies = response.getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(cookies).hasSize(2);
        assertThat(cookies).allSatisfy(c -> assertThat(c).contains("Max-Age=0"));
        assertThat(cookies).anySatisfy(c -> assertThat(c).startsWith("session_id="));
        assertThat(cookies).anySatisfy(c -> assertThat(c).startsWith("access_token="));
    }
}
