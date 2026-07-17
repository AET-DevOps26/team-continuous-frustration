# team-continuous-frustration
Repository for team Continuous Frustration

## Team Responsibilities

| Member | Main Responsibility |
|---|---|
| Paul Marius Heizmann | GenAI Component |
| Khalil Hkiri | Server / Backend |
| Siyao Zhou (dropped out) | Client / Frontend |

## Starting All Services

Local setup:

```bash
cd infra
cp .env.example .env
```

**Important: Add *LOGOS_API_KEY* in your local `.env`. Otherwise the GenAI service will not work as expected!**

From the `infra/` directory, then run docker compose to start everything (PostgreSQL, auth-service, flashcard-service, genai-service, web-client, ...)

```bash
docker compose up --build
```

- Note: In the local setup, Google login is unavailable, and the local fallback LLM model is disabled by default so that a 7 GB model doesn't need to be pulled on app start.

To stop all services:

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

# Service Overview
| Service | Port |
|---|---|
| API Gateway | 8080 |
| Auth service | 8081 |
| Flashcard service | 8082 |
| Study service | 8083 |
| GenAI service | 8090 |
| Upload service | 8091 |
| Web client | 5173 |
| Prometheus | 9090 |
| Grafana | 3001 |
| Jaeger UI | 16686 |
| Loki | 3100 |

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
- Client URL: https://68.210.146.30.nip.io/
- Grafana URL: https://grafana.68.210.146.30.nip.io/ (`admin`/`admin`) 

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
- Client URL: https://team-continuous-frustration-devops-ss26.stud.k8s.aet.cit.tum.de/
- Grafana URL: https://grafana.team-continuous-frustration-devops-ss26.stud.k8s.aet.cit.tum.de/ (`admin`/`admin`) 

### Run Kubernetes CI

1. Go to https://github.com/AET-DevOps26/team-continuous-frustration/actions/workflows/deploy_k8s.yaml
2. Click on "Run workflow"
3. Select branch to deploy
4. Click on "Run workflow" to start the deployment action

Deploys `infra/helm-monitoring` then `infra/helm` (both via `helm upgrade --install`) against the
`stud` cluster, then restarts the app Deployments so they pick up freshly built `:latest` images.
Requires a `KUBE_CONFIG` secret (base64-encoded kubeconfig for the `stud` cluster) under the
repo's `Kubernetes` GitHub environment - the `app-secrets`, `grafana-admin-credentials` and
`monitoring-basic-auth` Kubernetes Secrets referenced by both charts' `values.yaml` must already
exist in-cluster (see `infra/helm/README.md` / `infra/helm-monitoring/README.md`); this workflow
does not create them.

### Run Helm deployment manually (upgrade current release)
```bash
cd infra/helm
helm upgrade tcf . --namespace team-continuous-frustration
```
### Run Helm deployment (install new release)
```bash
cd infra/helm
helm install [RELEASE_NAME] . --namespace team-continuous-frustration
```

## Features

At the moment the Login/ Signup functionality is available end-to-end. The rest of the Fronted is currently mocked.

### Implemented Endpoints

The following endooints are available through the API Gateway:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Register a new user |
| `/api/v1/auth/login` | POST | Login with email and password |
| `/api/v1/auth/login/google` | POST | Login with Google OAuth |
| `/api/v1/auth/logout` | POST | Logout |
| `/api/v1/auth/me` | GET | Get current user profile |
| `/api/v1/auth/refresh` | POST | Refresh authentication token |
| `/api/v1/documents/upload` | POST | Upload a document |
| `/api/v1/documents/{upload_id}` | GET | Get a document |
| `/api/v1/genai/generate-flashcards` | POST | Generate flashcards from an uploaded document |


### API documentation (Swagger UI)

Every service exposes interactive API docs when running locally:

| Service | Swagger UI | OpenAPI JSON |
|---|---|---|
| auth-service | `http://localhost:8081/swagger-ui.html` | `/v3/api-docs` |
| flashcard-service | `http://localhost:8082/swagger-ui.html` | `/v3/api-docs` |
| study-service | `http://localhost:8083/swagger-ui.html` | `/v3/api-docs` |
| genai-service | `http://localhost:8090/docs` | `/openapi.json` |
| upload-service | `http://localhost:8091/docs` | `/openapi.json` |

The Spring services generate their docs from the live controllers via **springdoc-openapi**;
the Python services expose FastAPI's built-in Swagger UI. The hand-written OpenAPI
contracts (the single source of truth) live in [`api/`](api/).

## Architecture Diagrams

UML-style diagrams are in [`documents/diagrams/`](documents/diagrams/):

- **Subsystem Decomposition** — [documents/diagrams/Subsystem Decomposition.md](documents/diagrams/Subsystem%20Decomposition.md)
- **Use Case Diagram** — `documents/diagrams/Use Case Diagram.pdf`
- **Analysis Object Model** — `documents/diagrams/Analysis Object Model.png`
- **Component Diagram** — `documents/diagrams/Component Diagram v1.png`

A written architecture overview is in [documents/system_structure.md](documents/system_structure.md).

repo's `Kubernetes` GitHub environment.

## Enable Pre-commit Hook

From repository root, install and enable pre-commit:

1. `pip install -r requirements-dev.txt`
2. `pre-commit install`