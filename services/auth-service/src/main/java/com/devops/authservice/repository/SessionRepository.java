package com.devops.authservice.repository;

import com.devops.authservice.entity.SessionEntity;
import com.devops.authservice.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<SessionEntity, UUID> {

    Optional<SessionEntity> findByIdAndStatus(UUID id, SessionStatus status);
}
