# coding: utf-8

import logging
from typing import Optional, Tuple
from collections.abc import AsyncIterable

from fastapi import APIRouter, Body, HTTPException, Security, UploadFile, status

from openapi_server.models.extra_models import TokenModel  # noqa: F401
from openapi_server.models.error import Error
from openapi_server.models.explanation_response import ExplanationResponse
from openapi_server.models.flashcard import Flashcard
from openapi_server.security_api import get_token_bearerAuth

from openapi_server.core.vector_store import upsert_markdown_to_weaviate
from openapi_server.core.flashcard_pipeline import generate_flashcards_stream

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health", response_model=dict, tags=["default"])
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
)
async def api_v1_genai_generate_flashcards_post(
    upload_id: str,
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> AsyncIterable[Flashcard]:
    markdown_text = "# Test\n## Hello\nThis is a test"
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
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> ExplanationResponse:
    """Generate an explanation for a given flashcard."""
    raise HTTPException(status_code=500, detail="Not implemented")


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
