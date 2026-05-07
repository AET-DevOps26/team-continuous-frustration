# team-continuous-frustration
Repository for team Continuous Frustration


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
