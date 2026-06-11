package com.devops.authservice.service;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.SessionStatus;
import com.devops.authservice.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final long expirationMs;

    public SessionService(
            SessionRepository sessionRepository,
            @Value("${session.expiration-ms:86400000}") long expirationMs) {
        this.sessionRepository = sessionRepository;
        this.expirationMs = expirationMs;
    }

    public SessionEntity create(UUID userId) {
        LocalDateTime now = LocalDateTime.now();
        SessionEntity session = new SessionEntity();
        session.setId(UUID.randomUUID());
        session.setUserId(userId);
        session.setStatus(SessionStatus.ACTIVE);
        session.setCreatedAt(now);
        session.setLastUsedAt(now);
        session.setExpiresAt(now.plus(expirationMs, ChronoUnit.MILLIS));
        return sessionRepository.save(session);
    }

    public Optional<SessionEntity> validate(UUID sessionId) {
        return sessionRepository.findByIdAndStatus(sessionId, SessionStatus.ACTIVE)
                .filter(s -> s.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(s -> {
                    s.setLastUsedAt(LocalDateTime.now());
                    return sessionRepository.save(s);
                });
    }

    public void revoke(UUID sessionId) {
        sessionRepository.findById(sessionId).ifPresent(s -> {
            s.setStatus(SessionStatus.REVOKED);
            sessionRepository.save(s);
        });
    }
}
