package com.devops.authservice.service;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.SessionStatus;
import com.devops.authservice.repository.SessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    private static final long EXPIRATION_MS = 86_400_000L;

    @Mock
    private SessionRepository sessionRepository;

    private SessionService sessionService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        sessionService = new SessionService(sessionRepository, EXPIRATION_MS);
    }

    @Test
    void create_persistsActiveSessionWithFutureExpiry() {
        UUID userId = UUID.randomUUID();
        when(sessionRepository.save(any(SessionEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        SessionEntity created = sessionService.create(userId);

        ArgumentCaptor<SessionEntity> captor = ArgumentCaptor.forClass(SessionEntity.class);
        verify(sessionRepository).save(captor.capture());
        SessionEntity saved = captor.getValue();

        assertThat(created).isSameAs(saved);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getStatus()).isEqualTo(SessionStatus.ACTIVE);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(saved.getExpiresAt()).isAfter(saved.getCreatedAt());
    }

    @Test
    void validate_returnsSessionAndBumpsLastUsed_whenActiveAndNotExpired() {
        UUID sessionId = UUID.randomUUID();
        SessionEntity session = activeSession(sessionId, LocalDateTime.now().plusHours(1));
        when(sessionRepository.findByIdAndStatus(sessionId, SessionStatus.ACTIVE))
                .thenReturn(Optional.of(session));
        when(sessionRepository.save(any(SessionEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<SessionEntity> result = sessionService.validate(sessionId);

        assertThat(result).isPresent();
        verify(sessionRepository).save(session);
    }

    @Test
    void validate_returnsEmpty_whenSessionExpired() {
        UUID sessionId = UUID.randomUUID();
        SessionEntity expired = activeSession(sessionId, LocalDateTime.now().minusMinutes(1));
        when(sessionRepository.findByIdAndStatus(sessionId, SessionStatus.ACTIVE))
                .thenReturn(Optional.of(expired));

        Optional<SessionEntity> result = sessionService.validate(sessionId);

        assertThat(result).isEmpty();
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void validate_returnsEmpty_whenNoActiveSessionFound() {
        UUID sessionId = UUID.randomUUID();
        when(sessionRepository.findByIdAndStatus(sessionId, SessionStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThat(sessionService.validate(sessionId)).isEmpty();
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void revoke_marksSessionRevoked_whenPresent() {
        UUID sessionId = UUID.randomUUID();
        SessionEntity session = activeSession(sessionId, LocalDateTime.now().plusHours(1));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        sessionService.revoke(sessionId);

        assertThat(session.getStatus()).isEqualTo(SessionStatus.REVOKED);
        verify(sessionRepository).save(session);
    }

    @Test
    void revoke_isNoOp_whenSessionMissing() {
        UUID sessionId = UUID.randomUUID();
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        sessionService.revoke(sessionId);

        verify(sessionRepository, never()).save(any());
    }

    private SessionEntity activeSession(UUID id, LocalDateTime expiresAt) {
        SessionEntity session = new SessionEntity();
        session.setId(id);
        session.setUserId(UUID.randomUUID());
        session.setStatus(SessionStatus.ACTIVE);
        session.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        session.setLastUsedAt(LocalDateTime.now().minusMinutes(5));
        session.setExpiresAt(expiresAt);
        return session;
    }
}
