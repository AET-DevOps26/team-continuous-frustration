package com.devops.authservice.domain.user.register;

import java.util.UUID;

public record RegisterOutput(UUID id, String email, String username) {}
