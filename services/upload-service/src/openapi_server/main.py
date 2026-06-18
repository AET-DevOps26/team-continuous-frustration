# coding: utf-8

from fastapi import FastAPI

from openapi_server.impl.controller import router as DefaultApiRouter

app = FastAPI(
    title="Document Upload Service API",
    description="Document Upload service endpoints",
    version="v1",
)

app.include_router(DefaultApiRouter, prefix="/api/v1")
