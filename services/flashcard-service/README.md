# Flashcard Service

Owns **flashcard management**: standard CRUD over the flashcards a user has saved.
Every flashcard belongs to exactly one user and is generated from a source
document.

- **Port:** `8082`
- **Tech:** Java 21, Spring Boot 3, Spring Data JPA, Spring Security, Liquibase
- **Database:** `flashcarddb` (owns the `flashcards` table)

---

## Endpoints

All endpoints (except health) require authentication and are **scoped to the
authenticated user** — you can only ever read or modify your own flashcards.

| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/flashcards/health` | Health check (public) |
| GET    | `/api/v1/flashcards` | List the current user's flashcards |
| POST   | `/api/v1/flashcards` | Create a flashcard |
| POST   | `/api/v1/flashcards/batch-get` | Fetch many flashcards by id (ids not owned by the caller are omitted) |
| GET    | `/api/v1/flashcards/{id}` | Get one of the user's flashcards |
| PUT    | `/api/v1/flashcards/{id}` | Update a flashcard |
| DELETE | `/api/v1/flashcards/{id}` | Delete a flashcard |

> **Decks live elsewhere.** This service stores flashcards only. Grouping cards
> into decks and spaced-repetition scheduling are owned by the **study-service**,
> which keeps deck membership as a set of flashcard ids and uses `batch-get` to
> resolve them back to full flashcards. The flashcard service stays a pure,
> single-responsibility CRUD store.

The API contract lives in [`api/flashcard.yaml`](../../api/flashcard.yaml); the DTOs
and models are generated from it (OpenAPI Generator) — no hand-written DTOs.

### Flashcard shape

```json
{
  "id": "uuid",
  "question": "What is a hypervisor?",
  "answer": "Software that runs virtual machines on a host.",
  "source_ref": "<upload_id>",
  "source_name": "W03 Virtualization and Containerization.pdf",
  "last_updated": "2026-07-16T10:00:00Z"
}
```

- **`source_ref`** — machine reference to the source (the upload id). Load-bearing:
  the GenAI service uses it to look up document context for explanations.
- **`source_name`** — optional, human-readable name of the source resource (the
  uploaded file name). Denormalized onto the card so the UI can group saved
  flashcards by the document they came from without a cross-service lookup.

---

## Authentication & user scoping

The service reads the **`access_token`** cookie, validates it with the shared
`JWT_SECRET`, and uses the JWT **subject as the user id**. Every query is filtered
by that `user_id`, so users are fully isolated from one another.

`user_id` references the origin user in the auth service's `authdb`. It is a plain,
indexed `uuid` column — **there is no cross-database foreign key**, because each
service owns its own database.

---

## Database (`flashcarddb`)

Managed by Liquibase migrations (`src/main/resources/db/changelog/changes`):

| Migration | Change |
|---|---|
| `001_create_flashcards` | `flashcards` table with indexed `user_id` |
| `002_drop_orphan_users` | Removes a legacy stray `users` table (users live in `authdb`) |
| `003_add_source_name` | Adds the nullable `source_name` column |

`flashcards` columns: `id` (uuid PK), `user_id` (uuid, indexed), `question` (text),
`answer` (text), `source_ref` (varchar 1024), `source_name` (varchar 512, nullable),
`last_updated` (timestamp).

---

## Configuration

| Variable | Purpose |
|---|---|
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | `flashcarddb` connection |
| `JWT_SECRET` | Verifies the access-token cookie (shared across services) |
| `SERVER_PORT` | Defaults to `8082` |

---

## Build, run, test

```bash
# from services/flashcard-service
mvn clean package
mvn spring-boot:run        # needs a reachable flashcarddb + JWT_SECRET
mvn test                   # unit tests (service layer, ownership scoping, mapping)
```

Or run the whole stack via `docker compose up` from `infra/`.
