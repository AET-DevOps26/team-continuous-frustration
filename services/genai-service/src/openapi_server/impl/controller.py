# coding: utf-8

import logging
import os
from typing import Optional, Tuple
from collections.abc import AsyncIterable

from fastapi import APIRouter, Body, HTTPException, Security, UploadFile, status

from openapi_server.models.extra_models import TokenModel  # noqa: F401
from openapi_server.models.error import Error
from openapi_server.models.explanation_response import ExplanationResponse
from openapi_server.models.flashcard import Flashcard
from openapi_server.security_api import get_token_bearerAuth

from openapi_server.core.vector_store import upsert_markdown_to_weaviate
from openapi_server.core.flashcard_pipeline import (
    generate_flashcards_stream,
    generate_explanation,
)

from upload_service_client import UploadServiceClientAPIs

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_SERVICE_BASE_URL = os.getenv("UPLOAD_SERVICE_BASE_URL", "http://upload-service:8091")


@router.get("/api/v1/genai/health", response_model=dict, tags=["default"])
async def health():
    return {"status": "ok"}


@router.post(
    "/api/v1/genai/generate-flashcards",
    responses={
        200: {
            "content": {
                "application/x-ndjson": {
                    "schema": {"$ref": "#/components/schemas/Flashcard"}
                }
            },
            "description": "NDJSON stream of generated flashcards.",
        },
        400: {"model": Error, "description": "Invalid request."},
        500: {"model": Error, "description": "Server error during generation."},
    },
    tags=["default"],
    summary="Generate flashcards from an uploaded document",
    response_model_by_alias=True,
    response_model=None,
)
async def api_v1_genai_generate_flashcards_post(
    upload_id: str,
) -> AsyncIterable[Flashcard]:
    client = UploadServiceClientAPIs(
        base_url=UPLOAD_SERVICE_BASE_URL, auth_token="your-api-token"
    )
    markdown_text = client.documents_get_documents_upload_id_get(upload_id)

    logger.debug("[generate] Upserting markdown to Weaviate")
    upsert_markdown_to_weaviate(upload_id, markdown_text)
    logger.info("[generate] Upsert complete — starting flashcard stream")

    for flashcard in generate_flashcards_stream(upload_id):
        yield flashcard


@router.post(
    "/api/v1/genai/explain",
    responses={
        200: {
            "model": ExplanationResponse,
            "description": "Explanation for the flashcard.",
        },
        400: {"model": Error, "description": "Invalid request."},
        500: {"model": Error, "description": "Server error during explanation."},
    },
    tags=["default"],
    summary="Explain a flashcard",
    response_model_by_alias=True,
)
async def api_v1_genai_explain_post(
    flashcard: Flashcard = Body(None, description=""),
) -> ExplanationResponse:
    """Generate an explanation for a given flashcard."""
    try:
        explanation = generate_explanation(flashcard)
        return ExplanationResponse(explanation=explanation)
    except Exception as e:
        logger.error("[explain] Failed to generate explanation: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


async def _read_upload(file: UploadFile) -> Tuple[Optional[str], bytes]:
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing file payload",
        )
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty upload payload",
        )
    return file.filename, content
