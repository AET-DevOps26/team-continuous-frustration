package com.devops.springservice.auth;

public class AuthResponse {

    private String userId;
    private String username;
    private String email;
    private String token;

    public AuthResponse() {
    }

    public AuthResponse(String userId, String username, String email, String token) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }
}