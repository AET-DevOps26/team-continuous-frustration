# coding: utf-8

from fastapi.testclient import TestClient


from pydantic import Field, StrictBytes, StrictStr  # noqa: F401
from typing import Tuple, Union  # noqa: F401
from typing_extensions import Annotated  # noqa: F401
from openapi_server.models.error import Error  # noqa: F401
from openapi_server.models.explanation_response import ExplanationResponse  # noqa: F401
from openapi_server.models.flashcard import Flashcard  # noqa: F401
from openapi_server.models.generate_flashcards_request import GenerateFlashcardsRequest  # noqa: F401
from openapi_server.models.upload_response import UploadResponse  # noqa: F401


def test_uploads_post(client: TestClient):
    """Test case for uploads_post

    Upload a document for processing
    """

    headers = {
        "Authorization": "Bearer special-key",
    }
    data = {
        "file": '/path/to/file'
    }
    # uncomment below to make a request
    #response = client.request(
    #    "POST",
    #    "/uploads",
    #    headers=headers,
    #    data=data,
    #)

    # uncomment below to assert the status code of the HTTP response
    #assert response.status_code == 200


def test_generate_flashcards_post(client: TestClient):
    """Test case for generate_flashcards_post

    Generate flashcards from an uploaded document
    """
    generate_flashcards_request = {"upload_id":"upload_id"}

    headers = {
        "Authorization": "Bearer special-key",
    }
    # uncomment below to make a request
    #response = client.request(
    #    "POST",
    #    "/generate-flashcards",
    #    headers=headers,
    #    json=generate_flashcards_request,
    #)

    # uncomment below to assert the status code of the HTTP response
    #assert response.status_code == 200


def test_explain_post(client: TestClient):
    """Test case for explain_post

    Explain a flashcard
    """
    flashcard = {"last_updated":"2000-01-23T04:56:07.000+00:00","question":"question","answer":"answer","source_ref":"source_ref","id":"id"}

    headers = {
        "Authorization": "Bearer special-key",
    }
    # uncomment below to make a request
    #response = client.request(
    #    "POST",
    #    "/explain",
    #    headers=headers,
    #    json=flashcard,
    #)

    # uncomment below to assert the status code of the HTTP response
    #assert response.status_code == 200
