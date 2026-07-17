# System Structure

This document summarizes the technical architecture for the flashcard learning system. It focuses on the deployed components, their responsibilities, and the primary data and control flows.

Source of truth for this document: [infra/docker-compose.yml](../infra/docker-compose.yml) (local dev), [infra/docker-compose.azure.yml](../infra/docker-compose.azure.yml) (deployed), and the per-service OpenAPI specs in [api/](../api/).

## 1. Technology Choices

| Layer | Technology | Notes |
|---|---|---|
| Client | TypeScript (React, Vite) | Browser UI for upload, decks, study, and explanations |
| API Gateway | Java (Spring Boot / Spring Cloud Gateway) | Single entry point behind the reverse proxy; routes and enforces JWT auth |
| Backend services | Java (Spring Boot) | `auth-service`, `flashcard-service`, `study-service` |
| GenAI service | Python (FastAPI) | Flashcard generation and explanation endpoints; RAG over uploaded documents |
| Upload service | Python (FastAPI) | Document upload/storage and metadata |
| Relational Database | PostgreSQL 16 | One database per service: `authdb`, `flashcarddb`, `studydb`, `uploaddocumentdb`, all on a shared `db` container |
| Vector Database | Weaviate | RAG retrieval for GenAI service, using Ollama's `text2vec-ollama` module |
| LLM Runtime | Ollama (local) + Logos (remote, TUM-hosted) | GenAI service can target either via `LLM_BASE_URL`/`LOGOS_BASE_URL` |
| Cache / Queue | Redis | Used by GenAI service |
| API contracts | OpenAPI | One spec per service in [api/](../api/): `auth.yaml`, `flashcard.yaml`, `study.yaml`, `upload.yaml`, `genAI.yaml` |
| Reverse Proxy | Traefik | TLS termination (Let's Encrypt) and routing, deployed environment only |
| Observability | Prometheus, Grafana, Loki/Promtail, Jaeger | Metrics, dashboards, logs, and distributed tracing |
| Containerization | Docker / Docker Compose | Local development (`infra/docker-compose.yml`) and Azure deployment (`infra/docker-compose.azure.yml`) |

## 2. Service Decomposition

The system is a web client, an API gateway, three Java backend services, and two Python AI/document services, plus shared infrastructure (Postgres, Weaviate, Ollama, Redis) and an observability stack.

| Component | Owns | Talks to |
|---|---|---|
| Web Client | UI state and user interactions | API Gateway (REST, via generated SDK) |
| API Gateway | Routing, JWT validation, CORS | auth-service, flashcard-service, study-service, genai-service, upload-service |
| Auth Service | Users, sessions, JWT issuance, Google OAuth2 login | `authdb` |
| Flashcard Service | Individual flashcard CRUD | `flashcarddb` |
| Study Service | Decks, deck-flashcard associations, spaced-repetition study state | `studydb` |
| GenAI Service | Stateless flashcard generation and explanation (RAG) | Weaviate, Ollama, Logos (external LLM), Redis, upload-service |
| Upload Service | Uploaded document storage and metadata | `uploaddocumentdb` |

Note: decks live in `study-service` (`/api/v1/decks`), while individual flashcards are owned by `flashcard-service` (`/api/v1/flashcards`) — there is no separate "Deck Service".

## 3. Data Storage

- Each backend service owns its own PostgreSQL database (`authdb`, `flashcarddb`, `studydb`, `uploaddocumentdb`), all hosted on one shared `db` Postgres instance with per-database isolation.
- Weaviate stores vector embeddings for RAG-based flashcard generation and explanations, using Ollama for embedding via the `text2vec-ollama` module.
- Redis backs the GenAI service (caching/session state).
- Uploaded documents are persisted by the `upload-service` and referenced by `uploaddocumentdb`.

## 4. Interfaces and Contracts

- External API boundary is REST/JSON, fronted by the API gateway at `/api/v1/...`.
- Each service has its own OpenAPI spec in [api/](../api/) (no single merged `openapi.yaml`): `auth.yaml`, `flashcard.yaml`, `study.yaml`, `upload.yaml`, `genAI.yaml` (JSON equivalents also present for `upload` and `genAI`).
- These specs are the source of truth for endpoints and payloads; see [api/README.md](../api/README.md) and [api/scripts/gen-all.sh](../api/scripts/gen-all.sh) for client/stub generation.

## 5. Service Endpoints and Ports

This section summarizes the deployed services, their container ports, and the HTTP base paths they expose. In the Azure deployment, all backend services are only reachable internally (`expose`, not `ports`); the reverse proxy and gateway are the public entry points. Locally, all ports are published to the host for direct debugging.

| Service | Container Port | Local Host Port | Base Path | Notes |
|---|---:|---:|---|---|
| Web Client | 5173 (dev) / 80 (prod) | 5173 | `/` | Vite dev server locally; static build behind Traefik in prod |
| API Gateway | 8080 | 8088 | `/api`, `/oauth2`, `/login/oauth2` | Single entry point for all backend calls |
| Auth Service | 8081 | 8081 | `/api/v1/auth` | Login, register, refresh, logout, session/me, Google OAuth2 |
| Flashcard Service | 8082 | 8082 | `/api/v1/flashcards` | Flashcard CRUD |
| Study Service | 8083 | 8083 | `/api/v1/decks` | Decks, deck flashcards, study scheduling |
| GenAI Service | 8090 | 8090 | `/api/v1/genai` | Uploads-to-flashcards generation, explain |
| Upload Service | 8091 | 8091 | `/api/v1/documents` | Document upload, health, retrieval |
| Weaviate | 8080 / 50051 | 8080 / 50051 | — | Vector DB, internal only in prod |
| Ollama | 11434 | 11434 | — | Local LLM runtime, internal only in prod |
| Redis | 6379 | 6379 | — | GenAI cache, internal only in prod |
| Postgres | 5432 | 5432 | — | Shared instance, one DB per service |
| Reverse Proxy (Traefik) | 80/443 | — | `/` | Deployed environment only; TLS + routing to gateway/web-client/monitoring |
| Prometheus | 9090 | 9090 | — | Metrics |
| Grafana | 3000 | 3001 | — | Dashboards |
| Loki | 3100 | 3100 | — | Log aggregation |
| Jaeger | 16686 / 4317 / 4318 | 16686 / 4317 / 4318 | — | Distributed tracing (OTLP) |

## 6. UML Diagrams

These diagrams capture the user interactions, domain model, and component-level architecture. They may not reflect the current service split described above and should be refreshed alongside this document.

- Use Case Diagram: [documents/diagrams/Use Case Diagram.json](diagrams/Use%20Case%20Diagram.json)
- Analysis Object Model: [documents/diagrams/Analysis Object Model.json](diagrams/Analysis%20Object%20Model.json)
- Component Diagram: [documents/diagrams/Component Diagram.json](diagrams/Component%20Diagram.json)

## 7. Key Flows

1. User logs in via the web client; `auth-service` issues a JWT (or handles Google OAuth2 login), validated independently by each downstream service.
2. User uploads material in the web client, routed through the API gateway to `upload-service`, which stores the document and metadata.
3. The web client requests flashcard generation from `genai-service`, which retrieves the uploaded document (via `upload-service`), runs RAG over Weaviate/Ollama (or the remote Logos LLM), and returns generated flashcards.
4. Generated flashcards are persisted via `flashcard-service`, and organized into decks via `study-service`.
5. Study sessions are driven by `study-service`, which tracks per-flashcard study status and schedules reviews (spaced-repetition parameters configurable via `STUDY_EASE_*` env vars).
6. Users can request AI explanations, produced by `genai-service` and returned through the gateway.
