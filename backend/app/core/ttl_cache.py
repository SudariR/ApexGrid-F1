import threading
import time


class TTLCache:
    def __init__(self, ttl_seconds: float = 300, maxsize: int = 128):
        self.ttl = ttl_seconds
        self.maxsize = maxsize
        self._store: dict = {}   # key -> {"value":..., "expires": float}
        self._lock = threading.Lock()

    def _is_expired(self, entry) -> bool:
        return entry["expires"] < time.monotonic()

    def get(self, key):
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if self._is_expired(entry):
                del self._store[key]
                return None
            return entry["value"]

    def set(self, key, value) -> None:
        with self._lock:
            if len(self._store) >= self.maxsize:
                # Drop expired entries; if that's not enough, clear all.
                self._store = {k: v for k, v in self._store.items()
                               if not self._is_expired(v)}
                if len(self._store) >= self.maxsize:
                    self._store.clear()
            self._store[key] = {
                "value": value,
                "expires": time.monotonic() + self.ttl,
            }

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

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
