from __future__ import annotations

import numpy as np

# Real F1 points for positions 1..10 (nothing for P11+).
_POINTS_BY_POSITION = (25, 18, 15, 12, 10, 8, 6, 4, 2, 1)


class DriverInput:
    """A driver for the simulation.

    Attributes
    ----------
    code : str
        3-letter driver code, e.g. 'NOR'.
    constructor_code : str
        Constructor this driver drives for, e.g. 'MER'.
    points : float
        Driver's CURRENT championship points (already earned).
    rating : float
        Pace/ability rating. Higher = faster/better. Relative scale only.
    dnf_probability : float
        Per-race probability of not finishing (0..1).
    """

    __slots__ = ("code", "constructor_code", "points", "rating", "dnf_probability")

    def __init__(self, code, constructor_code, points, rating, dnf_probability=0.08):
        self.code = code
        self.constructor_code = constructor_code
        self.points = float(points)
        self.rating = float(rating)
        self.dnf_probability = float(dnf_probability)


def _points_for_position(position: int) -> float:
    """Return points awarded for a 1-indexed finishing position."""
    if 1 <= position <= 10:
        return float(_POINTS_BY_POSITION[position - 1])
    return 0.0


def _simulate_one_race(
    drivers: list[DriverInput], rng: np.random.Generator, noise_scale: float
) -> dict[str, float]:
    """Simulate one race, returning {driver_code: points_scored_this_race}.

    Model (intentionally simple):
        * Each driver either survives or DNFs (rolled against dnf_probability).
        * Survivors draw a latent score = rating + normal(0, noise_scale).
        * Higher score -> finishes ahead.
        * Only the top 10 survivors earn points (real F1 allocation).
    """
    survivors = []
    for d in drivers:
        if rng.random() >= d.dnf_probability:
            # Latent performance: rating + random noise.
            score = d.rating + rng.normal(0.0, noise_scale)
            survivors.append((d.code, score))

    # Sort by score descending -> finishing order.
    survivors.sort(key=lambda pair: pair[1], reverse=True)

    points: dict[str, float] = {}
    for position, (code, _) in enumerate(survivors, start=1):
        pts = _points_for_position(position)
        if pts:
            points[code] = pts
    # Codes absent from `points` simply scored 0 (finished P11+, or DNF).
    return points


def _simulate_one_season(
    drivers: list[DriverInput],
    remaining_races: int,
    rng: np.random.Generator,
    noise_scale: float,
) -> tuple[dict[str, float], dict[str, float]]:
    """Simulate all remaining races; return final (driver_pts, constructor_pts)."""
    driver_pts = {d.code: d.points for d in drivers}
    driver_to_con = {d.code: d.constructor_code for d in drivers}
    constructor_pts: dict[str, float] = {}
    for d in drivers:
        constructor_pts[d.constructor_code] = (
            constructor_pts.get(d.constructor_code, 0.0) + d.points
        )

    for _ in range(remaining_races):
        race = _simulate_one_race(drivers, rng, noise_scale)
        for code, pts in race.items():
            driver_pts[code] += pts
            constructor_pts[driver_to_con[code]] += pts
    return driver_pts, constructor_pts


def run_monte_carlo(
    drivers: list[DriverInput],
    remaining_races: int,
    n_simulations: int,
    seed: int | None = 42,
    noise_scale: float = 1.0,
) -> dict:
    """Run the Monte Carlo championship simulation.

    Returns a dict:
        {
          "drivers": [{"code": ..., "win_probability": ...}, ...],   # sorted desc
          "constructors": [{"code": ..., "win_probability": ...}, ...],
        }

    win_probability is the fraction of simulated seasons in which that
    driver/constructor finished with the MOST points. Ties are credited to
    every tied leader.
    """
    if n_simulations < 1:
        raise ValueError("n_simulations must be >= 1")
    if remaining_races < 0:
        raise ValueError("remaining_races must be >= 0")

    rng = np.random.default_rng(seed)

    driver_wins = {d.code: 0 for d in drivers}
    constructor_wins = {d.constructor_code: 0 for d in drivers}

    for _ in range(n_simulations):
        drv_pts, con_pts = _simulate_one_season(
            drivers, remaining_races, rng, noise_scale
        )
        # Drivers championship leader(s)
        max_d = max(drv_pts.values())
        for code, pts in drv_pts.items():
            if pts == max_d:
                driver_wins[code] += 1
        # Constructors championship leader(s)
        max_c = max(con_pts.values())
        for code, pts in con_pts.items():
            if pts == max_c:
                constructor_wins[code] += 1

    def to_list(counter: dict) -> list:
        return [
            {"code": code, "win_probability": round(count / n_simulations, 4)}
            for code, count in sorted(counter.items(), key=lambda kv: -kv[1])
        ]

    return {
        "drivers": to_list(driver_wins),
        "constructors": to_list(constructor_wins),
    }
