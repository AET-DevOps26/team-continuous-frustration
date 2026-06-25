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

| Service | Port |
|---|---|
| API Gateway | 8080 |
| Auth service | 8081 |
| Flashcard service | 8082 |
| GenAI service | 8090 |
| Upload service | 8091 |
| Web client | 5173 |

To stop all services:

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

---

## Azure VM Deployment

### VM Information

- VM name: `team-continuous-frustration`
- Public IP address: `20.240.186.130`
- SSH user: `azureuser`
- Client URL: https://20.240.186.130.nip.io

### Run Azure CI 

1. Go to https://github.com/AET-DevOps26/team-continuous-frustration/actions/workflows/deploy_azure.yaml
2. Click on "Run workflow"
3. Select branch to deploy
4. Click on "Run workflow" to start the deployment action


### How to connect to the Azure VM

```bash
chmod 400 ./team-continuous-frustration_key.pem
ssh -i ./team-continuous-frustration_key.pem azureuser@20.240.186.130
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


When running locally Swagger UI will be available at 
- `http://localhost:8090/docs`
- `http://localhost:8091/docs`