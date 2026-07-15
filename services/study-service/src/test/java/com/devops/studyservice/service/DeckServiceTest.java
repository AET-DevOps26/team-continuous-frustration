package com.devops.studyservice.service;

import com.devops.studyservice.entity.DeckEntity;
import com.devops.studyservice.exception.DeckNotFoundException;
import com.devops.studyservice.exception.InvalidRequestException;
import com.devops.studyservice.repository.DeckRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeckServiceTest {

    private static final String USER_ID = UUID.randomUUID().toString();
    private static final String OTHER_USER_ID = UUID.randomUUID().toString();

    @Mock
    private DeckRepository deckRepository;

    private DeckService deckService;

    @BeforeEach
    void setUp() {
        deckService = new DeckService(deckRepository);
    }

    private DeckEntity persistedDeck(String userId) {
        DeckEntity deck = new DeckEntity();
        ReflectionTestUtils.setField(deck, "id", UUID.randomUUID());
        deck.setUserId(userId);
        deck.setName("Biology");
        deck.setTags(List.of("science", "bio"));
        return deck;
    }

    @Test
    void createDeckPersistsDeckScopedToUser() {
        when(deckRepository.save(any(DeckEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        DeckEntity result = deckService.createDeck(USER_ID, "Biology", List.of("science"));

        ArgumentCaptor<DeckEntity> captor = ArgumentCaptor.forClass(DeckEntity.class);
        verify(deckRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(captor.getValue().getName()).isEqualTo("Biology");
        assertThat(captor.getValue().getTags()).containsExactly("science");
        assertThat(result.getName()).isEqualTo("Biology");
    }

    @Test
    void listDecksReturnsOnlyOwnersDecks() {
        when(deckRepository.findByUserIdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(persistedDeck(USER_ID)));

        List<DeckEntity> result = deckService.listDecks(USER_ID);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(USER_ID);
    }

    @Test
    void requireDeckReturnsDeckWhenOwnedByUser() {
        DeckEntity deck = persistedDeck(USER_ID);
        when(deckRepository.findByIdAndUserId(deck.getId(), USER_ID)).thenReturn(Optional.of(deck));

        DeckEntity result = deckService.requireDeck(deck.getId().toString(), USER_ID);

        assertThat(result).isEqualTo(deck);
    }

    @Test
    void requireDeckThrowsNotFoundWhenDeckOwnedByAnotherUser() {
        UUID deckId = UUID.randomUUID();
        when(deckRepository.findByIdAndUserId(deckId, OTHER_USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deckService.requireDeck(deckId.toString(), OTHER_USER_ID))
                .isInstanceOf(DeckNotFoundException.class);
    }

    @Test
    void requireDeckThrowsNotFoundWhenDeckDoesNotExist() {
        UUID deckId = UUID.randomUUID();
        when(deckRepository.findByIdAndUserId(deckId, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deckService.requireDeck(deckId.toString(), USER_ID))
                .isInstanceOf(DeckNotFoundException.class);
    }

    @Test
    void requireDeckThrowsInvalidRequestWhenIdIsNotAUuid() {
        assertThatThrownBy(() -> deckService.requireDeck("not-a-uuid", USER_ID))
                .isInstanceOf(InvalidRequestException.class);
    }
}
