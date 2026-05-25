# System Structure

This document summarizes the technical architecture for the flashcard learning system. It focuses on the deployed components, their responsibilities, and the primary data and control flows.

## 1. Technology Choices

| Layer | Technology | Notes |
|---|---|---|
| Client | TypeScript (React) | Browser UI for upload, decks, study, and explanations |
| Backend services | Java (Spring Boot) | Core REST APIs for users, decks, study sessions, and persistence |
| GenAI service | Python (FastAPI) | Flashcard generation and explanation endpoints |
| Relational Database | PostgreSQL | Service-owned schemas for user, deck/flashcard, study session data |
| Vector Database | Weaviate | For RAG-based workflow
| API contract | OpenAPI | Single contract in [api/openapi.yaml](api/openapi.yaml) |
| Containerization | Docker | Local development and CI builds |

## 2. Service Decomposition

The system is split into a web client, an API gateway, multiple backend services, and a dedicated AI service. Backend services expose REST endpoints and own their data. The AI service is stateless and invoked by the backend for generation and explanations.

| Component | Owns | Talks to |
|---|---|---|
| Web Client | UI state and user interactions | API Gateway (REST) |
| API Gateway | Routing and auth enforcement | Backend services (REST) |
| User Service | Users, sessions, authentication data | User DB |
| Deck Service | Decks, flashcards, material metadata | Deck/Flashcard DB; GenAI service |
| Study Session Service | Study sessions, review logs | Study Session DB |
| GenAI Service | Stateless generation and explanation | External LLM provider; optional vector store |

## 3. Data Storage

- Service-owned relational databases for user data, deck/flashcard data, and study sessions.
- Optional vector database for semantic retrieval to support explanations and flashcard generation quality.
- Uploaded materials stored as file content in the backend database or object storage, depending on size and deployment.

## 4. Interfaces and Contracts

- External API boundary is REST/JSON.
- The OpenAPI specification in [api/openapi.yaml](api/openapi.yaml) is the source of truth for endpoints and payloads.
- AI-related calls use internal REST endpoints between backend services and the GenAI service.

## 5. Service Endpoints and Ports

This section summarizes the deployed services, their container ports, and the HTTP base paths they expose. When running behind the API gateway or reverse proxy, the base path remains the same; only the host changes.

| Service | Container Port | Base Path | Notes |
|---|---:|---|---|
| Web Client | 5173 | / | Served via reverse proxy; static frontend. |
| Auth Service | 8081 | /api/v1/auth | Public auth endpoints. |
| Flashcard Service | 8082 | /api/v1/flashcards | Flashcard endpoints; update if path changes. |
| GenAI Service | 8080 | /api/v1/genai | Upload, generation, and explain endpoints. |
| Reverse Proxy | 80/443 | / | Routes paths to services. |

## 6. UML Diagrams

These diagrams capture the user interactions, domain model, and component-level architecture.

- Use Case Diagram: [documents/diagrams/Use Case Diagram.json](documents/diagrams/Use%20Case%20Diagram.json)
- Analysis Object Model: [documents/diagrams/Analysis Object Model.json](documents/diagrams/Analysis%20Object%20Model.json)
- Component Diagram: [documents/diagrams/Component Diagram.json](documents/diagrams/Component%20Diagram.json)

## 7. Key Flows

1. User uploads material in the web client, routed through the API gateway to the Deck Service.
2. Deck Service stores metadata and content, then requests flashcard generation from the GenAI service.
3. Generated flashcards are persisted and exposed through deck and study APIs.
4. Study sessions record answers and review logs; scheduling logic updates next review dates.
5. Users can request AI explanations, which are produced by the GenAI service and returned through the backend.
