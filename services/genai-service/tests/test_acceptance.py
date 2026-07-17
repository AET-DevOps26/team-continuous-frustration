"""Integration/acceptance tests for the GenAI service HTTP API.

These drive the FastAPI app through a TestClient. External dependencies
(the upload service, the vector store, and the LLM pipeline) are mocked so the
tests exercise the API contract, routing, streaming, and error handling — not
the model itself.
"""

import datetime
import json
from unittest.mock import patch

from fastapi.testclient import TestClient

from openapi_server.models.flashcard import Flashcard


def _card(i: int) -> Flashcard:
    return Flashcard(
        id=f"c{i}",
        question=f"Q{i}",
        answer=f"A{i}",
        source_ref="upload-1",
        last_updated=datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc),
    )


def test_health_returns_ok(client: TestClient):
    response = client.get("/api/v1/genai/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generate_flashcards_streams_ndjson(client: TestClient):
    with patch("openapi_server.impl.controller.UploadServiceClientAPIs") as mock_client, \
            patch("openapi_server.impl.controller.upsert_markdown_to_weaviate") as mock_upsert, \
            patch("openapi_server.impl.controller.generate_flashcards_stream") as mock_stream:
        mock_client.return_value.documents_get_documents_upload_id_get.return_value = "# lecture"
        mock_stream.return_value = iter([_card(1), _card(2)])

        response = client.post(
            "/api/v1/genai/generate-flashcards", params={"upload_id": "upload-1"}
        )

        assert response.status_code == 200
        lines = [line for line in response.text.splitlines() if line.strip()]
        assert len(lines) == 2
        assert json.loads(lines[0])["question"] == "Q1"
        assert json.loads(lines[1])["answer"] == "A2"
        mock_upsert.assert_called_once()
        mock_stream.assert_called_once_with("upload-1")


def test_explain_returns_explanation(client: TestClient):
    flashcard = {
        "id": "c1",
        "question": "What is a hypervisor?",
        "answer": "Runs VMs.",
        "source_ref": "upload-1",
        "last_updated": "2026-01-01T00:00:00Z",
    }
    with patch(
        "openapi_server.impl.controller.generate_explanation",
        return_value="Because it virtualizes hardware.",
    ):
        response = client.post("/api/v1/genai/explain", json=flashcard)

    assert response.status_code == 200
    assert response.json()["explanation"] == "Because it virtualizes hardware."


def test_explain_propagates_server_error(client: TestClient):
    flashcard = {
        "id": "c1",
        "question": "Q",
        "answer": "A",
        "source_ref": "upload-1",
        "last_updated": "2026-01-01T00:00:00Z",
    }
    with patch(
        "openapi_server.impl.controller.generate_explanation",
        side_effect=RuntimeError("llm down"),
    ):
        response = client.post("/api/v1/genai/explain", json=flashcard)

    assert response.status_code == 500
