# coding: utf-8

import datetime
from typing import Optional, Tuple

from fastapi import APIRouter, HTTPException, Security, UploadFile, status
from fastapi.responses import PlainTextResponse

from openapi_server.models.extra_models import TokenModel  # noqa: F401
from openapi_server.models.error import Error
from openapi_server.models.upload_response import UploadResponse
from openapi_server.security_api import get_token_bearerAuth
from openapi_server.storage import (
    convert_to_markdown,
    store_markdown,
    get_document,
    validate_extension,
)

router = APIRouter()


@router.get("/api/v1/documents/health", response_model=dict, tags=["default"])
async def health():
    return {"status": "ok"}


@router.post(
    "/api/v1/documents/upload",
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
async def documents_upload_post(
    file: UploadFile,
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> UploadResponse:
    """Upload a PDF or TXT file and receive an upload id."""
    filename, content = await _read_upload(file)
    extension = validate_extension(filename)

    markdown_content = convert_to_markdown(content, extension)
    upload_id = store_markdown(
        markdown_content,
        filename,
        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    return UploadResponse(upload_id=upload_id)


@router.get(
    "/api/v1/documents/{upload_id}",
    responses={
        200: {"description": "Document retrieved successfully."},
        400: {
            "model": Error,
            "description": "Invalid request.",
        },
        404: {"model": Error, "description": "Document not found."},
    },
    tags=["default"],
    summary="Get a document",
    response_class=PlainTextResponse,
)
async def documents_get(
    upload_id: str,
    token_bearerAuth: TokenModel = Security(get_token_bearerAuth),
) -> PlainTextResponse:
    """Get a document"""
    document = get_document(upload_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return PlainTextResponse(content=document, media_type="text/markdown")


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
