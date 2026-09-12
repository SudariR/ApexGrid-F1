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


# ---------------------------------------------------------------------------
# SCALAR REFERENCE IMPLEMENTATION (readable; kept for clarity + cross-checking)
# ---------------------------------------------------------------------------


def _simulate_one_race(
    drivers: list[DriverInput], rng: np.random.Generator, noise_scale: float
) -> dict[str, float]:
    """Simulate one race, returning {driver_code: points_scored_this_race}.
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


# ---------------------------------------------------------------------------
# VECTORIZED (FAST) IMPLEMENTATION - the hot path
# ---------------------------------------------------------------------------

# Process this many simulations per batch. Bounds peak memory regardless of
# how large n_simulations is.
_DEFAULT_CHUNK = 2000


def _build_constructor_matrix(drivers: list[DriverInput]):
    """Return (onehot, constructor_codes).

    `onehot` is a (n_drivers x n_constructors) 0/1 matrix where entry [i, j] is
    1 if driver i belongs to constructor j. Multiplying driver points by this
    matrix (via `@`) sums drivers into their constructors - a fast, branch-free
    way to compute constructor totals.
    """
    codes = sorted({d.constructor_code for d in drivers})
    index = {c: j for j, c in enumerate(codes)}
    onehot = np.zeros((len(drivers), len(codes)), dtype=float)
    for i, d in enumerate(drivers):
        onehot[i, index[d.constructor_code]] = 1.0
    return onehot, codes


def _simulate_seasons_vectorized(
    drivers: list[DriverInput],
    remaining_races: int,
    n_simulations: int,
    rng: np.random.Generator,
    noise_scale: float,
    chaos_spread: float,
    chunk_size: int,
) -> tuple[np.ndarray, np.ndarray]:
    """Simulate `n_simulations` full seasons in NumPy batches.

    Returns
    -------
    driver_points : np.ndarray, shape (n_simulations, n_drivers)
    constructor_points : np.ndarray, shape (n_simulations, n_constructors)

    MEMORY: only one (chunk x races x drivers) array block exists at a time.
    """
    n_drivers = len(drivers)
    n_races = max(remaining_races, 0)

    ratings = np.array([d.rating for d in drivers], dtype=float)
    dnf_probs = np.array([d.dnf_probability for d in drivers], dtype=float)
    initial = np.array([d.points for d in drivers], dtype=float)

    # Points lookup indexed by finishing rank (0-based). Pad to n_drivers.
    lookup = np.zeros(n_drivers, dtype=float)
    for pos, pts in enumerate(_POINTS_BY_POSITION, start=0):
        if pos < n_drivers:
            lookup[pos] = float(pts)

    onehot, _codes = _build_constructor_matrix(drivers)
    n_constructors = onehot.shape[1]
    initial_con = initial @ onehot  # (n_constructors,)

    driver_points = np.empty((n_simulations, n_drivers), dtype=float)
    constructor_points = np.empty((n_simulations, n_constructors), dtype=float)

    for start in range(0, n_simulations, chunk_size):
        stop = min(start + chunk_size, n_simulations)
        c = stop - start

        # --- Latent performance scores for every sim/race/driver ------------
        # shape (c, n_races, n_drivers)
        scores = ratings[None, None, :] + rng.normal(
            0.0, noise_scale, size=(c, n_races, n_drivers)
        )

        # --- Optional per-race "chaos" multiplier --------------------------
        # NOTE: a SHARED ADDITIVE offset would not change the finishing ORDER
        # (adding the same constant to everyone preserves ranking). To model
        # "some races are chaotic, some are orderly" we instead scale the
        # SPREAD of the individual noise per race.
        if chaos_spread > 0 and n_races > 0:
            chaos = rng.normal(1.0, chaos_spread, size=(c, n_races, 1))
            chaos = np.clip(chaos, 0.0, None)
            # Re-scale the noise component (score minus rating).
            scores = ratings[None, None, :] + (scores - ratings[None, None, :]) * chaos

        # --- DNFs: roll per sim/race/driver; retirees rank last ------------
        if n_races > 0:
            dnf_mask = rng.random((c, n_races, n_drivers)) < dnf_probs[None, None, :]
            scores = np.where(dnf_mask, -np.inf, scores)
        else:
            dnf_mask = np.zeros((c, 0, n_drivers), dtype=bool)

        # --- Finishing order -> points -------------------------------------
        if n_races > 0:
            # Double argsort gives each driver's rank within its race.
            # (rank 0 = best). Descending score => negate for ascending argsort.
            ranks = np.argsort(np.argsort(-scores, axis=2), axis=2)
            earned = lookup[ranks]                     # (c, n_races, n_drivers)
            earned = np.where(dnf_mask, 0.0, earned)   # retirees score nothing
            season = earned.sum(axis=1)                # (c, n_drivers)
        else:
            season = np.zeros((c, n_drivers), dtype=float)

        # --- Apply initial (already earned) points --------------------------
        driver_points[start:stop] = season + initial[None, :]
        constructor_points[start:stop] = (season @ onehot) + initial_con[None, :]

    return driver_points, constructor_points


# ---------------------------------------------------------------------------
# PUBLIC ENTRY POINT
# ---------------------------------------------------------------------------


def run_monte_carlo(
    drivers: list[DriverInput],
    remaining_races: int,
    n_simulations: int,
    seed: int | None = 42,
    noise_scale: float = 1.0,
    chaos_spread: float = 0.0,
    chunk_size: int = _DEFAULT_CHUNK,
) -> dict:
    """Run the Monte Carlo championship simulation.

    Args:
        drivers: grid of DriverInput objects.
        remaining_races: how many races to simulate ahead.
        n_simulations: number of simulated seasons.
        seed: RNG seed (same seed => reproducible results).
        noise_scale: per-race luck spread (std dev of the normal noise).
        chaos_spread: optional extra realism. 0 = every race equally noisy.
            >0 = some races are more chaotic than others (the per-race spread
            of luck varies), which is closer to real racing.
        chunk_size: simulations processed per batch (bounds peak memory).

    Returns:
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
    if not drivers:
        raise ValueError("At least one driver is required")

    rng = np.random.default_rng(seed)

    driver_points, constructor_points = _simulate_seasons_vectorized(
        drivers=drivers,
        remaining_races=remaining_races,
        n_simulations=n_simulations,
        rng=rng,
        noise_scale=noise_scale,
        chaos_spread=chaos_spread,
        chunk_size=chunk_size,
    )

    driver_codes = [d.code for d in drivers]
    _onehot, constructor_codes = _build_constructor_matrix(drivers)

    def _tally(points: np.ndarray, labels: list[str]) -> list[dict]:
        """Count, per label, in how many simulations it finished top (with ties)."""
        best = points.max(axis=1, keepdims=True)
        is_champion = points == best            # (n_sims, n_labels)
        wins = is_champion.sum(axis=0)          # (n_labels,)
        out = [
            {"code": label, "win_probability": round(float(w) / n_simulations, 4)}
            for label, w in zip(labels, wins)
        ]
        out.sort(key=lambda item: -item["win_probability"])
        return out

    return {
        "drivers": _tally(driver_points, driver_codes),
        "constructors": _tally(constructor_points, constructor_codes),
    }


def run_monte_carlo_scalar(
    drivers: list[DriverInput],
    remaining_races: int,
    n_simulations: int,
    seed: int | None = 42,
    noise_scale: float = 1.0,
) -> dict:
    """Reference (slow) implementation. Kept so tests can cross-check the
    vectorized engine against the obvious loop-based version."""
    rng = np.random.default_rng(seed)
    driver_wins = {d.code: 0 for d in drivers}
    constructor_wins = {d.constructor_code: 0 for d in drivers}

    for _ in range(n_simulations):
        drv_pts, con_pts = _simulate_one_season(
            drivers, remaining_races, rng, noise_scale
        )
        max_d = max(drv_pts.values())
        for code, pts in drv_pts.items():
            if pts == max_d:
                driver_wins[code] += 1
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
