# Auth Service

Owns **authentication and user identity** for the platform. It issues and refreshes
JWTs, manages user accounts and sessions, and supports both email/password and
Google OAuth2 / OIDC sign-in.

- **Port:** `8081`
- **Tech:** Java 21, Spring Boot 3, Spring Security, Liquibase
- **Database:** `authdb` (owns the `users` and `sessions` tables)

---

## Endpoints

All are exposed publicly through the gateway (they are the auth entry points).

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user (email, username, password) |
| POST | `/api/v1/auth/login` | Log in with email + password |
| GET  | `/oauth2/authorization/google` | Start Google OAuth2 / OIDC sign-in (redirect) |
| GET  | `/api/v1/auth/me` | Get the currently authenticated user |
| POST | `/api/v1/auth/refresh` | Refresh the access token from the current session |
| POST | `/api/v1/auth/logout` | Revoke the current session and clear cookies |

The API contract is defined in [`api/auth.yaml`](../../api/auth.yaml); DTOs and API
interfaces are generated from it (OpenAPI Generator).

---

## Tokens & cookies

- **`access_token`** — short-lived HS256 JWT. Subject = user id (UUID); includes
  `email` and `username` claims. Sent as an HTTP-only cookie.
- **`session_id`** — long-lived session reference used to mint a new access token
  via `/refresh` (this is what the gateway uses to transparently refresh).

The JWT is signed with the shared **`JWT_SECRET`** so every service (and the
gateway) can verify it independently.

---

## Database (`authdb`)

Managed by Liquibase migrations (`src/main/resources/db/changelog`):

- **`users`** — `id` (uuid, PK), `email` (unique), `username` (unique),
  `password_hash` (nullable for OAuth-only users), `google_id`, `created_at`
- **`sessions`** — `id` (uuid, PK), `user_id` (FK → `users`), `status`,
  `created_at`, `expires_at`, `last_used_at`

> This is the **origin** user store. Other services (e.g. flashcard-service)
> reference a user only by `user_id`; they never share these tables.

---

## Configuration

| Variable | Purpose |
|---|---|
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | `authdb` connection |
| `JWT_SECRET` | Signing secret for access tokens (shared across services) |
| `JWT_EXPIRATION_MS` | Access-token lifetime |
| `SESSION_EXPIRATION_MS` | Session lifetime |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth2 credentials |
| `FRONTEND_URL` | Used for OAuth redirect + cookie/CORS setup |

---

## Build, run, test

```bash
# from services/auth-service
mvn clean package
mvn spring-boot:run        # needs a reachable authdb + JWT_SECRET
mvn test
```

Or run the whole stack via `docker compose up` from `infra/`.
