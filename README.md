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


## Starting All Services

From the `infra/` directory, a single command starts everything (PostgreSQL, auth-service, flashcard-service, genai-service, web-client):

```bash
cd infra
docker compose up --build
```

| Service | URL |
|---|---|
| Auth service | http://localhost:8083 |
| Flashcard service | http://localhost:8082 |
| GenAI service | http://localhost:8090 |
| Web client | http://localhost:5173 |
| PostgreSQL | localhost:5432 |

The `.env` file in `infra/` already has defaults for local development. To stop all services:

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

---

## Running Services Individually

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

## Azure VM Deployment

### VM Information

- VM name: `team-continuous-frustration`
- Public IP address: `20.240.186.130`
- SSH user: `azureuser`
- Client URL: https://client.20.240.186.130.nip.io

### How to connect to the Azure VM

```bash
chmod 400 ./team-continuous-frustration_key.pem
ssh -i ./team-continuous-frustration_key.pem azureuser@20.240.186.130
```

### Verify Docker Installation
```bash
docker --version
docker compose version
docker ps
```

### Deploy the Project with Docker Compose
```bash
cd ~/team-continuous-frustration/infra
cp .env.example .env
docker compose -f docker-compose.azure.yml --env-file .env down
docker compose -f docker-compose.azure.yml --env-file .env up -d --build
```

### How to access the application
https://client.20.240.186.130.nip.io

### Automated Azure Deployment with Terraform and Ansible

Terraform files are located in:

```text
infra/terraform/
```

Ansible files are located in:
```text
infra/ansible/
```

### Create Azure VM with Terraform
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```
### Configure Ansible inventory
```bash
cd ../ansible
cp inventory.ini.example inventory.ini
```

### Configure Ansible variables
```bash
cp group_vars/all.yml.example group_vars/all.yml
```

### Run Ansible deployment
```bash
ansible-playbook -i inventory.ini playbook.yml
```