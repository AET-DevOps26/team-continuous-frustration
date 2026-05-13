# coding: utf-8

from typing import Dict, List  # noqa: F401
import importlib
import pkgutil

from openapi_server.apis.default_api_base import BaseDefaultApi
import openapi_server.impl

from fastapi import (  # noqa: F401
    APIRouter,
    Body,
    Cookie,
    Depends,
    Form,
    Header,
    HTTPException,
    Path,
    Query,
    Response,
    Security,
    status,
)

from openapi_server.models.extra_models import TokenModel  # noqa: F401
from pydantic import Field, StrictBytes, StrictStr
from typing import Tuple, Union
from typing_extensions import Annotated
from openapi_server.models.error import Error
from openapi_server.models.explanation_response import ExplanationResponse
from openapi_server.models.flashcard import Flashcard
from openapi_server.models.generate_flashcards_request import GenerateFlashcardsRequest
from openapi_server.models.upload_response import UploadResponse
from openapi_server.security_api import get_token_bearerAuth

router = APIRouter()

ns_pkg = openapi_server.impl
for _, name, _ in pkgutil.iter_modules(ns_pkg.__path__, ns_pkg.__name__ + "."):
    importlib.import_module(name)


@router.post(
    "/uploads",
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
async def uploads_post(
    file: Annotated[
        Union[StrictBytes, StrictStr, Tuple[StrictStr, StrictBytes]],
        Field(description="PDF or TXT file to process."),
    ] = Form(None, description="PDF or TXT file to process."),
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> UploadResponse:
    """Upload a PDF or TXT file and receive an upload id."""
    if not BaseDefaultApi.subclasses:
        raise HTTPException(status_code=500, detail="Not implemented")
    return await BaseDefaultApi.subclasses[0]().uploads_post(file)


@router.post(
    "/generate-flashcards",
    responses={
        200: {
            "model": Flashcard,
            "description": "NDJSON stream of generated flashcards.",
        },
        400: {"model": Error, "description": "Invalid request."},
        404: {"model": Error, "description": "Upload id not found."},
        500: {"model": Error, "description": "Server error during generation."},
    },
    tags=["default"],
    summary="Generate flashcards from an uploaded document",
    response_model_by_alias=True,
)
async def generate_flashcards_post(
    generate_flashcards_request: GenerateFlashcardsRequest = Body(None, description=""),
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> Flashcard:
    """Provide an upload id and receive a streamed NDJSON response. Each line is a JSON object with fields id, question, answer, source_ref."""
    if not BaseDefaultApi.subclasses:
        raise HTTPException(status_code=500, detail="Not implemented")
    return await BaseDefaultApi.subclasses[0]().generate_flashcards_post(
        generate_flashcards_request
    )


@router.post(
    "/explain",
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
async def explain_post(
    flashcard: Flashcard = Body(None, description=""),
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> ExplanationResponse:
    """Generate an explanation for a given flashcard."""
    if not BaseDefaultApi.subclasses:
        raise HTTPException(status_code=500, detail="Not implemented")
    return await BaseDefaultApi.subclasses[0]().explain_post(flashcard)
