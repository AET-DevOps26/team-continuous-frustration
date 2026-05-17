# CLAUDE.md

## Engineering Principles

- Prefer **API-first development**
- Treat the **OpenAPI specification** as the single source of truth
- Every service should have **one clear responsibility**
- Keep services **stateless** whenever possible
- Never couple services through internal models or shared DTOs
- Use **generated clients and stubs only** for cross-service communication
- Everything must be reproducible through **CI/CD and containers**

---

# Architecture Guidelines

## Microservice Design

### Single Responsibility

Each microservice must encapsulate exactly one business capability or bounded context.

Examples:

- `spring-order` → order management
- `py-recommender` → recommendation and AI workflows

Avoid:

- overlapping domains
- shared business logic across services
- feature creep

---

### Stateless Services

Services should remain stateless.

Use:

- JWTs for authentication/session propagation
- Redis or databases for shared state if necessary

Do not store:

- in-memory user sessions
- request state across replicas

---

### Cross-Language Boundaries

The system uses:

- Spring Boot (Java)
- Python (LangChain)

Communication rules:

- communicate only via HTTP/JSON
- interfaces are defined through OpenAPI
- never share internal classes or data structures

---

# API-First Development

## OpenAPI as the Source of Truth

The OpenAPI specification lives in:

```text
/api/openapi.yaml
```

All generated code derives from this file.

Never:

- handwrite DTOs
- manually duplicate schemas
- bypass generated clients

---

## API Versioning

Version APIs from day one.

Example:

```text
/api/v1/orders
```

Never introduce breaking API changes without versioning.

---

## Recommended Tooling

| Purpose | Tool |
|---|---|
| OpenAPI editing | Swagger Editor / Stoplight |
| Spec linting | Redocly CLI |
| Java generation | OpenAPI Generator |
| Python client generation | openapi-python-client |
| TypeScript SDK | openapi-typescript |
| Mock server | Prism |

---

# Required Commands

## Lint OpenAPI

```bash
npx @redocly/cli lint api/openapi.yaml
```

---

## Generate Spring Boot Stubs

```bash
openapi-generator-cli generate \
  -i api/openapi.yaml \
  -g spring \
  -o services/spring-order/generated
```

---

## Generate Python Client

```bash
openapi-python-client \
  --path api/openapi.yaml \
  --output services/py-recommender/client
```

---

## Generate TypeScript SDK

```bash
npx openapi-typescript api/openapi.yaml \
  -o web-client/src/api.ts
```

---

## Run Mock Server

```bash
npx prism mock api/openapi.yaml
```

Default port:

```text
4010
```

---

# Repository Structure

```text
repo/
├── api/
│   ├── openapi.yaml
│   └── scripts/
├── services/
│   ├── spring-order/
│   └── py-recommender/
├── web-client/
├── infra/
└── .github/workflows/
```

---

# Code Generation Rules

## Generate Everything After Spec Changes

After every OpenAPI change, run:

```bash
./api/scripts/gen-all.sh
```

---

## Example gen-all.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

openapi-generator-cli generate \
  -i api/openapi.yaml \
  -g spring \
  -o services/spring-order/generated \
  --skip-validate-spec

openapi-python-client \
  --path api/openapi.yaml \
  --output services/py-recommender/client \
  --config api/scripts/py-config.json

npx openapi-typescript \
  api/openapi.yaml \
  -o web-client/src/api.ts
```

---

## Git Hooks

Recommended hooks:

- `post-checkout`
- `post-merge`

Automatically regenerate clients after branch switches or merges.

---

# Pre-Commit Requirements

## OpenAPI Linting

`.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/Redocly/openapi-cli
    rev: v1.0.0-beta.92
    hooks:
      - id: openapi-cli-lint
```

Run manually:

```bash
pre-commit run -a
```

---

# Security Standards

## Authentication

Use:

- OAuth2
- OpenID Connect (OIDC)

Recommended providers:

- Keycloak
- Auth0
- GitHub OAuth

---

## JWT Handling

Rules:

- JWTs must be passed via HTTP headers
- Every service validates JWTs independently
- Use shared public keys for verification

---

## API Gateway

Use a gateway as the single entry point.

Recommended:

- Traefik
- NGINX
- Spring Cloud Gateway

Gateway responsibilities:

- authentication
- token validation
- routing
- CORS
- rate limiting

---

# Development & Deployment

## Contract Testing

Use Pact for consumer/provider contract testing.

Goals:

- ensure API compatibility between services
- detect breaking changes early

---

## Unified Error Schema

All APIs must return consistent error responses.

Standard format:

```json
{
  "code": "STRING_CODE",
  "message": "Human readable message",
  "details": {}
}
```

---

## CI/CD Requirements

CI pipelines must:

1. lint OpenAPI specs
2. generate clients/stubs
3. run tests
4. verify contracts
5. build containers

No manual production deployments.

---

## Docker Image Tagging

Always publish images with:

- semantic versions
- commit SHA tags

Examples:

```text
ghcr.io/org/service:1.0.0
ghcr.io/org/service:sha-abc123
```

---

# GitHub Actions Example

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  generate-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Lint OpenAPI
        run: npx @redocly/cli lint api/openapi.yaml

      - name: Generate code
        run: ./api/scripts/gen-all.sh

      - name: Build & test
        run: ./scripts/test-all.sh
```

---

# Local Development

## Service Discovery

Use a single API gateway.

Benefits:

- centralized ingress
- easier CORS handling
- centralized authentication/security

---

## Database Isolation

Each service owns its own database.

Recommended:

- one PostgreSQL database per service
- separate schemas allowed

Never share tables across services.

---

## Development Containers

Use:

- `devcontainer.json`
- Docker-in-Docker support
- VS Code Dev Containers

Goal:

- zero local setup

---

## Local Orchestration

Provide a `docker-compose.yml` inside `/infra`.

Must support:

- databases
- gateway
- all services
- observability stack

Single startup command:

```bash
docker compose up
```

---

## Cross-Service Communication

Always use generated OpenAPI clients.

Example:

- Python service calls Java service through generated client code

Never:

- handwrite HTTP requests
- manually serialize payloads

---

# Observability

Recommended stack:

- Spring Boot Actuator
- Prometheus
- OpenTelemetry
- LangChain tracing

Expose metrics through Docker Compose locally.

---

# Frontend Integration

## Generated SDK Usage

Import generated `api.ts` into frontend applications.

Example environment variable:

```env
VITE_API_URL=http://localhost:8080
```

---

## CORS Example

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods: "*"
```

---

## Frontend Data Fetching

Recommended:

- React Query
- SWR

Use retries and caching by default.

---

# Collaboration Standards

## API Review

Hold a weekly API review session.

Focus:

- OpenAPI changes
- breaking changes
- schema consistency

---

## Definition of Done

Every PR must include:

- ✅ Passing CI
- ✅ Updated OpenAPI spec
- ✅ Short ADR or documentation update

---

## Documentation Automation

Generate API docs automatically:

```bash
redoc-cli bundle api/openapi.yaml -o docs/api.html
```

Publish using GitHub Pages.

---

## Pull Request Templates

PR templates should include:

- Does this affect the API?
- Was the OpenAPI spec updated?
- Were generated clients regenerated?

---

# Testing Standards

## Required Test Types

Every service should include:

- unit tests
- integration tests
- end-to-end tests

Integration tests should validate:

- database interactions
- external API integrations
- inter-service communication

---

# What NOT To Do

Never:

- ❌ make direct HTTP calls without generated clients
- ❌ share DTOs outside the OpenAPI spec
- ❌ maintain long-running branches (>2 days)
- ❌ manually deploy to production
- ❌ bypass CI/CD
- ❌ duplicate schemas across services
