# coding: utf-8

import os
from typing import Optional

from fastapi import HTTPException, status


ALLOWED_EXTENSIONS = {".pdf", ".txt"}


def get_storage_backend() -> str:
    backend = os.getenv("STORAGE_BACKEND", "local").strip().lower()
    if backend not in {"local", "azure"}:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid STORAGE_BACKEND configuration",
        )
    return backend


def validate_extension(filename: Optional[str]) -> str:
    if not filename:
        return ""
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type",
        )
    return ext


def store_bytes(storage_key: str, content: bytes) -> None:
    backend = get_storage_backend()
    if backend == "local":
        _store_local(storage_key, content)
        return
    _store_azure(storage_key, content)


def _store_local(storage_key: str, content: bytes) -> None:
    base_dir = os.getenv("LOCAL_STORAGE_PATH", "uploads")
    os.makedirs(base_dir, exist_ok=True)
    path = os.path.join(base_dir, storage_key)
    with open(path, "wb") as handle:
        handle.write(content)


def _store_azure(storage_key: str, content: bytes) -> None:
    try:
        from azure.storage.blob import BlobServiceClient
        from azure.core.exceptions import ResourceExistsError
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Azure storage backend requires azure-storage-blob",
        ) from exc

    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AZURE_STORAGE_CONNECTION_STRING is not set",
        )
    container_name = os.getenv("AZURE_STORAGE_CONTAINER", "uploads")

    service = BlobServiceClient.from_connection_string(connection_string)
    container_client = service.get_container_client(container_name)
    try:
        container_client.create_container()
    except ResourceExistsError:
        pass

    blob_client = container_client.get_blob_client(storage_key)
    blob_client.upload_blob(content, overwrite=True)
