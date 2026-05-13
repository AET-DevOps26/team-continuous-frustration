package com.devops.springservice.auth;

public class LogoutResponse {

    private String message;

    public LogoutResponse() {
    }

    public LogoutResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}