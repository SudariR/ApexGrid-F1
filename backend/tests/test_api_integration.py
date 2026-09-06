"""HTTP integration tests.

"""
import pytest
from fastapi.testclient import TestClient

from main import app
from app.services import (
    analytics_service,
    race_service,
    standings_service,
    telemetry_service,
    predictor_service,
    headtohead_service,
)


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


# --- telemetry -------------------------------------------------------------


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
            "/api/v1/telemetry/compare?driver_a=NOR&driver_b=RUS&round=12&session=Q"
        )
        assert r.status_code == 200
        body = r.json()
        assert body["event_name"] == "Dutch Grand Prix"
        assert len(body["drivers"]) == 2
        assert body["drivers"][0]["driver_code"] == "NOR"


# --- analytics -------------------------------------------------------------


class TestAnalyticsEndpoints:
    def test_pace_returns_valid_schema(self, client, monkeypatch):
        def fake_pace(season, gp_round, session_type, driver_code):
            return {
                "season": season, "round": gp_round, "event_name": "Dutch Grand Prix",
                "driver_code": driver_code, "session_type": session_type,
                "stats": {"count": 10, "mean_s": 90.5, "median_s": 90.4,
                          "std_s": 0.5, "cv_pct": 0.55, "q1_s": 90.1,
                          "q3_s": 91.0, "min_s": 90.0, "max_s": 92.0},
                "kde": [{"lap_time_s": 90.0, "density": 0.1}],
            }
        monkeypatch.setattr(analytics_service, "get_pace_payload", fake_pace)
        r = client.get("/api/v1/analytics/pace?driver=NOR&season=2026&round=12")
        assert r.status_code == 200
        body = r.json()
        assert body["driver_code"] == "NOR"
        assert body["stats"]["cv_pct"] == 0.55

    def test_tire_returns_valid_schema(self, client, monkeypatch):
        def fake_tire(season, gp_round, session_type, driver_code):
            return {
                "season": season, "round": gp_round, "event_name": "Dutch Grand Prix",
                "driver_code": driver_code, "session_type": session_type,
                "stints": [{"compound": "SOFT", "stint": 1, "n_laps": 20,
                            "slope_s_per_lap": 0.08, "intercept_s": 90.0,
                            "r2": 0.95}],
            }
        monkeypatch.setattr(analytics_service, "get_tire_payload", fake_tire)
        r = client.get(
            "/api/v1/analytics/tire-degradation?driver=NOR&season=2026&round=12"
        )
        assert r.status_code == 200
        body = r.json()
        assert body["stints"][0]["compound"] == "SOFT"

    def test_bad_session_returns_422(self, client):
        r = client.get("/api/v1/analytics/pace?driver=NOR&session=ZZ")
        assert r.status_code == 422

    def test_pace_missing_round_returns_422(self, client):
        r = client.get("/api/v1/analytics/pace?driver=NOR")
        assert r.status_code == 422

    def test_tire_missing_round_returns_422(self, client):
        r = client.get("/api/v1/analytics/tire-degradation?driver=NOR")
        assert r.status_code == 422

    def test_upstream_error_returns_503(self, client, monkeypatch):
        from app.services.errors import UpstreamDataUnavailableError

        def boom(season, gp_round, session_type, driver_code):
            raise UpstreamDataUnavailableError("lap data unavailable")

        monkeypatch.setattr(analytics_service, "get_pace_payload", boom)
        r = client.get("/api/v1/analytics/pace?driver=NOR&round=12")
        assert r.status_code == 503

    
# --- telemetry round required ----------------------------------------------


class TestTelemetryRoundRequired:
    def test_round_is_required(self, client):
        r = client.get(
            "/api/v1/telemetry/compare?driver_a=NOR&driver_b=RUS&session=Q"
        )
        assert r.status_code == 422


# --- predictor -------------------------------------------------------------


class TestPredictorEndpoint:
    def test_simulate_returns_valid_schema(self, client, monkeypatch):
        def fake_predict(**kwargs):
            return {
                "season": 2026, "as_of_round": 13, "remaining_races": 10,
                "n_simulations": 1000,
                "drivers": [{"code": "ANT", "name": "Andrea Kimi Antonelli",
                             "win_probability": 0.98}],
                "constructors": [{"code": "MER", "name": "Mercedes",
                                  "win_probability": 0.99}],
            }
        monkeypatch.setattr(predictor_service, "get_predict_payload", fake_predict)
        r = client.post("/api/v1/predictor/simulate", json={})
        assert r.status_code == 200
        body = r.json()
        assert body["remaining_races"] == 10
        assert body["drivers"][0]["win_probability"] == 0.98

    def test_overrides_accepted(self, client, monkeypatch):
        captured = {}

        def fake_predict(**kwargs):
            captured.update(kwargs)
            return {
                "season": 2026, "as_of_round": 13, "remaining_races": 10,
                "n_simulations": 100,
                "drivers": [], "constructors": [],
            }
        monkeypatch.setattr(predictor_service, "get_predict_payload", fake_predict)
        payload = {"season": 2026, "n_simulations": 500,
                   "overrides": [{"code": "ANT", "dnf_probability": 0.3}]}
        r = client.post("/api/v1/predictor/simulate", json=payload)
        assert r.status_code == 200
        # Verify the override reached the service as Pydantic objects.
        ov = captured["overrides"]
        assert len(ov) == 1
        assert ov[0].code == "ANT"
        assert abs(ov[0].dnf_probability - 0.3) < 1e-9

    def test_bad_n_simulations_rejected(self, client):
        r = client.post("/api/v1/predictor/simulate", json={"n_simulations": 5})
        assert r.status_code == 422  # below our min of 100

# --- head-to-head ----------------------------------------------------------


class TestHeadToHeadEndpoint:
    def test_returns_valid_schema(self, client, monkeypatch):
        def fake_payload(season=None):
            return {
                "season": 2026, "as_of_round": 13,
                "duels": [{
                    "constructor_name": "Red Bull",
                    "driver_a": {"code": "VER", "name": "Max Verstappen"},
                    "driver_b": {"code": "HAD", "name": "Isack Hadjar"},
                    "wins_a": 8, "wins_b": 2, "races": 10,
                    "elo_a": 1054.0, "elo_b": 960.0,
                }],
            }
        monkeypatch.setattr(headtohead_service, "get_headtohead_payload", fake_payload)
        r = client.get("/api/v1/headtohead/teammates?season=2026")
        assert r.status_code == 200
        body = r.json()
        assert body["duels"][0]["driver_a"]["code"] == "VER"
        assert body["duels"][0]["elo_a"] == 1054.0

    def test_upstream_error_returns_503(self, client, monkeypatch):
        from app.services.errors import UpstreamDataUnavailableError

        def boom(season=None):
            raise UpstreamDataUnavailableError("data unavailable")

        monkeypatch.setattr(headtohead_service, "get_headtohead_payload", boom)
        r = client.get("/api/v1/headtohead/teammates")
        assert r.status_code == 503




# --- versioning / routing --------------------------------------------------


class TestRouting:
    def test_unknown_v1_route_returns_404(self, client):
        r = client.get("/api/v1/nonexistent")
        assert r.status_code == 404

    def test_version_prefix_is_api_v1(self, client):
        # The API contract lives under /api/v1
        paths = client.get("/openapi.json").json()["paths"]
        assert all(p.startswith("/api/v1") for p in paths)
