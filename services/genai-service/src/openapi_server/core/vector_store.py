import os
import weaviate
from weaviate.classes.config import Configure

from langchain_text_splitters import MarkdownTextSplitter
from langchain_weaviate.vectorstores import WeaviateVectorStore
from langchain_ollama import OllamaEmbeddings

# Configuration
WEAVIATE_INDEX_NAME = "FlashcardDocument"
OLLAMA_API_ENDPOINT = os.getenv("OLLAMA_API_ENDPOINT", "http://ollama:11434")
OLLAMA_MODEL = "nomic-embed-text"
WEAVIATE_HOST = os.getenv("WEAVIATE_HOST", "localhost")
WEAVIATE_PORT = int(os.getenv("WEAVIATE_PORT", "8080"))


def get_weaviate_client():
    """
    Returns a connected Weaviate client.
    """
    return weaviate.connect_to_local(host=WEAVIATE_HOST, port=WEAVIATE_PORT)


def get_embeddings():
    """
    Returns OllamaEmbeddings configured to use local Ollama instance.
    """
    return OllamaEmbeddings(base_url=OLLAMA_API_ENDPOINT, model=OLLAMA_MODEL)


def _ensure_collection_exists():
    """
    Ensures the Weaviate collection exists with Ollama vectorization.
    Creates it if it doesn't exist.
    """
    client = get_weaviate_client()
    try:
        # Try to get the collection
        client.collections.get(WEAVIATE_INDEX_NAME)
    except weaviate.exceptions.WeaviateException:
        # Collection doesn't exist, create it with Ollama vectorization
        client.collections.create(
            name=WEAVIATE_INDEX_NAME,
            vector_config=Configure.Vectors.text2vec_ollama(
                api_endpoint=OLLAMA_API_ENDPOINT, model=OLLAMA_MODEL
            ),
        )


def upsert_markdown_to_weaviate(upload_id: str, markdown_text: str):
    """
    Chunks the input Markdown text and upserts the chunks into Weaviate.
    Attaches the `upload_id` as metadata.
    """
    # Ensure the collection exists
    _ensure_collection_exists()

    splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.create_documents(
        texts=[markdown_text], metadatas=[{"upload_id": upload_id}]
    )

    client = get_weaviate_client()
    embeddings = get_embeddings()

    # Initialize WeaviateVectorStore and upsert documents
    vectorstore = WeaviateVectorStore.from_documents(
        chunks,
        embedding=embeddings,
        client=client,
        index_name=WEAVIATE_INDEX_NAME,
        text_key="text",
    )
    return vectorstore


def get_vector_store() -> WeaviateVectorStore:
    """
    Gets a connection to the existing vector store with Ollama embeddings.
    """
    # Ensure the collection exists
    _ensure_collection_exists()

    client = get_weaviate_client()
    embeddings = get_embeddings()
    return WeaviateVectorStore(
        client=client,
        index_name=WEAVIATE_INDEX_NAME,
        text_key="text",
        embedding=embeddings,
    )
