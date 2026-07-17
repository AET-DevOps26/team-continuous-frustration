# Subsystem Decomposition

The system is decomposed into a **client** subsystem, an **API gateway**, a set of
**Spring Boot backend microservices** (each owning one bounded context and its own
database), a **Python GenAI subsystem**, and an **observability** subsystem. All
cross-subsystem communication is over HTTP/REST against OpenAPI contracts; each
service owns its own database (no shared tables).

```mermaid
flowchart TB
    subgraph Client["Client Subsystem"]
        WEB["web-client<br/>(React SPA)"]
    end

    subgraph Edge["Edge Subsystem"]
        GW["api-gateway<br/>(Spring Cloud Gateway)<br/>routing · CORS · JWT auth &amp; refresh"]
    end

    subgraph Backend["Backend Subsystem (Spring Boot)"]
        AUTH["auth-service<br/>users · sessions · JWT · OAuth2"]
        FLASH["flashcard-service<br/>flashcard CRUD"]
        STUDY["study-service<br/>decks · spaced repetition"]
    end

    subgraph GenAI["GenAI Subsystem (Python / FastAPI)"]
        UPLOAD["upload-service<br/>document ingest &amp; markdown"]
        GENAI["genai-service<br/>flashcard generation &amp; explanation"]
    end

    subgraph Data["Persistence Subsystem"]
        AUTHDB[("authdb")]
        FLASHDB[("flashcarddb")]
        STUDYDB[("studydb")]
        UPLOADDB[("uploaddocumentdb")]
        WEAVIATE[("Weaviate<br/>vector store")]
        REDIS[("Redis<br/>cache")]
    end

    subgraph LLM["LLM Providers"]
        LOGOS["Cloud LLM<br/>(TUM Logos / OpenAI-compatible)"]
        OLLAMA["Local LLM<br/>(Ollama)"]
    end

    subgraph Obs["Observability Subsystem"]
        PROM["Prometheus"]
        GRAF["Grafana"]
        JAEGER["Jaeger (tracing)"]
        LOKI["Loki (logs)"]
    end

    WEB -->|REST /api/v1/**| GW
    GW -->|/api/v1/auth| AUTH
    GW -->|/api/v1/flashcards| FLASH
    GW -->|/api/v1/decks| STUDY
    GW -->|/api/v1/genai| GENAI
    GW -->|/api/v1/documents| UPLOAD

    AUTH --> AUTHDB
    FLASH --> FLASHDB
    STUDY --> STUDYDB
    STUDY -->|batch-get flashcards| FLASH
    UPLOAD --> UPLOADDB

    GENAI -->|fetch document| UPLOAD
    GENAI --> WEAVIATE
    GENAI --> REDIS
    GENAI --> LOGOS
    GENAI --> OLLAMA

    PROM -.scrape /metrics.-> GW
    PROM -.scrape.-> AUTH
    PROM -.scrape.-> FLASH
    PROM -.scrape.-> STUDY
    PROM -.scrape.-> GENAI
    PROM -.scrape.-> UPLOAD
    GRAF --> PROM
```

## Subsystem responsibilities & interfaces

| Subsystem | Service | Responsibility | Interface |
|---|---|---|---|
| Client | web-client | Usable, responsive UI (upload, decks, study, flashcards) | REST → gateway |
| Edge | api-gateway | Single entry point: routing, CORS, JWT validation/refresh, identity headers | REST |
| Backend | auth-service | Users, sessions, JWT, Google OAuth2 (`authdb`) | REST (`/api/v1/auth`) |
| Backend | flashcard-service | Flashcard CRUD scoped per user (`flashcarddb`) | REST (`/api/v1/flashcards`) |
| Backend | study-service | Decks + spaced-repetition scheduling (`studydb`) | REST (`/api/v1/decks`) |
| GenAI | genai-service | Flashcard generation & explanation; cloud + local LLMs; RAG | REST (`/api/v1/genai`) |
| GenAI | upload-service | Document ingest → markdown (`uploaddocumentdb`) | REST (`/api/v1/documents`) |
| Persistence | PostgreSQL / Weaviate / Redis | Per-service relational storage, vector store, cache | JDBC / gRPC / RESP |
| Observability | Prometheus / Grafana / Jaeger / Loki | Metrics, dashboards, tracing, logs | scrape / OTLP |
