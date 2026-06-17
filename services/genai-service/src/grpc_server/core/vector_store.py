import logging
import os
from urllib.parse import urlparse

import weaviate
from weaviate.classes.config import Configure
from weaviate.classes.query import Filter

from langchain_text_splitters import MarkdownTextSplitter
from langchain_weaviate.vectorstores import WeaviateVectorStore
from langchain_ollama import OllamaEmbeddings

logger = logging.getLogger(__name__)

# Configuration
WEAVIATE_INDEX_NAME = "FlashcardDocument"
OLLAMA_API_ENDPOINT = os.getenv("OLLAMA_API_ENDPOINT", "http://ollama:11434")
OLLAMA_MODEL = "nomic-embed-text"

WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://weaviate:8080")
WEAVIATE_HOST = urlparse(WEAVIATE_URL).hostname


def get_embeddings():
    """
    Returns OllamaEmbeddings configured to use local Ollama instance.
    """
    logger.debug(
        "Initializing OllamaEmbeddings (base_url=%s, model=%s)",
        OLLAMA_API_ENDPOINT,
        OLLAMA_MODEL,
    )
    try:
        embeddings = OllamaEmbeddings(base_url=OLLAMA_API_ENDPOINT, model=OLLAMA_MODEL)
        logger.debug("OllamaEmbeddings initialized successfully")
        return embeddings
    except Exception as e:
        logger.error("Failed to initialize OllamaEmbeddings: %s", e)
        return None


def _ensure_collection_exists(client):
    """
    Ensures the Weaviate collection exists with Ollama vectorization.
    Creates it if it doesn't exist.
    """
    logger.debug("Checking if Weaviate collection '%s' exists", WEAVIATE_INDEX_NAME)
    try:
        client.collections.get(WEAVIATE_INDEX_NAME)
        logger.debug("Collection '%s' already exists", WEAVIATE_INDEX_NAME)
    except weaviate.exceptions.WeaviateException:
        logger.info("Collection '%s' not found — creating it", WEAVIATE_INDEX_NAME)
        client.collections.create(
            name=WEAVIATE_INDEX_NAME,
            vector_config=Configure.Vectors.text2vec_ollama(
                api_endpoint=OLLAMA_API_ENDPOINT, model=OLLAMA_MODEL
            ),
        )
        logger.info("Collection '%s' created successfully", WEAVIATE_INDEX_NAME)


def upsert_markdown_to_weaviate(upload_id: str, markdown_text: str):
    """
    Chunks the input Markdown text and upserts the chunks into Weaviate.
    Attaches the `upload_id` as metadata.
    """
    logger.debug(
        "[upsert] upload_id=%s | markdown length=%d chars",
        upload_id,
        len(markdown_text),
    )

    splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.create_documents(
        texts=[markdown_text], metadatas=[{"upload_id": upload_id}]
    )
    logger.debug("[upsert] Split into %d chunk(s)", len(chunks))

    logger.debug("[upsert] Connecting to Weaviate at %s", WEAVIATE_HOST)
    with weaviate.connect_to_local(host=WEAVIATE_HOST) as client:
        _ensure_collection_exists(client)
        embeddings = get_embeddings()

        logger.debug(
            "[upsert] Upserting %d chunk(s) into collection '%s'",
            len(chunks),
            WEAVIATE_INDEX_NAME,
        )
        vectorstore = WeaviateVectorStore.from_documents(
            chunks,
            embedding=embeddings,
            client=client,
            index_name=WEAVIATE_INDEX_NAME,
            text_key="text",
        )
        logger.info(
            "[upsert] Successfully upserted %d chunk(s) for upload_id=%s",
            len(chunks),
            upload_id,
        )
        return vectorstore


def query_vector_store(query: str, k: int, filters: Filter) -> list:
    """
    Queries the vector store with the given query and filters.
    Returns a list of matching LangChain Documents.
    """
    logger.debug("[query] query=%r | k=%d | filters=%s", query, k, filters)
    logger.debug("[query] Connecting to Weaviate at %s", WEAVIATE_HOST)
    with weaviate.connect_to_local(host=WEAVIATE_HOST) as client:
        _ensure_collection_exists(client)
        embeddings = get_embeddings()
        logger.debug(
            "[query] Running similarity_search in collection '%s'", WEAVIATE_INDEX_NAME
        )
        docs = WeaviateVectorStore(
            client=client,
            index_name=WEAVIATE_INDEX_NAME,
            text_key="text",
            embedding=embeddings,
        ).similarity_search(query=query, k=k, filters=filters)
        logger.info("[query] Retrieved %d document(s) from vector store", len(docs))
        return docs
