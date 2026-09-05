import pandas as pd
import pytest

from app.services.telemetry_service import (
    _frame_to_points,
    _map_and_decimate,
    _points_to_track,
)


def _make_fake_telemetry(n=100):
    """Build a synthetic fastf1-style telemetry DataFrame.

    NOTE: 'Time' is a real datetime in fastf1, but the reshaping functions
    ignore it, so we use a plain numeric column here (keeps tests simple).
    """
    return pd.DataFrame(
        {
            "Time": [float(i) for i in range(n)],
            "Distance": [float(i * 5) for i in range(n)],
            "X": [float(i) for i in range(n)],
            "Y": [float(2 * i) for i in range(n)],
            "Speed": [float(100 + i) for i in range(n)],
            "Throttle": [float(100) for i in range(n)],
            "Brake": [False] * n,
            "nGear": [4] * n,
            "DRS": [0] * n,
        }
    )


class TestMapAndDecimate:
    def test_renames_to_friendly_columns(self):
        df = _make_fake_telemetry(n=10)
        out = _map_and_decimate(df, max_points=10)
        expected = {"distance", "x", "y", "speed_kmh", "throttle_pct",
                    "brake", "gear", "drs"}
        assert set(out.columns) == expected

    def test_brake_is_bool_gear_and_drs_int(self):
        df = _make_fake_telemetry(n=10)
        out = _map_and_decimate(df, max_points=10)
        assert out["brake"].dtype == bool
        assert out["gear"].dtype == int
        assert out["drs"].dtype == int

    def test_decimates_when_exceeding_max(self):
        df = _make_fake_telemetry(n=1000)
        out = _map_and_decimate(df, max_points=100)
        assert len(out) == 100

    def test_no_decimation_when_under_max(self):
        df = _make_fake_telemetry(n=50)
        out = _map_and_decimate(df, max_points=100)
        assert len(out) == 50

    def test_raises_on_missing_columns(self):
        df = pd.DataFrame({"Distance": [0], "X": [0]})  # missing many columns
        with pytest.raises(ValueError):
            _map_and_decimate(df, max_points=10)

    def test_drops_rows_with_missing_position(self):
        df = _make_fake_telemetry(n=10)
        df.loc[3, "X"] = None  # drop one row
        out = _map_and_decimate(df, max_points=100)
        assert len(out) == 9


class TestFrameToPointsAndTrack:
    def test_frame_to_points_records(self):
        df = _make_fake_telemetry(n=3)
        pts = _frame_to_points(_map_and_decimate(df, max_points=3))
        assert len(pts) == 3
        assert set(pts[0].keys()) == {"distance", "x", "y", "speed_kmh",
                                      "throttle_pct", "brake", "gear", "drs"}

    def test_points_to_track_only_position_and_distance(self):
        pts = [
            {"distance": 0.0, "x": 1.0, "y": 2.0, "speed_kmh": 300.0},
            {"distance": 5.0, "x": 2.0, "y": 4.0, "speed_kmh": 310.0},
        ]
        track = _points_to_track(pts)
        assert track == [
            {"distance": 0.0, "x": 1.0, "y": 2.0},
            {"distance": 5.0, "x": 2.0, "y": 4.0},
        ]
