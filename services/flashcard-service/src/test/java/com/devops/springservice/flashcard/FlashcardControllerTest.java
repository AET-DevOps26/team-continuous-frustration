package com.devops.springservice.flashcard;

import com.devops.springservice.model.Flashcard;
import com.devops.springservice.model.FlashcardCreateRequest;
import com.devops.springservice.model.FlashcardUpdateRequest;
import com.devops.springservice.security.JwtAuthFilter;
import com.devops.springservice.security.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer (slice) tests for {@link FlashcardController}: HTTP mapping,
 * request validation, authentication enforcement, and error translation.
 * The service layer is mocked.
 */
@WebMvcTest(FlashcardController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
@TestPropertySource(properties = "jwt.secret=test-secret-that-is-at-least-32-characters!!")
class FlashcardControllerTest {

    private static final UUID USER_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FlashcardService service;

    private RequestPostProcessor asUser() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                USER_ID.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        return authentication(auth);
    }

    private Flashcard sample(String id) {
        return new Flashcard(id, "What is a hypervisor?", "Runs VMs.", "upload-1", OffsetDateTime.now())
                .sourceName("lecture.pdf");
    }

    @Test
    void listRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/flashcards"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listReturnsUsersCards() throws Exception {
        when(service.listForUser(USER_ID)).thenReturn(List.of(sample(UUID.randomUUID().toString())));

        mockMvc.perform(get("/api/v1/flashcards").with(asUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].question").value("What is a hypervisor?"))
                .andExpect(jsonPath("$[0].source_name").value("lecture.pdf"));
    }

    @Test
    void createReturns201WithBody() throws Exception {
        String id = UUID.randomUUID().toString();
        when(service.create(eq(USER_ID), any())).thenReturn(sample(id));

        FlashcardCreateRequest req = new FlashcardCreateRequest("Q", "A", "upload-1").sourceName("lecture.pdf");

        mockMvc.perform(post("/api/v1/flashcards").with(asUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void createRejectsInvalidBodyWith400() throws Exception {
        mockMvc.perform(post("/api/v1/flashcards").with(asUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void getByIdReturns404WhenMissing() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getForUser(eq(USER_ID), eq(id))).thenThrow(new FlashcardNotFoundException(id));

        mockMvc.perform(get("/api/v1/flashcards/{id}", id).with(asUser()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FLASHCARD_NOT_FOUND"));
    }

    @Test
    void getByIdReturns400ForMalformedId() throws Exception {
        mockMvc.perform(get("/api/v1/flashcards/not-a-uuid").with(asUser()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateReturnsUpdatedCard() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.update(eq(USER_ID), eq(id), any())).thenReturn(sample(id.toString()));

        FlashcardUpdateRequest req = new FlashcardUpdateRequest("New Q", "New A", "upload-2");

        mockMvc.perform(put("/api/v1/flashcards/{id}", id).with(asUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void deleteReturns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/flashcards/{id}", id).with(asUser()).with(csrf()))
                .andExpect(status().isNoContent());

        verify(service).delete(USER_ID, id);
    }

    @Test
    void batchGetReturnsCards() throws Exception {
        String id = UUID.randomUUID().toString();
        when(service.getForUser(eq(USER_ID), any(List.class))).thenReturn(List.of(sample(id)));

        mockMvc.perform(post("/api/v1/flashcards/batch-get").with(asUser()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ids\":[\"" + id + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));
    }
}
