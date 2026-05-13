package com.devops.springservice.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProtectedTestController {

    @GetMapping("/api/v1/protected/test")
    public String protectedTest() {
        return "You are authenticated";
    }
}