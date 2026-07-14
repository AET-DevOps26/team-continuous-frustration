package com.devops.springservice.flashcard;

import com.devops.springservice.model.Flashcard;
import com.devops.springservice.model.FlashcardCreateRequest;
import com.devops.springservice.model.FlashcardUpdateRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FlashcardServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID OTHER_CARD_ID = UUID.randomUUID();

    @Mock
    private FlashcardRepository repository;

    @InjectMocks
    private FlashcardService service;

    private FlashcardEntity persistedEntity(UUID userId) {
        FlashcardEntity entity = new FlashcardEntity(userId, "Q?", "A.", "slide-1");
        ReflectionTestUtils.setField(entity, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(entity, "lastUpdated", LocalDateTime.now());
        return entity;
    }

    @Test
    void createPersistsCardScopedToUser() {
        when(repository.save(any(FlashcardEntity.class)))
                .thenAnswer(invocation -> {
                    FlashcardEntity saved = invocation.getArgument(0);
                    ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
                    ReflectionTestUtils.setField(saved, "lastUpdated", LocalDateTime.now());
                    return saved;
                });

        FlashcardCreateRequest request = new FlashcardCreateRequest("Q?", "A.", "slide-1");
        Flashcard result = service.create(USER_ID, request);

        ArgumentCaptor<FlashcardEntity> captor = ArgumentCaptor.forClass(FlashcardEntity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(result.getQuestion()).isEqualTo("Q?");
        assertThat(result.getSourceRef()).isEqualTo("slide-1");
    }

    @Test
    void listReturnsOnlyOwnersCardsMappedToModel() {
        when(repository.findByUserIdOrderByLastUpdatedDesc(USER_ID))
                .thenReturn(List.of(persistedEntity(USER_ID)));

        List<Flashcard> result = service.listForUser(USER_ID);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLastUpdated()).isNotNull();
    }

    @Test
    void getThrowsWhenCardNotOwnedByUser() {
        when(repository.findByIdAndUserId(OTHER_CARD_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getForUser(USER_ID, OTHER_CARD_ID))
                .isInstanceOf(FlashcardNotFoundException.class);
    }

    @Test
    void updateModifiesOwnedCard() {
        FlashcardEntity existing = persistedEntity(USER_ID);
        when(repository.findByIdAndUserId(existing.getId(), USER_ID)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        FlashcardUpdateRequest request = new FlashcardUpdateRequest("New Q", "New A", "slide-2");
        Flashcard result = service.update(USER_ID, existing.getId(), request);

        assertThat(existing.getQuestion()).isEqualTo("New Q");
        assertThat(existing.getSourceRef()).isEqualTo("slide-2");
        assertThat(result.getAnswer()).isEqualTo("New A");
    }

    @Test
    void deleteThrowsWhenNothingRemoved() {
        when(repository.deleteByIdAndUserId(OTHER_CARD_ID, USER_ID)).thenReturn(0L);

        assertThatThrownBy(() -> service.delete(USER_ID, OTHER_CARD_ID))
                .isInstanceOf(FlashcardNotFoundException.class);
    }

    @Test
    void deleteSucceedsWhenCardRemoved() {
        when(repository.deleteByIdAndUserId(any(UUID.class), any(UUID.class))).thenReturn(1L);

        service.delete(USER_ID, UUID.randomUUID());

        verify(repository).deleteByIdAndUserId(any(UUID.class), any(UUID.class));
    }
}
