"""Unit tests for the generic TTL + LRU cache."""
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


class TestLRUEviction:
    def test_evicts_least_recently_used(self):
        c = TTLCache(ttl_seconds=60, maxsize=2)
        c.set("a", 1)
        c.set("b", 2)
        c.set("c", 3)  # overflow -> evict LRU ("a")
        assert c.get("a") is None      # evicted
        assert c.get("b") == 2
        assert c.get("c") == 3

    def test_recently_used_survives_eviction(self):
        c = TTLCache(ttl_seconds=60, maxsize=2)
        c.set("a", 1)
        c.set("b", 2)
        # Touch "a" so it becomes most-recently-used.
        assert c.get("a") == 1
        c.set("c", 3)  # should evict "b" (now the LRU), not "a"
        assert c.get("a") == 1
        assert c.get("b") is None
        assert c.get("c") == 3

    def test_maxsize_respected(self):
        c = TTLCache(ttl_seconds=60, maxsize=3)
        for i in range(10):
            c.set(f"k{i}", i)
        assert len(c) == 3
        # The last three written should be present.
        assert c.get("k9") == 9
        assert c.get("k8") == 8
        assert c.get("k7") == 7


class TestStats:
    def test_hit_miss_counters(self):
        c = TTLCache(ttl_seconds=60)
        c.get("x")          # miss
        c.set("x", 1)
        c.get("x")          # hit
        s = c.stats()
        assert s["hits"] == 1
        assert s["misses"] == 1
        assert s["hit_rate"] == 0.5

    def test_eviction_counter(self):
        c = TTLCache(ttl_seconds=60, maxsize=1)
        c.set("a", 1)
        c.set("b", 2)
        assert c.stats()["evictions"] == 1
