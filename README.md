# team-continuous-frustration
Repository for team Continuous Frustration

## Team Responsibilities

| Member | Main Responsibility |
|---|---|
| Paul Marius Heizmann | GenAI Component |
| Khalil Hkiri | Server / Backend |
| Siyao Zhou | Client / Frontend |

## Enable Pre-commit Hook

From repository root, install and enable pre-commit:

1. `pip install -r requirements-dev.txt`
2. `pre-commit install`


## Running Services

### Flashcard Service

From the repository root:

**Build the image:**
```bash
docker build -t flashcard-service services/flashcard-service
```

**Run the container:**
```bash
docker run -p 8081:8081 flashcard-service
```

**Test the healthcheck endpoint:**
```bash
curl http://localhost:8081/health
```

Expected response:
```json
{"status":"UP"}
```

> The app runs on port `8081` inside the container. You can map it to any free port on your machine: `docker run -p <your-port>:8081 flashcard-service`

### Azure VM Information

- VM name: `team-continuous-frustration`
- Operating system: Ubuntu 24.04
- Public IP address: `20.240.186.130`
- SSH user: `azureuser`
- Open inbound ports:
  - `22` for SSH
  - `80` for HTTP
  - `443` for HTTPS

### How to connect to the VM

ssh -i <path-to-key>/team-continuous-frustration_key.pem azureuser@20.240.186.130
cd ~/team-continuous-frustration/infra
cp .env.example .env
docker compose up --build -d
docker ps

### How to access the application
http://20.240.186.130