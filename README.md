# team-continuous-frustration
Repository for team Continuous Frustration

## Team Responsibilities

| Member | Main Responsibility |
|---|---|
| Paul Marius Heizmann | GenAI Component |
| Khalil Hkiri | Server / Backend |
| Siyao Zhou (dropped out) | Client / Frontend |

## Enable Pre-commit Hook

From repository root, install and enable pre-commit:

1. `pip install -r requirements-dev.txt`
2. `pre-commit install`


## Starting All Services

From the `infra/` directory, a single command starts everything (PostgreSQL, auth-service, flashcard-service, genai-service, web-client):
# Important: Add *LOGOS_API_KEY* in `docker-compose.yaml` as ENV of the genai-service. Otherwise the GenAI service will not work as expected!

```bash
cd infra
docker compose up --build
```

The first `--build` takes a while (Maven builds and the GenAI service pulls a
local LLM into Ollama). Once it is up, use these on the host:

| What | URL (host) |
|---|---|
| **Web client (the UI)** | http://localhost:5273 |
| **API Gateway (all API calls go here)** | http://localhost:8088 |
| Grafana | http://localhost:3001 (`admin`/`admin`) |
| Prometheus | http://localhost:9090 |
| Jaeger UI | http://localhost:16686 |

The backend services sit **behind the gateway** and are not called directly by the
client — auth (`8081`), flashcard (`8082`), genai (`8090`), upload (`8091`). The
Python services also expose Swagger UI directly at `http://localhost:8090/docs`
and `http://localhost:8091/docs`.

To stop all services:

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

---

## Observability

`docker compose up` also starts a full monitoring stack (Prometheus, Grafana, Loki/Promtail,
Jaeger) locally, and the same stack runs on the Azure VM behind Traefik + Basic Auth.

| Tool | Local | Azure |
|---|---|---|
| Prometheus | http://localhost:9090 | `https://prometheus.<vm-ip>.nip.io` |
| Grafana | http://localhost:3001 (`admin`/`admin`) | `https://grafana.<vm-ip>.nip.io` |
| Jaeger | http://localhost:16686 | `https://jaeger.<vm-ip>.nip.io` |

**→ See [documents/observability.md](documents/observability.md) for the full guide**: querying
metrics/logs/traces, the dashboard layout, Azure's auth setup (Basic Auth on all three, plus
Grafana's own login on top) and one-time GitHub secrets setup, and troubleshooting.

## Azure VM Deployment

### VM Information

- VM name: `team-continuous-frustration`
- Public IP address: `68.210.146.30`
- SSH user: `azureuser`
- Client URL: https://68.210.146.30.nip.io

### Run Azure CI

1. Go to https://github.com/AET-DevOps26/team-continuous-frustration/actions/workflows/deploy_azure.yaml
2. Click on "Run workflow"
3. Select branch to deploy
4. Click on "Run workflow" to start the deployment action


### How to connect to the Azure VM

```bash
chmod 400 ./team-continuous-frustration_key.pem
ssh -i ./team-continuous-frustration_key.pem azureuser@68.210.146.30
```

---

## Kubernetes Deployment

- Cluster: stud
- Namespace: team-continuous-frustration
- URL: https://team-continuous-frustration-devops-ss26.stud.k8s.aet.cit.tum.de/

### Run Helm deployment (upgrade current release)
```bash
cd infra/helm
helm upgrade tcf . --namespace team-continuous-frustration
```
### Run Helm deployment (install new release)
```bash
cd infra/helm
helm install [RELEASE_NAME] . --namespace team-continuous-frustration
```

## Service Documentation

Backend services owned by this repo each have their own README:

- [API Gateway](services/api-gateway/README.md) — single entry point: routing, CORS, JWT auth & refresh
- [Auth Service](services/auth-service/README.md) — users, sessions, JWT, Google OAuth (`authdb`)
- [Flashcard Service](services/flashcard-service/README.md) — flashcard CRUD scoped per user (`flashcarddb`)

Other backend services: **genai-service** (flashcard generation), **upload-service**
(document ingestion), and **study-service** (decks + spaced-repetition scheduling).

## Features

Available **end-to-end**:

- **Authentication** — email/password sign-up & login, Google OAuth, session-based
  token refresh, logout.
- **Flashcard generation** — upload course slides (PDF/TXT), the GenAI service
  turns them into flashcards and streams them back to the UI.
- **Decks & flashcard management** — save generated cards into a **deck**, browse
  saved cards on **My Flashcards** (grouped by source document), and manage decks.
- **Studying** — review a deck's due cards with spaced repetition (study-service).

### Implemented Endpoints

All endpoints are reached **through the API Gateway** (`http://localhost:8088`).
Everything except the auth endpoints requires a valid session.

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Register a new user |
| `/api/v1/auth/login` | POST | Login with email and password |
| `/oauth2/authorization/google` | GET | Start Google OAuth sign-in (redirect) |
| `/api/v1/auth/logout` | POST | Logout |
| `/api/v1/auth/me` | GET | Get current user profile |
| `/api/v1/auth/refresh` | POST | Refresh authentication token |
| `/api/v1/documents/upload` | POST | Upload a document |
| `/api/v1/documents/{upload_id}` | GET | Get a document |
| `/api/v1/genai/generate-flashcards` | POST | Generate flashcards from an uploaded document (NDJSON stream) |
| `/api/v1/flashcards` | GET | List the current user's saved flashcards |
| `/api/v1/flashcards` | POST | Save a flashcard |
| `/api/v1/flashcards/batch-get` | POST | Fetch many flashcards by id |
| `/api/v1/flashcards/{id}` | GET / PUT / DELETE | Get / update / delete a saved flashcard |
| `/api/v1/decks` | GET / POST | List / create decks |
| `/api/v1/decks/overview` | GET | Deck overviews (counts, due today) |
| `/api/v1/decks/{id}` | GET | Get a deck |
| `/api/v1/decks/{id}/flashcards` | GET / POST | List a deck's flashcard ids / add a card to the deck |
| `/api/v1/decks/{id}/flashcards/{fid}` | DELETE | Remove a card from a deck |
| `/api/v1/decks/{id}/study` | GET | Get the deck's cards due for review |
| `/api/v1/decks/{id}/flashcards/{fid}/study-status` | PUT | Record a review result (spaced repetition) |

When running locally Swagger UI will be available at
- `http://localhost:8090/docs`
- `http://localhost:8091/docs`

---

## Testing the Flows

Two ways to exercise the app: through the **UI**, or with **curl** against the
gateway. Make sure the stack is running (`cd infra && docker compose up --build`).

> The GenAI step needs a working LLM. Either set a real `LOGOS_API_KEY` on the
> genai-service (recommended), or rely on the bundled local Ollama model — the
> first generation may be slow while the model warms up.

### Via the UI (`http://localhost:5273`)

1. **Sign up / log in** — register an account (or use Google), which lands you on
   the home page.
2. **Create a deck** — go to **My Decks** and create one. Generated cards are saved
   into a deck, so you need at least one first.
3. **Upload & generate** — go to **Upload Slides**, choose the target deck, pick a
   PDF/TXT, and click *Generate Flashcards*. Cards stream in as they are generated.
4. **Save** — save individual cards or use *Save All*; saved cards are added to the
   chosen deck.
5. **Browse** — open **My Flashcards** to see your saved cards, grouped by the
   document they were generated from.
6. **Study** — open the deck and start a study session to review its due cards.

### Via curl (through the gateway)

```bash
GW=http://localhost:8088
JAR=cookies.txt   # cookie jar keeps your session between calls

# 1) Register (issues access_token + session cookies into the jar)
curl -s -c $JAR -X POST $GW/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.local","username":"demo","password":"Password123!"}'

# 2) Create a deck -> returns a deck id (name + tags are required)
DECK_ID=$(curl -s -b $JAR -X POST $GW/api/v1/decks \
  -H "Content-Type: application/json" \
  -d '{"name":"Virtualization","tags":["virtualization"]}' | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

# 3) Upload a document -> returns an upload_id
UPLOAD_ID=$(curl -s -b $JAR -X POST $GW/api/v1/documents/upload \
  -F "file=@slides.pdf" | sed -n 's/.*"upload_id":"\([^"]*\)".*/\1/p')

# 4) Generate flashcards (streams NDJSON, one flashcard per line)
curl -s -N -b $JAR -X POST "$GW/api/v1/genai/generate-flashcards?upload_id=$UPLOAD_ID"

# 5) Save a flashcard (source_name is the human-readable document name)
CARD_ID=$(curl -s -b $JAR -X POST $GW/api/v1/flashcards \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"What is a hypervisor?\",\"answer\":\"Software that runs VMs.\",\"source_ref\":\"$UPLOAD_ID\",\"source_name\":\"slides.pdf\"}" \
  | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

# 6) Add the saved card to the deck
curl -s -b $JAR -X POST "$GW/api/v1/decks/$DECK_ID/flashcards" \
  -H "Content-Type: application/json" \
  -d "{\"flashcard_id\":\"$CARD_ID\"}"

# 7) List your saved flashcards
curl -s -b $JAR $GW/api/v1/flashcards
```

### Running the automated tests

```bash
# Java services (unit + slice tests)
cd services/flashcard-service && mvn test
cd services/auth-service      && mvn test
cd services/api-gateway       && mvn test

# Python services
cd services/genai-service  && pytest tests
cd services/upload-service && pytest tests
```
