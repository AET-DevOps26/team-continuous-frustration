# coding: utf-8

import logging
import uuid
from typing import Optional, Tuple

from fastapi import APIRouter, Body, HTTPException, Security, UploadFile, status
from fastapi.responses import StreamingResponse

from openapi_server.models.extra_models import TokenModel  # noqa: F401
from openapi_server.models.error import Error
from openapi_server.models.explanation_response import ExplanationResponse
from openapi_server.models.flashcard import Flashcard
from openapi_server.models.upload_response import UploadResponse
from openapi_server.security_api import get_token_bearerAuth
from openapi_server.storage import store_bytes, validate_extension

from openapi_server.core.document_processor import convert_to_markdown
from openapi_server.core.vector_store import upsert_markdown_to_weaviate
from openapi_server.core.flashcard_pipeline import generate_flashcards_stream

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/api/v1/genai/uploads",
    responses={
        201: {"model": UploadResponse, "description": "Upload accepted."},
        400: {
            "model": Error,
            "description": "Invalid request or unsupported file format.",
        },
        413: {"model": Error, "description": "Uploaded file too large."},
        415: {"model": Error, "description": "Unsupported media type."},
        500: {"model": Error, "description": "Server error during upload."},
    },
    tags=["default"],
    summary="Upload a document for processing",
    response_model_by_alias=True,
)
async def api_v1_genai_uploads_post(
    file: UploadFile,
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> UploadResponse:
    """Upload a PDF or TXT file and receive an upload id."""
    filename, content = await _read_upload(file)
    logger.info("[upload] Received file '%s' (%d bytes)", filename, len(content))
    extension = validate_extension(filename)
    upload_id = str(uuid.uuid4())
    storage_key = f"{upload_id}{extension}"
    logger.debug("[upload] Storing as key='%s'", storage_key)
    store_bytes(storage_key, content)
    logger.info("[upload] Stored upload_id=%s", upload_id)
    return UploadResponse(upload_id=upload_id)


@router.post(
    "/api/v1/genai/generate-flashcards",
    responses={
        200: {
            "model": Flashcard,
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
    file: UploadFile,
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> StreamingResponse:
    filename, content = await _read_upload(file)
    extension = validate_extension(filename)
    logger.info("[test-generate] Received file '%s' (%d bytes)", filename, len(content))

    logger.debug("[test-generate] Converting to markdown")
    markdown_text = convert_to_markdown(content, extension)
    logger.debug("[test-generate] Markdown preview: %s", markdown_text[:500])

    upload_id = str(uuid.uuid4())
    logger.info("[test-generate] Generated upload_id=%s", upload_id)

    logger.debug("[test-generate] Upserting markdown to Weaviate")
    upsert_markdown_to_weaviate(upload_id, markdown_text)
    logger.info("[test-generate] Upsert complete — starting flashcard stream")

    return StreamingResponse(
        generate_flashcards_stream(upload_id), media_type="application/x-ndjson"
    )


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
