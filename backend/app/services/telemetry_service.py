from datetime import datetime

import pandas as pd

from app.services import fastf1_service as ff
from app.services.errors import UpstreamDataUnavailableError

# Mapping from fastf1 column names -> friendly keys exposed in the API.
COLUMN_MAP = {
    "Distance": "distance",
    "X": "x",
    "Y": "y",
    "Speed": "speed_kmh",
    "Throttle": "throttle_pct",
    "Brake": "brake",
    "nGear": "gear",
    "DRS": "drs",
}


def _map_and_decimate(telemetry_df: pd.DataFrame, max_points: int) -> pd.DataFrame:
    missing = [c for c in COLUMN_MAP if c not in telemetry_df.columns]
    if missing:
        raise ValueError(f"Telemetry frame missing expected columns: {missing}")

    df = telemetry_df[list(COLUMN_MAP)].rename(columns=COLUMN_MAP).copy()

    # Drop rows where position is missing (unreliable / padding samples).
    df = df.dropna(subset=["x", "y", "distance"])

    if max_points and len(df) > max_points:
        # Evenly spaced sample by row index (simple, robust).
        step = len(df) / max_points
        idx = [int(i * step) for i in range(max_points)]
        df = df.iloc[idx]

    # Normalise booleans and integers so JSON output is predictable.
    df["brake"] = df["brake"].astype(bool)
    df["gear"] = df["gear"].astype(int)
    df["drs"] = df["drs"].astype(int)
    return df.reset_index(drop=True)


def _frame_to_points(df: pd.DataFrame) -> list[dict]:
    """PURE: convert the friendly telemetry DataFrame to a list of dicts."""
    return df.to_dict(orient="records")


def _points_to_track(points: list[dict]) -> list[dict]:
    """PURE: derive shared track geometry (distance, x, y) from one driver's trace."""
    return [{"distance": p["distance"], "x": p["x"], "y": p["y"]} for p in points]


# --- fastf1-touching helpers (thin) ---------------------------------------


def _best_clean_lap(session, driver_code: str):
    """Return the fastest representative lap for a driver in a loaded session."""
    laps = session.laps.pick_drivers(driver_code)
    if laps.empty:
        raise UpstreamDataUnavailableError(
            f"No laps found for driver '{driver_code}' in this session."
        )
    # pick_fastest() chooses the minimum LapTime; filter to completed/flying laps.
    fastest = laps.pick_fastest()
    if fastest is None:
        raise UpstreamDataUnavailableError(
            f"Could not determine a fastest lap for driver '{driver_code}'."
        )
    return fastest


def _lap_telemetry_points(lap, max_points: int) -> list[dict]:
    """Extract a driver's telemetry as a decimated list of point dicts."""
    try:
        telemetry = lap.get_telemetry(frequency="original")
    except Exception as exc:
        raise UpstreamDataUnavailableError(
            f"Telemetry unavailable for lap of driver {lap.get('Driver')}: {exc}"
        ) from exc
    df = _map_and_decimate(telemetry, max_points)
    return _frame_to_points(df)


def _lap_time_ms(lap) -> int | None:
    try:
        lt = lap.get("LapTime")
        if lt is None:
            return None
        return int(lt.total_seconds() * 1000)
    except Exception:
        return None


# --- public entry point ----------------------------------------------------


def get_compare_payload(
    season: int | None = None,
    gp_round: int | None = None,
    session_type: str = "Q",
    driver_a: str = "",
    driver_b: str = "",
    max_points: int = 1500,
) -> dict:
    """Build the telemetry comparison payload for two drivers.

    Uses each driver's fastest representative lap in the given session.
    Returns shared track geometry + one decimated trace per driver.
    """
    year = season or datetime.now().year
    if gp_round is None:
        raise ValueError("gp_round is required for telemetry comparison")
    session = ff.load_session(year, gp_round, session_type, require_laps=True)

    lap_a = _best_clean_lap(session, driver_a)
    lap_b = _best_clean_lap(session, driver_b)

    points_a = _lap_telemetry_points(lap_a, max_points)
    points_b = _lap_telemetry_points(lap_b, max_points)

    event = session.event
    return {
        "season": year,
        "round": int(event["RoundNumber"]),
        "event_name": str(event["EventName"]),
        "session_type": session_type,
        "track": _points_to_track(points_a),  # geometry from driver A's lap
        "drivers": [
            {
                "driver_code": driver_a,
                "lap_number": int(lap_a["LapNumber"]) if "LapNumber" in lap_a else 0,
                "lap_time_ms": _lap_time_ms(lap_a),
                "points": points_a,
            },
            {
                "driver_code": driver_b,
                "lap_number": int(lap_b["LapNumber"]) if "LapNumber" in lap_b else 0,
                "lap_time_ms": _lap_time_ms(lap_b),
                "points": points_b,
            },
        ],
    }
