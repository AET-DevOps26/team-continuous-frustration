package com.devops.authservice.domain.user.register;

import com.devops.authservice.domain.user.exception.EmailAlreadyExistsException;
import com.devops.authservice.domain.user.exception.UsernameAlreadyExistsException;
import com.devops.authservice.entity.UserEntity;
import com.devops.authservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegisterInteractorTest {

    @Mock
    private UserRepository userRepository;

    private RegisterInteractor interactor;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        interactor = new RegisterInteractor(userRepository);
    }

    @Test
    void execute_persistsUserWithHashedPassword_andReturnsOutput() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(false);

        UserEntity saved = mock(UserEntity.class);
        when(saved.getId()).thenReturn(id);
        when(saved.getEmail()).thenReturn("user@example.com");
        when(saved.getUsername()).thenReturn("alice");
        when(userRepository.save(any(UserEntity.class))).thenReturn(saved);

        RegisterOutput output = interactor.execute(
                new RegisterInput("user@example.com", "s3cret-password", "alice"));

        assertThat(output.id()).isEqualTo(id);
        assertThat(output.email()).isEqualTo("user@example.com");
        assertThat(output.username()).isEqualTo("alice");

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());
        UserEntity persisted = captor.getValue();
        assertThat(persisted.getEmail()).isEqualTo("user@example.com");
        assertThat(persisted.getUsername()).isEqualTo("alice");
        assertThat(persisted.getPasswordHash()).isNotEqualTo("s3cret-password");
        assertThat(new BCryptPasswordEncoder().matches("s3cret-password", persisted.getPasswordHash()))
                .isTrue();
    }

    @Test
    void execute_throwsWhenEmailAlreadyExists() {
        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        assertThatThrownBy(() -> interactor.execute(
                new RegisterInput("user@example.com", "pw", "alice")))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void execute_throwsWhenUsernameAlreadyExists() {
        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> interactor.execute(
                new RegisterInput("user@example.com", "pw", "alice")))
                .isInstanceOf(UsernameAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }
}
