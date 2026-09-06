"""Shared pytest fixtures/config.

The response cache is process-global, so an endpoint cached in one test would
be served from cache in a later test (breaking tests that mock the service
and expect a fresh call). We clear it before and after every test.
"""
import pytest

from app.core.ttl_cache import response_cache


@pytest.fixture(autouse=True)
def _clear_cache():
    response_cache.clear()
    yield
    response_cache.clear()
