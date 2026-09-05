"""Unit tests for the pure analytics computations (offline, deterministic)."""
import numpy as np

from app.services.analytics_service import (
    kde_curve,
    pace_stats,
    tire_degradation,
)


def _lap(lap_time_s, tyre_life=0, compound="SOFT", stint=1):
    return {
        "lap_time_s": lap_time_s,
        "tyre_life": tyre_life,
        "compound": compound,
        "stint": stint,
    }


class TestPaceStats:
    def test_basic_stats(self):
        laps = [_lap(90.0), _lap(91.0), _lap(92.0)]
        s = pace_stats(laps)
        assert s["count"] == 3
        assert s["min_s"] == 90.0
        assert s["max_s"] == 92.0
        assert s["median_s"] == 91.0
        assert abs(s["mean_s"] - 91.0) < 1e-6

    def test_cv_zero_for_identical_laps(self):
        laps = [_lap(95.0)] * 5
        s = pace_stats(laps)
        assert s["cv_pct"] == 0.0

    def test_raises_on_empty(self):
        import pytest
        with pytest.raises(ValueError):
            pace_stats([])

    def test_ignores_non_finite(self):
        laps = [_lap(90.0), _lap(float("nan")), _lap(92.0)]
        s = pace_stats(laps)
        assert s["count"] == 2


class TestKdeCurve:
    def test_returns_points_for_sufficient_data(self):
        rng = np.random.default_rng(0)
        laps = [_lap(float(t)) for t in rng.normal(90, 0.5, 30)]
        curve = kde_curve(laps, n_points=40)
        assert len(curve) == 40
        # each point has lap_time_s and density, sorted ascending by time
        times = [p["lap_time_s"] for p in curve]
        assert times == sorted(times)

    def test_returns_empty_for_too_few(self):
        laps = [_lap(90.0), _lap(91.0)]
        assert kde_curve(laps) == []


class TestTireDegradation:
    def test_positive_slope_when_tyres_degrade(self):
        # simulate a clean linear degradation: lap time grows ~0.1s per lap
        laps = [
            _lap(90.0 + 0.1 * age, tyre_life=age)
            for age in range(0, 10)
        ]
        stints = tire_degradation(laps)
        assert len(stints) == 1
        stint = stints[0]
        assert stint["compound"] == "SOFT"
        assert stint["stint"] == 1
        assert stint["n_laps"] == 10
        assert 0.05 < stint["slope_s_per_lap"] < 0.15
        assert stint["r2"] > 0.99  # near-perfect linear fit

    def test_grouped_by_compound(self):
        laps = [_lap(90.0 + 0.1 * a, tyre_life=a, compound="SOFT") for a in range(6)]
        laps += [_lap(92.0 + 0.2 * a, tyre_life=a, compound="HARD") for a in range(6)]
        stints = tire_degradation(laps)
        compounds = sorted(s["compound"] for s in stints)
        assert compounds == ["HARD", "SOFT"]

    def test_skips_stints_with_fewer_than_3_laps(self):
        laps = [_lap(90.0, tyre_life=0), _lap(90.5, tyre_life=1)]  # only 2
        assert tire_degradation(laps) == []
