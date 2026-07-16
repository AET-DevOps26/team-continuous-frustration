# API Gateway

The single entry point for the platform. All client traffic goes through the
gateway, which handles **routing, CORS, and authentication** so the downstream
services can stay focused on their own domain.

Built with **Spring Cloud Gateway** (reactive / WebFlux).

- **Port:** `8080` (container) → `8088` on the host by default (`GATEWAY_PORT`)
- **Tech:** Java 21, Spring Boot 3, Spring Cloud Gateway

---

## Responsibilities

| Concern | How |
|---|---|
| Routing | Path-based routes to each downstream service |
| Authentication | Validates the JWT access-token cookie at the edge |
| Token refresh | Transparently refreshes an expired access token via the auth service |
| Identity propagation | Forwards the authenticated user to services as headers |
| CORS | Central CORS config with credentials support |

---

## Routing

| Path prefix | Target service |
|---|---|
| `/api/v1/auth/**`, `/oauth2/**`, `/login/oauth2/**` | auth-service |
| `/api/v1/flashcards`, `/api/v1/flashcards/**` | flashcard-service |
| `/api/v1/genai/**` | genai-service |
| `/api/v1/documents/**` | upload-service |

Targets are configured via `*_SERVICE_URL` environment variables (see below).

---

## Authentication flow (`JwtAuthGlobalFilter`)

The global filter runs before routing (`order = -1`):

1. **Public prefixes** (`/api/v1/auth/`, `/oauth2/`, `/login/oauth2/`) bypass auth.
2. If a valid **`access_token`** cookie is present, the request is forwarded with
   the authenticated identity added as headers.
3. If the access token is **expired** (or only a `session_id` cookie is present),
   the gateway calls the auth service's `/api/v1/auth/refresh`, and on success
   re-issues the `access_token` cookie to the client and forwards the request.
4. Otherwise the request is rejected with **401 Unauthorized**.

Downstream services receive the resolved identity as headers:

```
X-User-Id     <user uuid, the JWT subject>
X-User-Email  <email claim>
X-User-Name   <username claim>
```

> Note: the JWT is HS256-signed with the shared `JWT_SECRET`, so services can also
> validate the `access_token` cookie independently (defense in depth).

---

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | `change-me-...` | Shared secret used to verify access tokens |
| `AUTH_SERVICE_URL` | `http://auth-service:8081` | Auth service base URL (routing + refresh) |
| `FLASHCARD_SERVICE_URL` | `http://flashcard-service:8082` | Flashcard service base URL |
| `GENAI_SERVICE_URL` | `http://genai-service:8090` | GenAI service base URL |
| `UPLOAD_SERVICE_URL` | `http://upload-service:8091` | Upload service base URL |
| `CORS_ALLOWED_ORIGINS` | `*` | Allowed CORS origins (credentials enabled) |
| `TRACING_SAMPLING_PROBABILITY` | `1.0` | OpenTelemetry trace sampling |
| `OTLP_TRACING_ENDPOINT` | `http://jaeger:4318/v1/traces` | Trace exporter endpoint |

---

## Build, run, test

```bash
# from services/api-gateway
mvn clean package          # build
mvn spring-boot:run        # run locally (needs downstream services + JWT_SECRET)
mvn test                   # tests
```

Normally you don't run this alone — start the whole stack with
`docker compose up` from `infra/` (see the [root README](../../README.md)).

## Observability

Actuator endpoints exposed: `health`, `info`, `prometheus`
(`http://localhost:8088/actuator/health`). Traces are exported to Jaeger.
