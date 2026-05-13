# coding: utf-8

from typing import ClassVar, Dict, List, Tuple  # noqa: F401

from pydantic import Field, StrictBytes, StrictStr
from typing import Tuple, Union
from typing_extensions import Annotated
from openapi_server.models.error import Error
from openapi_server.models.explanation_response import ExplanationResponse
from openapi_server.models.flashcard import Flashcard
from openapi_server.models.generate_flashcards_request import GenerateFlashcardsRequest
from openapi_server.models.upload_response import UploadResponse
from openapi_server.security_api import get_token_bearerAuth

class BaseDefaultApi:
    subclasses: ClassVar[Tuple] = ()

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        BaseDefaultApi.subclasses = BaseDefaultApi.subclasses + (cls,)
    async def uploads_post(
        self,
        file: Annotated[Union[StrictBytes, StrictStr, Tuple[StrictStr, StrictBytes]], Field(description="PDF or TXT file to process.")],
    ) -> UploadResponse:
        """Upload a PDF or TXT file and receive an upload id."""
        ...


    async def generate_flashcards_post(
        self,
        generate_flashcards_request: GenerateFlashcardsRequest,
    ) -> Flashcard:
        """Provide an upload id and receive a streamed NDJSON response. Each line is a JSON object with fields id, question, answer, source_ref. """
        ...


    async def explain_post(
        self,
        flashcard: Flashcard,
    ) -> ExplanationResponse:
        """Generate an explanation for a given flashcard."""
        ...
