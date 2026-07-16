import datetime
from unittest.mock import MagicMock, patch
import pytest
import weaviate

from openapi_server.core.llm_factory import OpenAICompatibleLLM, REQUEST_TIMEOUT
from openapi_server.core import vector_store as vector_store_module
from openapi_server.core.vector_store import (
    upsert_markdown_to_weaviate,
    query_vector_store,
    _ensure_collection_exists,
)
from openapi_server.core.flashcard_pipeline import (
    generate_flashcards_stream,
    generate_explanation,
)
from openapi_server.core.cache import (
    get_cached_explanation,
    set_cached_explanation,
    EXPLANATION_CACHE_TTL_SECONDS,
)
from openapi_server.models.flashcard import Flashcard

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
            timeout=REQUEST_TIMEOUT,
        )


# ----------------------------------------------------------------------
# 2. Tests for vector_store.py
# ----------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_vector_store_singletons():
    """The client/embeddings/vectorstore are cached module-level singletons;
    reset them around each test so mocks don't leak between tests."""
    vector_store_module._client = None
    vector_store_module._embeddings = None
    vector_store_module._vectorstore = None
    yield
    vector_store_module._client = None
    vector_store_module._embeddings = None
    vector_store_module._vectorstore = None


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
         patch("openapi_server.core.vector_store.WeaviateVectorStore") as MockWeaviateVectorStore:

        mock_client = MagicMock()
        mock_connect.return_value = mock_client
        mock_get_embed.return_value = MagicMock()

        mock_vectorstore_instance = MagicMock()
        MockWeaviateVectorStore.return_value = mock_vectorstore_instance

        result = upsert_markdown_to_weaviate("upload-123", "Some markdown split test")

        assert result is mock_vectorstore_instance
        mock_connect.assert_called_once()
        mock_ensure.assert_called_once_with(mock_client)
        mock_get_embed.assert_called_once()
        MockWeaviateVectorStore.assert_called_once_with(
            client=mock_client,
            index_name="FlashcardDocument",
            text_key="text",
            embedding=mock_get_embed.return_value,
        )
        mock_vectorstore_instance.add_documents.assert_called_once()

        # A second call should reuse the cached client/vectorstore instead of
        # reconnecting or rebuilding them.
        upsert_markdown_to_weaviate("upload-456", "More markdown")
        mock_connect.assert_called_once()
        mock_ensure.assert_called_once()
        MockWeaviateVectorStore.assert_called_once()


def test_query_vector_store():
    with patch("openapi_server.core.vector_store.weaviate.connect_to_local") as mock_connect, \
         patch("openapi_server.core.vector_store._ensure_collection_exists") as mock_ensure, \
         patch("openapi_server.core.vector_store.get_embeddings") as mock_get_embed, \
         patch("openapi_server.core.vector_store.WeaviateVectorStore") as MockWeaviateVectorStore:

        mock_client = MagicMock()
        mock_connect.return_value = mock_client
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

        # A second query should reuse the cached client/vectorstore instead
        # of reconnecting or rebuilding them.
        query_vector_store("another query", 3, "mock filters")
        mock_connect.assert_called_once()
        mock_ensure.assert_called_once()
        MockWeaviateVectorStore.assert_called_once()


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


def test_generate_explanation():
    from langchain_core.documents import Document

    mock_docs = [
        Document(page_content="TUM is a prestigious university located in Munich."),
    ]

    flashcard = Flashcard(
        id="flashcard-1",
        question="What is TUM?",
        answer="Technical University of Munich",
        source_ref="upload-abc",
        last_updated="2024-01-01T00:00:00+00:00",
    )

    with patch("openapi_server.core.flashcard_pipeline.query_vector_store") as mock_query, \
         patch("openapi_server.core.llm_factory.OpenAICompatibleLLM._call") as mock_llm_call, \
         patch("openapi_server.core.flashcard_pipeline.get_cached_explanation") as mock_get_cache, \
         patch("openapi_server.core.flashcard_pipeline.set_cached_explanation") as mock_set_cache:

        mock_get_cache.return_value = None
        mock_query.return_value = mock_docs
        mock_llm_call.return_value = "  TUM stands for Technical University of Munich. \n"

        explanation = generate_explanation(flashcard)

        assert explanation == "TUM stands for Technical University of Munich."

        mock_query.assert_called_once()
        _, kwargs = mock_query.call_args
        assert kwargs["query"] == "What is TUM?\nTechnical University of Munich"
        assert kwargs["k"] == 3

        mock_llm_call.assert_called_once()

        mock_get_cache.assert_called_once_with(
            "flashcard-1", flashcard.last_updated.isoformat()
        )
        mock_set_cache.assert_called_once_with(
            "flashcard-1",
            flashcard.last_updated.isoformat(),
            "TUM stands for Technical University of Munich.",
        )


def test_generate_explanation_cache_hit():
    flashcard = Flashcard(
        id="flashcard-1",
        question="What is TUM?",
        answer="Technical University of Munich",
        source_ref="upload-abc",
        last_updated="2024-01-01T00:00:00+00:00",
    )

    with patch("openapi_server.core.flashcard_pipeline.get_cached_explanation") as mock_get_cache, \
         patch("openapi_server.core.flashcard_pipeline.set_cached_explanation") as mock_set_cache, \
         patch("openapi_server.core.flashcard_pipeline.query_vector_store") as mock_query, \
         patch("openapi_server.core.llm_factory.OpenAICompatibleLLM._call") as mock_llm_call:

        mock_get_cache.return_value = "Cached explanation"

        explanation = generate_explanation(flashcard)

        assert explanation == "Cached explanation"
        mock_query.assert_not_called()
        mock_llm_call.assert_not_called()
        mock_set_cache.assert_not_called()


# ----------------------------------------------------------------------
# 4. Tests for cache.py
# ----------------------------------------------------------------------

def test_get_cached_explanation_hit():
    with patch("openapi_server.core.cache.get_redis_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.get.return_value = "Cached explanation"
        mock_get_client.return_value = mock_client

        result = get_cached_explanation("flashcard-1", "2024-01-01T00:00:00+00:00")

        assert result == "Cached explanation"
        mock_client.get.assert_called_once_with(
            "explanation:flashcard-1:2024-01-01T00:00:00+00:00"
        )


def test_get_cached_explanation_miss():
    with patch("openapi_server.core.cache.get_redis_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.get.return_value = None
        mock_get_client.return_value = mock_client

        result = get_cached_explanation("flashcard-1", "2024-01-01T00:00:00+00:00")

        assert result is None


def test_get_cached_explanation_redis_error_returns_none():
    with patch("openapi_server.core.cache.get_redis_client") as mock_get_client:
        mock_get_client.side_effect = ConnectionError("redis unavailable")

        result = get_cached_explanation("flashcard-1", "2024-01-01T00:00:00+00:00")

        assert result is None


def test_set_cached_explanation_stores_with_ttl():
    with patch("openapi_server.core.cache.get_redis_client") as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        set_cached_explanation(
            "flashcard-1", "2024-01-01T00:00:00+00:00", "Some explanation"
        )

        mock_client.set.assert_called_once_with(
            "explanation:flashcard-1:2024-01-01T00:00:00+00:00",
            "Some explanation",
            ex=EXPLANATION_CACHE_TTL_SECONDS,
        )


def test_set_cached_explanation_redis_error_is_swallowed():
    with patch("openapi_server.core.cache.get_redis_client") as mock_get_client:
        mock_get_client.side_effect = ConnectionError("redis unavailable")

        # Should not raise despite Redis being unavailable.
        set_cached_explanation(
            "flashcard-1", "2024-01-01T00:00:00+00:00", "Some explanation"
        )
