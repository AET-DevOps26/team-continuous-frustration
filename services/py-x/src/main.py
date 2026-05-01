from fastapi import FastAPI

app = FastAPI(
    title="GenAI API",
    description="Simple GenAI service exposing health and API documentation endpoints.",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.get("/health", tags=["Health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
