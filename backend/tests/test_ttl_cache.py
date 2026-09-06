"""Unit tests for the generic TTL cache."""
import time

from app.core.ttl_cache import TTLCache


class TestTTLCache:
    def test_get_miss_then_set_hit(self):
        c = TTLCache(ttl_seconds=60)
        assert c.get("k") is None
        c.set("k", 123)
        assert c.get("k") == 123

    def test_expiry(self):
        c = TTLCache(ttl_seconds=0.1)
        c.set("k", "v")
        assert c.get("k") == "v"
        time.sleep(0.2)
        assert c.get("k") is None

    def test_overwrite(self):
        c = TTLCache(ttl_seconds=60)
        c.set("k", 1)
        c.set("k", 2)
        assert c.get("k") == 2

    def test_clear(self):
        c = TTLCache(ttl_seconds=60)
        c.set("a", 1)
        c.set("b", 2)
        c.clear()
        assert c.get("a") is None
        assert c.get("b") is None

    def test_maxsize_eviction(self):
        c = TTLCache(ttl_seconds=60, maxsize=2)
        c.set("a", 1)
        c.set("b", 2)
        c.set("c", 3)  # should trigger eviction
        # after overflow we clear the whole store
        assert c.get("a") is None
        assert c.get("c") == 3
