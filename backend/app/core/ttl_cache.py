import threading
import time
from collections import OrderedDict


class TTLCache:
    """Thread-safe cache with per-entry TTL and LRU eviction."""

    def __init__(self, ttl_seconds: int = 300, maxsize: int = 128):
        self.ttl = ttl_seconds
        self.maxsize = maxsize
        # OrderedDict lets us move a key to the end on use (most-recent) and
        # evict from the front (least-recent).
        self._store: "OrderedDict[str, dict]" = OrderedDict()
        self._lock = threading.Lock()
        # Small stats counters - handy for observability / debugging.
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def _is_expired(self, entry) -> bool:
        return entry["expires"] < time.monotonic()

    def get(self, key):
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self.misses += 1
                return None
            if self._is_expired(entry):
                del self._store[key]
                self.misses += 1
                return None
            # Mark as most-recently-used.
            self._store.move_to_end(key)
            self.hits += 1
            return entry["value"]

    def set(self, key, value) -> None:
        with self._lock:
            self._store[key] = {
                "value": value,
                "expires": time.monotonic() + self.ttl,
            }
            self._store.move_to_end(key)
            # Evict LEAST-recently-used entries one at a time until we fit.
            while len(self._store) > self.maxsize:
                self._store.popitem(last=False)  # pop oldest (front)
                self.evictions += 1

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def stats(self) -> dict:
        with self._lock:
            total = self.hits + self.misses
            return {
                "size": len(self._store),
                "maxsize": self.maxsize,
                "hits": self.hits,
                "misses": self.misses,
                "evictions": self.evictions,
                "hit_rate": round(self.hits / total, 4) if total else 0.0,
            }

    def __len__(self):
        with self._lock:
            return len(self._store)


# A single shared cache instance used across the app.
from app.core.config import get_settings  # noqa: E402

_settings = get_settings()
response_cache = TTLCache(
    ttl_seconds=_settings.response_cache_ttl_seconds,
    maxsize=_settings.response_cache_maxsize,
)
