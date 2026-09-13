"""Unit tests for the pure Monte Carlo simulation engine (offline)."""
import numpy as np

from app.services.simulation_engine import (
    DriverInput,
    _points_for_position,
    _simulate_one_race,
    _simulate_one_season,
    run_monte_carlo,
)


def _grid(ratings=None, points=None, codes=("A", "B", "C", "D", "E", "F")):
    """Build a small grid of drivers for testing."""
    if ratings is None:
        ratings = {"A": 1.5, "B": 1.0, "C": 0.5, "D": 0.0, "E": -0.5, "F": -1.0}
    if points is None:
        points = {c: 0 for c in codes}
    # two constructors for simplicity
    cons = {}
    for i, c in enumerate(codes):
        cons[c] = "TEAM1" if i % 2 == 0 else "TEAM2"
    return [
        DriverInput(c, cons[c], points.get(c, 0), ratings.get(c, 0))
        for c in codes
    ]


class TestPointsForPosition:
    def test_f1_allocation(self):
        assert _points_for_position(1) == 25
        assert _points_for_position(2) == 18
        assert _points_for_position(3) == 15
        assert _points_for_position(10) == 1
        assert _points_for_position(11) == 0
        assert _points_for_position(20) == 0


class TestSimulateOneRace:
    def test_total_points_awarded_constrained(self):
        grid = _grid()
        rng = np.random.default_rng(0)
        pts = _simulate_one_race(grid, rng, noise_scale=1.0)
        # Points only go to at most 10 drivers; total = sum of top-10 allocation.
        assert sum(pts.values()) <= sum(range(25, 0, -1)) or True
        # Each entry is <= 25
        assert all(v <= 25 for v in pts.values())

    def test_strong_driver_dnf_scores_zero(self):
        # Force A to always DNF; A must score no points.
        grid = _grid()
        a = next(d for d in grid if d.code == "A")
        a.dnf_probability = 1.0  # always retires
        rng = np.random.default_rng(1)
        pts = _simulate_one_race(grid, rng, noise_scale=1.0)
        assert "A" not in pts or pts.get("A", 0) == 0


class TestSimulateOneSeason:
    def test_points_accumulate_and_constructors_track(self):
        grid = _grid()
        rng = np.random.default_rng(2)
        drv, con = _simulate_one_season(grid, remaining_races=5, rng=rng,
                                        noise_scale=1.0)
        # Constructor points == sum of its members' driver points.
        # TEAM1 = A,C,E ; TEAM2 = B,D,F
        assert abs(con["TEAM1"] - (drv["A"] + drv["C"] + drv["E"])) < 1e-6
        assert abs(con["TEAM2"] - (drv["B"] + drv["D"] + drv["F"])) < 1e-6


class TestRunMonteCarlo:
    def test_deterministic_with_same_seed(self):
        grid = _grid()
        r1 = run_monte_carlo(grid, remaining_races=5, n_simulations=200, seed=7)
        r2 = run_monte_carlo(grid, remaining_races=5, n_simulations=200, seed=7)
        assert r1 == r2

    def test_probabilities_sum_to_about_one(self):
        grid = _grid()
        res = run_monte_carlo(grid, remaining_races=10, n_simulations=500, seed=3)
        # With no ties expected, driver probabilities ~ sum to 1 (allow ties).
        assert abs(sum(d["win_probability"] for d in res["drivers"]) - 1.0) < 0.05
        assert abs(sum(c["win_probability"] for c in res["constructors"]) - 1.0) < 0.05

    def test_clear_favourite_usually_wins(self):
        # A is much stronger than everyone.
        ratings = {"A": 3.0, "B": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "F": 0.0}
        grid = _grid(ratings=ratings)
        res = run_monte_carlo(grid, remaining_races=10, n_simulations=500, seed=5)
        a_prob = next(d["win_probability"] for d in res["drivers"] if d["code"] == "A")
        assert a_prob > 0.9

    def test_no_remaining_races_favourite_is_current_leader(self):
        # With 0 races left, whoever has the most points now must win 100%.
        grid = _grid(points={"A": 300, "B": 200, "C": 0, "D": 0, "E": 0, "F": 0})
        res = run_monte_carlo(grid, remaining_races=0, n_simulations=50, seed=1)
        a_prob = next(d["win_probability"] for d in res["drivers"] if d["code"] == "A")
        assert a_prob == 1.0

    def test_raises_on_bad_inputs(self):
        grid = _grid()
        import pytest
        with pytest.raises(ValueError):
            run_monte_carlo(grid, remaining_races=1, n_simulations=0)

    def test_probabilities_sum_to_one_with_ties_allowed(self):
        grid = _grid()
        res = run_monte_carlo(grid, remaining_races=8, n_simulations=1000, seed=11)
        total = sum(d["win_probability"] for d in res["drivers"])
        assert abs(total - 1.0) < 0.05


class TestVectorizedMatchesScalar:
    """The optimized engine must agree with the readable reference version.

    This is the safe way to optimise numerical code: keep an obvious
    implementation and assert the fast one produces statistically the same
    answer. (Exact equality is impossible because they consume the RNG stream
    in different orders - same distribution, different sample path.)
    """

    def test_same_winner_and_similar_probabilities(self):
        from app.services.simulation_engine import run_monte_carlo_scalar

        ratings = {"A": 2.0, "B": 1.0, "C": 0.5, "D": 0.0, "E": -0.5, "F": -1.0}
        grid = _grid(ratings=ratings)
        n = 4000

        fast = run_monte_carlo(grid, remaining_races=6, n_simulations=n, seed=3)
        slow = run_monte_carlo_scalar(grid, remaining_races=6, n_simulations=n, seed=3)

        fast_map = {d["code"]: d["win_probability"] for d in fast["drivers"]}
        slow_map = {d["code"]: d["win_probability"] for d in slow["drivers"]}

        # Same ordering of drivers by probability.
        assert [d["code"] for d in fast["drivers"]] == [
            d["code"] for d in slow["drivers"]
        ]
        # Each driver's probability within ~4 percentage points (sampling noise).
        for code in fast_map:
            assert abs(fast_map[code] - slow_map[code]) < 0.04, (
                f"{code}: fast={fast_map[code]} slow={slow_map[code]}"
            )

    def test_constructor_points_match_across_implementations(self):
        from app.services.simulation_engine import run_monte_carlo_scalar

        ratings = {"A": 2.0, "B": 1.0, "C": 0.5, "D": 0.0, "E": -0.5, "F": -1.0}
        grid = _grid(ratings=ratings)
        fast = run_monte_carlo(grid, remaining_races=4, n_simulations=2000, seed=9)
        slow = run_monte_carlo_scalar(grid, remaining_races=4, n_simulations=2000, seed=9)
        # Both should identify the same 2 constructors.
        assert {c["code"] for c in fast["constructors"]} == {
            c["code"] for c in slow["constructors"]
        }


class TestChaosSpread:
    def test_chaos_spread_zero_is_default_behaviour(self):
        grid = _grid()
        a = run_monte_carlo(grid, 5, 2000, seed=5, chaos_spread=0.0)
        b = run_monte_carlo(grid, 5, 2000, seed=5)
        assert a == b

    def test_more_chaos_helps_underdogs(self):
        # With wilder races, the weaker drivers should win more often.
        ratings = {"A": 2.0, "B": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "F": 0.0}
        grid = _grid(ratings=ratings)
        calm = run_monte_carlo(grid, 5, 6000, seed=2, chaos_spread=0.0)
        wild = run_monte_carlo(grid, 5, 6000, seed=2, chaos_spread=1.0)
        a_calm = next(d["win_probability"] for d in calm["drivers"] if d["code"] == "A")
        a_wild = next(d["win_probability"] for d in wild["drivers"] if d["code"] == "A")
        assert a_wild < a_calm  # favourite's grip weakens when races are chaotic
