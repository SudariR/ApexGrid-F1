"""HTTP integration tests.


"""
import pytest
from fastapi.testclient import TestClient

from main import app
from app.services import race_service, standings_service, telemetry_service


@pytest.fixture
def client():
    return TestClient(app)


# --- Deterministic fake service outputs --------------------------------


def _fake_hero_payload(season=None, gp_round=None):
    driver = {
        "position": 1, "driver_code": "NOR", "full_name": "Lando Norris",
        "team_name": "McLaren", "driver_number": 1, "grid_position": 1,
        "status": "Finished", "points": 25.0, "finish_gap": "2:04:44.859",
    }
    return {
        "season": 2026, "round": 12, "event_name": "Dutch Grand Prix",
        "country": "Netherlands", "location": "Zandvoort",
        "race_date": "2026-08-23", "total_laps": 72,
        "winner": driver, "podium": [driver],
    }


def _fake_standings_payload(season=None):
    return {
        "season": 2026, "round": 12,
        "drivers": [{
            "position": 1, "driver_code": "ANT", "full_name": "Andrea Kimi Antonelli",
            "nationality": "Italian", "team_name": "Mercedes",
            "points": 242.0, "wins": 6,
        }],
        "constructors": [{
            "position": 1, "name": "Mercedes", "nationality": "German",
            "points": 425.0, "wins": 8,
        }],
    }


# --- health -------------------------------------------------------------


class TestHealth:
    def test_health_returns_200_and_shape(self, client):
        r = client.get("/api/v1/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert "version" in body
        assert "service" in body


# --- hero ---------------------------------------------------------------


class TestHeroEndpoint:
    def test_latest_returns_valid_payload(self, client, monkeypatch):
        monkeypatch.setattr(race_service, "get_hero_payload", _fake_hero_payload)
        r = client.get("/api/v1/hero/latest")
        assert r.status_code == 200
        body = r.json()
        assert body["event_name"] == "Dutch Grand Prix"
        assert body["winner"]["driver_code"] == "NOR"
        # podium[0] is the winner (our documented convention)
        assert body["podium"][0] == body["winner"]

    def test_service_error_becomes_503(self, client, monkeypatch):
        from app.services.errors import UpstreamDataUnavailableError

        def boom(season=None, gp_round=None):
            raise UpstreamDataUnavailableError("upstream down")

        monkeypatch.setattr(race_service, "get_hero_payload", boom)
        r = client.get("/api/v1/hero/latest")
        assert r.status_code == 503


# --- standings ----------------------------------------------------------


class TestStandingsEndpoint:
    def test_returns_valid_payload(self, client, monkeypatch):
        monkeypatch.setattr(
            standings_service, "get_standings_payload", _fake_standings_payload
        )
        r = client.get("/api/v1/standings")
        assert r.status_code == 200
        body = r.json()
        assert body["season"] == 2026
        assert len(body["drivers"]) == 1
        assert body["drivers"][0]["driver_code"] == "ANT"
        assert body["constructors"][0]["name"] == "Mercedes"

    def test_service_error_becomes_503(self, client, monkeypatch):
        def boom(season=None):
            raise RuntimeError("unexpected")

        monkeypatch.setattr(standings_service, "get_standings_payload", boom)
        r = client.get("/api/v1/standings")
        assert r.status_code == 503

class TestTelemetryEndpoint:
    def test_unavailable_laps_returns_503(self, client, monkeypatch):
        from app.services.errors import UpstreamDataUnavailableError

        def boom(**kwargs):
            raise UpstreamDataUnavailableError(
                "Lap/telemetry data unavailable for GP round 12 in 2026."
            )

        monkeypatch.setattr(telemetry_service, "get_compare_payload", boom)
        r = client.get(
            "/api/v1/telemetry/compare?driver_a=NOR&driver_b=RUS"
            "&season=2026&round=12&session=Q"
        )
        assert r.status_code == 503

    def test_invalid_session_returns_422(self, client):
        r = client.get(
            "/api/v1/telemetry/compare?driver_a=NOR&driver_b=RUS&session=XX"
        )
        assert r.status_code == 422

    def test_missing_driver_params_returns_422(self, client):
        # driver_a and driver_b are required query params
        r = client.get("/api/v1/telemetry/compare")
        assert r.status_code == 422

    def test_success_returns_valid_schema(self, client, monkeypatch):
        # Provide a fake payload matching the schema so we test full serialisation
        # without the live telemetry provider.
        point = {
            "distance": 0.0, "x": 0.0, "y": 0.0, "speed_kmh": 300.0,
            "throttle_pct": 100.0, "brake": False, "gear": 4, "drs": 0,
        }

        def fake_payload(**kwargs):
            return {
                "season": 2026, "round": 12, "event_name": "Dutch Grand Prix",
                "session_type": "Q",
                "track": [{"distance": 0.0, "x": 0.0, "y": 0.0}],
                "drivers": [
                    {"driver_code": "NOR", "lap_number": 1, "lap_time_ms": 60000,
                     "points": [point]},
                    {"driver_code": "RUS", "lap_number": 2, "lap_time_ms": 61000,
                     "points": [point]},
                ],
            }

        monkeypatch.setattr(telemetry_service, "get_compare_payload", fake_payload)
        r = client.get(
            "/api/v1/telemetry/compare?driver_a=NOR&driver_b=RUS&session=Q"
        )
        assert r.status_code == 200
        body = r.json()
        assert body["event_name"] == "Dutch Grand Prix"
        assert len(body["drivers"]) == 2
        assert body["drivers"][0]["driver_code"] == "NOR"


# --- versioning / routing --------------------------------------------------


class TestRouting:
    def test_unknown_v1_route_returns_404(self, client):
        r = client.get("/api/v1/nonexistent")
        assert r.status_code == 404

    def test_version_prefix_is_api_v1(self, client):
        # The API contract lives under /api/v1
        paths = client.get("/openapi.json").json()["paths"]
        assert all(p.startswith("/api/v1") for p in paths)
