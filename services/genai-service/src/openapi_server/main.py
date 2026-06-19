# coding: utf-8
from fastapi import FastAPI

from openapi_server.impl.controller import router as DefaultApiRouter

import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

app = FastAPI(
    title="GenAI Service API",
    description="GenAI service endpoints for flashcard generation. The /generate-flashcards endpoint streams NDJSON where each line is a Flashcard object. ",
    version="v1",
)

app.include_router(DefaultApiRouter)
