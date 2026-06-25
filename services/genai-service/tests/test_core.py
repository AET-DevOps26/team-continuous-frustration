import datetime
from unittest.mock import MagicMock, patch
import weaviate

from openapi_server.core.llm_factory import OpenAICompatibleLLM
from openapi_server.core.vector_store import (
    upsert_markdown_to_weaviate,
    query_vector_store,
    _ensure_collection_exists,
)
from openapi_server.core.flashcard_pipeline import generate_flashcards_stream

# ----------------------------------------------------------------------
# 1. Tests for llm_factory.py
# ----------------------------------------------------------------------

def test_llm_factory_call():
    llm = OpenAICompatibleLLM(
        base_url="http://mock-llm/v1",
        api_key="mock-key",
        model_name="mock-model",
    )
    with patch("openapi_server.core.llm_factory.requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "  Expected LLM Answer \n"
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        result = llm._call("mock prompt")
        assert result == "Expected LLM Answer"
        mock_post.assert_called_once_with(
            "http://mock-llm/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer mock-key",
            },
            json={
                "model": "mock-model",
                "messages": [{"role": "user", "content": "mock prompt"}],
            },
            timeout=30,
        )


# ----------------------------------------------------------------------
# 2. Tests for vector_store.py
# ----------------------------------------------------------------------

def test_ensure_collection_exists_already_exists():
    mock_client = MagicMock()
    # collections.get succeeds, meaning collection already exists
    _ensure_collection_exists(mock_client)
    mock_client.collections.get.assert_called_once_with("FlashcardDocument")
    mock_client.collections.create.assert_not_called()


def test_ensure_collection_exists_creates_new():
    mock_client = MagicMock()
    # collections.get raises WeaviateBaseError, triggers creation
    mock_client.collections.get.side_effect = weaviate.exceptions.WeaviateBaseError("collection not found")

    with patch("openapi_server.core.vector_store.Configure") as mock_configure:
        _ensure_collection_exists(mock_client)
        mock_client.collections.get.assert_called_once_with("FlashcardDocument")
        mock_client.collections.create.assert_called_once()


def test_upsert_markdown_to_weaviate():
    with patch("openapi_server.core.vector_store.weaviate.connect_to_local") as mock_connect, \
         patch("openapi_server.core.vector_store._ensure_collection_exists") as mock_ensure, \
         patch("openapi_server.core.vector_store.get_embeddings") as mock_get_embed, \
         patch("openapi_server.core.vector_store.WeaviateVectorStore.from_documents") as mock_from_docs:

        mock_client = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_client
        mock_get_embed.return_value = MagicMock()
        mock_from_docs.return_value = "mock_vectorstore"

        result = upsert_markdown_to_weaviate("upload-123", "Some markdown split test")

        assert result == "mock_vectorstore"
        mock_connect.assert_called_once()
        mock_ensure.assert_called_once_with(mock_client)
        mock_get_embed.assert_called_once()
        mock_from_docs.assert_called_once()


def test_query_vector_store():
    with patch("openapi_server.core.vector_store.weaviate.connect_to_local") as mock_connect, \
         patch("openapi_server.core.vector_store._ensure_collection_exists") as mock_ensure, \
         patch("openapi_server.core.vector_store.get_embeddings") as mock_get_embed, \
         patch("openapi_server.core.vector_store.WeaviateVectorStore") as MockWeaviateVectorStore:

        mock_client = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_client
        mock_get_embed.return_value = MagicMock()

        mock_vectorstore_instance = MagicMock()
        mock_vectorstore_instance.similarity_search.return_value = ["doc1", "doc2"]
        MockWeaviateVectorStore.return_value = mock_vectorstore_instance

        result = query_vector_store("test query", 5, "mock filters")

        assert result == ["doc1", "doc2"]
        mock_connect.assert_called_once()
        mock_ensure.assert_called_once_with(mock_client)
        mock_get_embed.assert_called_once()
        MockWeaviateVectorStore.assert_called_once_with(
            client=mock_client,
            index_name="FlashcardDocument",
            text_key="text",
            embedding=mock_get_embed.return_value,
        )
        mock_vectorstore_instance.similarity_search.assert_called_once_with(
            query="test query", k=5, filters="mock filters"
        )


# ----------------------------------------------------------------------
# 3. Tests for flashcard_pipeline.py
# ----------------------------------------------------------------------

def test_generate_flashcards_stream():
    from langchain_core.documents import Document

    mock_docs = [
        Document(page_content="TUM is a prestigious university located in Munich."),
        Document(page_content="DevOps is a set of practices combining software development and IT operations."),
    ]

    with patch("openapi_server.core.flashcard_pipeline.query_vector_store") as mock_query, \
         patch("openapi_server.core.llm_factory.OpenAICompatibleLLM._call") as mock_llm_call:

        mock_query.return_value = mock_docs

        def mock_call_fn(prompt, stop=None, run_manager=None, **kwargs):
            prompt_str = str(prompt)
            if "generate 3 highly relevant questions" in prompt_str:
                return '{"questions": ["What is TUM?", "What is DevOps?"]}'
            elif "What is TUM?" in prompt_str:
                return "Technical University of Munich"
            elif "What is DevOps?" in prompt_str:
                return "Development and Operations"
            return "Default answer"

        mock_llm_call.side_effect = mock_call_fn

        flashcards = list(generate_flashcards_stream("upload-abc"))

        assert len(flashcards) == 2

        fc1 = flashcards[0]
        assert fc1.question == "What is TUM?"
        assert fc1.answer == "Technical University of Munich"
        assert fc1.source_ref == "upload-abc"
        assert fc1.id is not None
        assert isinstance(fc1.last_updated, (str, datetime.datetime))

        fc2 = flashcards[1]
        assert fc2.question == "What is DevOps?"
        assert fc2.answer == "Development and Operations"
        assert fc2.source_ref == "upload-abc"
        assert fc2.id is not None
        assert isinstance(fc2.last_updated, (str, datetime.datetime))

        mock_query.assert_called_once()
        mock_llm_call.assert_called()
