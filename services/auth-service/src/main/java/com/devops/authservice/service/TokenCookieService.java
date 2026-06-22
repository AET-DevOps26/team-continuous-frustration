package com.devops.authservice.service;

import com.devops.authservice.entity.SessionEntity;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TokenCookieService {

    private final JwtService jwtService;

    public TokenCookieService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public void issue(UUID userId, String email, String username, SessionEntity session, HttpServletResponse response) {
        Duration sessionMaxAge = Duration.between(LocalDateTime.now(), session.getExpiresAt());
        ResponseCookie refreshCookie = ResponseCookie.from("session_id", session.getId().toString())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(sessionMaxAge)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        String accessToken = jwtService.generate(userId, email, username);
        ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofMillis(jwtService.getExpirationMs()))
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
    }

    public void issueAccessToken(UUID userId, String email, String username, HttpServletResponse response) {
        String accessToken = jwtService.generate(userId, email, username);
        ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofMillis(jwtService.getExpirationMs()))
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
    }

    public void clearAll(HttpServletResponse response) {
        ResponseCookie clearSession = ResponseCookie.from("session_id", "")
                .httpOnly(true).secure(true).path("/").maxAge(0).sameSite("Lax").build();
        ResponseCookie clearAccess = ResponseCookie.from("access_token", "")
                .httpOnly(true).secure(true).path("/").maxAge(0).sameSite("Lax").build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearSession.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
    }
}
