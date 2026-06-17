import asyncio
import logging

import grpc
from grpc_server.genai_pb2 import GenerateFlashcardsRequest, Flashcard, Explanation
from grpc_server.genai_pb2_grpc import (
    GenaiServiceServicer,
    add_GenaiServiceServicer_to_server,
)

from upload_service_client import UploadServiceClientAPIs
from grpc_server.core.vector_store import upsert_markdown_to_weaviate
from grpc_server.core.flashcard_pipeline import generate_flashcards_stream

logger = logging.getLogger(__name__)


class GenaiServer(GenaiServiceServicer):
    async def GenerateFlashcards(
        self, request: GenerateFlashcardsRequest, context: grpc.aio.ServicerContext
    ) -> Flashcard:
        client = UploadServiceClientAPIs(
            base_url="http://upload-service:8091", auth_token="your-api-token"
        )
        upload_id = request.upload_id
        logger.info(f"[generate] Received request for upload_id: {upload_id}")

        markdown_text = client.documents_get_documents_upload_id_get(upload_id)

        logger.debug("[generate] Upserting markdown to Weaviate")
        upsert_markdown_to_weaviate(upload_id, markdown_text)
        logger.info("[generate] Upsert complete — starting flashcard stream")

        for flashcard in generate_flashcards_stream(upload_id):
            yield flashcard

    async def GenerateExplanation(
        self, request: Flashcard, context: grpc.aio.ServicerContext
    ) -> Explanation:
        raise Exception("Not implemented")


async def serve() -> None:
    server = grpc.aio.server()
    add_GenaiServiceServicer_to_server(GenaiServer(), server)
    listen_addr = "[::]:50052"
    server.add_insecure_port(listen_addr)
    logging.info("Starting server on %s", listen_addr)
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(serve())
