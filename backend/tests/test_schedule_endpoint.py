"""Tests for the /api/v1/schedule endpoint."""
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_get_schedule_2026():
    response = client.get("/api/v1/schedule?season=2026")
    assert response.status_code == 200
    data = response.json()

    assert data["season"] == 2026
    assert data["total_rounds"] >= 20
    assert len(data["events"]) == data["total_rounds"]

    # Check first event
    first_event = data["events"][0]
    assert first_event["round"] == 1
    assert "event_name" in first_event
    assert "country" in first_event
    assert "location" in first_event
    assert "race_date" in first_event
    assert first_event["status"] in ("completed", "current", "upcoming")


def test_get_schedule_default_current_season():
    response = client.get("/api/v1/schedule")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rounds"] >= 20
