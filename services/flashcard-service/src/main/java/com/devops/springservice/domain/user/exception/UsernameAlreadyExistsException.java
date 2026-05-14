package com.devops.springservice.domain.user.exception;

public class UsernameAlreadyExistsException extends RuntimeException {
    public UsernameAlreadyExistsException(String username) {
        super("Username already in use: " + username);
    }
}
