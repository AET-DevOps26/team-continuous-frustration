package com.devops.studyservice.service;

import com.devops.studyservice.entity.DeckEntity;
import com.devops.studyservice.exception.DeckNotFoundException;
import com.devops.studyservice.exception.InvalidRequestException;
import com.devops.studyservice.repository.DeckRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DeckService {

    private final DeckRepository deckRepository;

    public DeckService(DeckRepository deckRepository) {
        this.deckRepository = deckRepository;
    }

    public List<DeckEntity> listDecks(String userId) {
        return deckRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    public DeckEntity createDeck(String userId, String name, List<String> tags) {
        DeckEntity deck = new DeckEntity();
        deck.setUserId(userId);
        deck.setName(name);
        deck.setTags(tags);
        return deckRepository.save(deck);
    }

    public DeckEntity requireDeck(String deckId, String userId) {
        UUID id = parseId(deckId);
        return deckRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));
    }

    private UUID parseId(String deckId) {
        try {
            return UUID.fromString(deckId);
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Invalid deck identifier: " + deckId);
        }
    }
}
