# coding: utf-8

from fastapi import FastAPI

from openapi_server.apis.default_api import router as DefaultApiRouter

app = FastAPI(
    title="GenAI Service API",
    description="GenAI service endpoints for flashcard generation. The /generate-flashcards endpoint streams NDJSON where each line is a Flashcard object. ",
    version="v1",
)

app.include_router(DefaultApiRouter, prefix="/genai/v1")
