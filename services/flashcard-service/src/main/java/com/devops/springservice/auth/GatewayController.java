package com.devops.springservice.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class GatewayController {

    @GetMapping("/api/v1/gateway/health")
    public Map<String, String> gatewayHealth() {
        return Map.of(
                "status", "UP",
                "service", "flashcard-service",
                "role", "auth-service-api-gateway");
    }
}