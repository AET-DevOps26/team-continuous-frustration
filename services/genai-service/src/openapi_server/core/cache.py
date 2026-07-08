import logging
import os
from typing import Optional

import redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
EXPLANATION_CACHE_TTL_SECONDS = int(
    os.getenv("EXPLANATION_CACHE_TTL_SECONDS", str(60 * 60 * 24))
)

_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    """
    Returns a lazily-initialized, process-wide Redis client.
    """
    global _client
    if _client is None:
        logger.debug("[cache] Connecting to Redis at %s", REDIS_URL)
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client


def _explanation_cache_key(flashcard_id: str, last_updated: str) -> str:
    return f"explanation:{flashcard_id}:{last_updated}"


def get_cached_explanation(flashcard_id: str, last_updated: str) -> Optional[str]:
    """
    Looks up a previously generated explanation for the given flashcard
    id/last_updated pair. Returns None on a cache miss or if Redis is
    unavailable — the caller should fall back to regenerating.
    """
    key = _explanation_cache_key(flashcard_id, last_updated)
    try:
        cached = get_redis_client().get(key)
        if cached is not None:
            logger.info("[cache] Hit for key=%s", key)
        else:
            logger.debug("[cache] Miss for key=%s", key)
        return cached
    except Exception as e:
        logger.warning("[cache] Failed to read explanation cache: %s", e)
        return None


def set_cached_explanation(
    flashcard_id: str, last_updated: str, explanation: str
) -> None:
    """
    Stores a generated explanation, keyed by flashcard id/last_updated, so a
    flashcard edit (which changes last_updated) naturally invalidates it.
    Cache write failures are logged and swallowed — caching is best-effort.
    """
    key = _explanation_cache_key(flashcard_id, last_updated)
    try:
        get_redis_client().set(key, explanation, ex=EXPLANATION_CACHE_TTL_SECONDS)
        logger.debug("[cache] Stored key=%s (ttl=%ds)", key, EXPLANATION_CACHE_TTL_SECONDS)
    except Exception as e:
        logger.warning("[cache] Failed to write explanation cache: %s", e)
