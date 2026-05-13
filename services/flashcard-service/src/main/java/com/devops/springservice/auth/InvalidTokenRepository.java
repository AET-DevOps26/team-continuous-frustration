package com.devops.springservice.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InvalidTokenRepository extends JpaRepository<InvalidTokenEntity, UUID> {

    boolean existsByToken(String token);
}