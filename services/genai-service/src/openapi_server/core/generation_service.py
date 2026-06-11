from typing import Iterator

from src.openapi_server.storage import read_bytes
from src.openapi_server.core.document_processor import convert_to_markdown
from src.openapi_server.core.vector_store import upsert_markdown_to_weaviate
from src.openapi_server.core.flashcard_pipeline import generate_flashcards_stream


class GenerationService:
    @staticmethod
    def generate(upload_id: str) -> Iterator[str]:
        """
        Orchestrates the entire flashcard generation pipeline:
        1. Reads file bytes based on upload_id.
        2. Converts bytes to Markdown using markitdown.
        3. Upserts the Markdown text to Weaviate.
        4. Invokes the flashcard generator and streams the NDJSON output.
        """
        file_bytes = None
        extension_used = ".txt"

        # Try finding the file using allowed extensions
        for ext in [".pdf", ".txt"]:
            try:
                file_bytes = read_bytes(f"{upload_id}{ext}")
                extension_used = ext
                break
            except Exception:
                continue

        if file_bytes is None:
            raise ValueError(f"Could not find uploaded file for upload_id: {upload_id}")

        md_text = convert_to_markdown(file_bytes, extension_used)

        upsert_markdown_to_weaviate(upload_id, md_text)

        for item in generate_flashcards_stream(upload_id):
            yield item
