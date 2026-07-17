"""Integration/acceptance tests for the Upload service HTTP API.

Drives the FastAPI app through a TestClient across the full request path
(multipart parsing, extension validation, markdown conversion, response models).
The database persistence layer is mocked; conversion is stubbed so the tests do
not depend on MarkItDown internals.
"""

from unittest.mock import patch

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient):
    response = client.get("/api/v1/documents/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_txt_returns_upload_id(client: TestClient):
    with patch("openapi_server.impl.controller.convert_to_markdown", return_value="# notes"), \
            patch("openapi_server.impl.controller.store_markdown", return_value="upload-123"):
        response = client.post(
            "/api/v1/documents/upload",
            files={"file": ("notes.txt", b"hello world", "text/plain")},
        )

    assert response.status_code == 200
    assert response.json() == {"upload_id": "upload-123"}


def test_upload_empty_file_is_rejected(client: TestClient):
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 400


def test_upload_unsupported_extension_is_rejected(client: TestClient):
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("malware.exe", b"data", "application/octet-stream")},
    )
    assert response.status_code == 415


def test_get_document_returns_content(client: TestClient):
    with patch("openapi_server.impl.controller.get_document", return_value="# stored"):
        response = client.get("/api/v1/documents/upload-123")

    assert response.status_code == 200
    assert response.text == "# stored"
    assert response.headers["content-type"].startswith("text/markdown")


def test_get_missing_document_returns_404(client: TestClient):
    with patch("openapi_server.impl.controller.get_document", return_value=None):
        response = client.get("/api/v1/documents/does-not-exist")

    assert response.status_code == 404
