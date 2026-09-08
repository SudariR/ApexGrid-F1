from fastapi import Response

from app.core.config import get_settings
from app.core.ttl_cache import response_cache


def cache_response(key_tuple: tuple, compute, force_refresh: bool = False):
    """Return a cached value for `key_tuple` or compute + store it.

    If force_refresh is True, recompute and overwrite the cache.
    Returns (value, cache_status) where cache_status is 'HIT' or 'MISS'.
    """
    key = str(key_tuple)
    if not force_refresh:
        hit = response_cache.get(key)
        if hit is not None:
            return hit, "HIT"
    value = compute()
    response_cache.set(key, value)
    return value, "MISS"


def set_cache_headers(response: Response, cache_status: str) -> None:
    """Attach cache metadata headers to a FastAPI Response."""
    ttl = get_settings().response_cache_ttl_seconds
    response.headers["X-Cache"] = cache_status
    response.headers["Cache-Control"] = f"public, max-age={ttl}"
