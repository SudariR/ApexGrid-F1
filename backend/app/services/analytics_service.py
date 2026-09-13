from __future__ import annotations

import numpy as np
from scipy import stats


# --- Pure: pace consistency ------------------------------------------------

def _seconds(lap) -> float:
    """Return lap time in seconds, guarding non-finite values."""
    return float(lap["lap_time_s"])


def pace_stats(laps: list[dict]) -> dict:
    """PURE: descriptive statistics of a driver's clean lap times (seconds)."""
    times = np.array([_seconds(l) for l in laps], dtype=float)
    times = times[np.isfinite(times)]
    if times.size == 0:
        raise ValueError("No clean laps provided for pace statistics.")
    q1, q2, q3 = np.percentile(times, [25, 50, 75])
    mean = float(times.mean())
    std = float(times.std(ddof=1)) if times.size > 1 else 0.0
    cv = (std / mean * 100) if mean else 0.0  # coefficient of variation (%)
    return {
        "count": int(times.size),
        "mean_s": round(mean, 3),
        "median_s": round(float(q2), 3),
        "std_s": round(std, 3),
        "cv_pct": round(cv, 3),      # lower = more consistent
        "q1_s": round(float(q1), 3),
        "q3_s": round(float(q3), 3),
        "min_s": round(float(times.min()), 3),
        "max_s": round(float(times.max()), 3),
    }


def kde_curve(laps: list[dict], n_points: int = 60) -> list[dict]:
    """PURE: Gaussian KDE of the lap-time distribution for the frontend chart.

    Returns a list of {lap_time_s, density} points across the observed range.
    """
    times = np.array([_seconds(l) for l in laps], dtype=float)
    times = times[np.isfinite(times)]
    if times.size < 3:
        return []
    kde = stats.gaussian_kde(times)
    lo, hi = float(times.min()), float(times.max())
    grid = np.linspace(lo, hi, n_points)
    dens = kde(grid)
    return [
        {"lap_time_s": round(float(x), 3), "density": round(float(d), 5)}
        for x, d in zip(grid, dens)
    ]


# --- Pure: tire degradation ------------------------------------------------

def _linear_fit(x: np.ndarray, y: np.ndarray) -> dict | None:
    """Least-squares fit y = slope*x + intercept. Returns None if degenerate."""
    if x.size < 3:
        return None
    res = stats.linregress(x, y)
    slope = float(getattr(res, "slope"))
    intercept = float(getattr(res, "intercept"))
    r = float(getattr(res, "rvalue"))
    return {
        "slope_s_per_lap": round(slope, 4),
        "intercept_s": round(intercept, 3),
        "r2": round(r * r, 4),
    }


def tire_degradation(laps: list[dict]) -> list[dict]:
    """PURE: estimate degradation (s/lap) per stint, grouped by compound.

    For each stint we regress lap_time_s against tyre_life (tyre age). A
    positive slope means the tyres got slower as the stint wore on.
    Returns one entry per stint with at least 3 clean laps.
    """
    from collections import OrderedDict

    stints: dict[tuple, list] = OrderedDict()
    for lap in laps:
        key = (str(lap.get("compound")), int(lap.get("stint", 0)))
        stints.setdefault(key, []).append(lap)

    results = []
    for (compound, stint), group in stints.items():
        x = np.array([float(l.get("tyre_life", 0)) for l in group])
        y = np.array([_seconds(l) for l in group])
        # sort by tyre age for a clean fit
        order = np.argsort(x)
        fit = _linear_fit(x[order], y[order])
        if fit is None:
            continue
        results.append({
            "compound": compound,
            "stint": stint,
            "n_laps": len(group),
            **fit,
        })
    return results


def _event_meta(session, year: int, session_type: str) -> dict:
    ev = session.event
    return {
        "season": year,
        "round": int(ev["RoundNumber"]),
        "event_name": str(ev["EventName"]),
        "session_type": session_type,
    }


def get_pace_payload(
    season: int, gp_round: int, session_type: str, driver_code: str
) -> dict:
    """Pace consistency for one driver. meta + stats + kde curve."""
    year = season
    session = _load(year, gp_round, session_type)
    laps = _laps_from_session(session, driver_code)
    if not laps:
        raise ValueError(f"No clean laps available for driver {driver_code}.")
    meta = _event_meta(session, year, session_type)
    return {
        **meta,
        "driver_code": driver_code,
        "stats": pace_stats(laps),
        "kde": kde_curve(laps),
    }


def get_tire_payload(
    season: int, gp_round: int, session_type: str, driver_code: str
) -> dict:
    """Tire degradation per stint for one driver."""
    year = season
    session = _load(year, gp_round, session_type)
    laps = _laps_from_session(session, driver_code)
    meta = _event_meta(session, year, session_type)
    return {
        **meta,
        "driver_code": driver_code,
        "stints": tire_degradation(laps),
    }


def _load(year: int, gp_round: int, session_type: str):
    from app.services import fastf1_service as ff
    return ff.load_session(year, gp_round, session_type, require_laps=True)


# --- FastF1 fetch layer (thin, NOT pure) -----------------------------------

def _laps_from_session(session, driver_code: str) -> list[dict]:
    """Normalise a driver's CLEAN race laps from a loaded session.

    Filters out: inaccurate/deleted laps, pit in/out laps, and laps run under
    a Safety Car / Virtual Safety Car so the analytics reflect true pace.
    """
    from app.services.errors import UpstreamDataUnavailableError

    try:
        laps = session.laps.pick_drivers(driver_code)
        laps = laps.pick_accurate().pick_not_deleted().pick_wo_box()
        # Exclude laps under SC/VSC/red (track-status digits 3,4,5,6).
        neutral = {"3", "4", "5", "6"}
        mask = laps["TrackStatus"].astype(str).map(
            lambda s: not (set(s) & neutral)
        )
        laps = laps[mask]
    except Exception as exc:  # provider issue -> laps unavailable
        raise UpstreamDataUnavailableError(
            f"Lap data unavailable for driver {driver_code}: {exc}"

        ) from exc

    out = []
    for _, lap in laps.iterrows():
        lt = lap.get("LapTime")
        if lt is None:
            continue
        out.append({
            "lap_time_s": float(lt.total_seconds()),
            "tyre_life": int(lap.get("TyreLife", 0)) if lap.get("TyreLife") is not None else 0,
            "compound": str(lap.get("Compound", "")),
            "stint": int(lap.get("Stint", 0)) if lap.get("Stint") is not None else 0,
        })
    return out
