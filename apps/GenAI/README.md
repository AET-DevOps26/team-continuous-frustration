# GenAI FastAPI Server

## Setup

1. Create a virtual environment (optional):
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
2. Install dependencies:
   - `pip install -r requirements.txt`

## Run

Use Uvicorn to start the server:

`uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload`

## Healthcheck

`GET /health`

Example response:

```json
{"status":"ok"}
```

## API Documentation

- Swagger UI: `http://localhost:8001/docs`
- OpenAPI JSON: `http://localhost:8001/openapi.json`
- ReDoc: `http://localhost:8001/redoc`

## Pre-commit Pylint Hook

Run it manually on all files:

`pre-commit run --all-files`

Configured hook file:

`/.pre-commit-config.yaml`
