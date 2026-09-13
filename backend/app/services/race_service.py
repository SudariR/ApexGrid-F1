import logging
from datetime import datetime
from typing import Any

import pandas as pd

from app.services import fastf1_service as ff
from app.services.errors import UpstreamDataUnavailableError

logger = logging.getLogger(__name__)


def _format_timedelta(td: Any) -> str | None:
    """Format a pandas Timedelta as H:MM:SS.mmm for JSON output.

    JSON has no TimeDelta type, so we send a readable string.
    """
    if td is None or pd.isna(td):
        return None
    total = float(td.total_seconds())
    hours = int(total // 3600)
    minutes = int((total % 3600) // 60)
    seconds = total % 60
    return f"{hours}:{minutes:02d}:{seconds:06.3f}"


def find_latest_completed_session(year: int):
    """Return a fully-loaded Race session for the most recent completed GP."""
    races = ff.get_schedule(year)

    today = datetime.now().date()
    # Keep races dated today or earlier; sort newest-first.
    races["_date"] = pd.to_datetime(races["EventDate"]).dt.date
    past = pd.DataFrame(races[races["_date"] <= today]).sort_values(by="_date", ascending=False)

    if past.empty:
        raise UpstreamDataUnavailableError(f"No completed races found for {year}.")

    # Walk backwards, trying at most a few so we don't hammer a flaky provider.
    for _, row in past.head(5).iterrows():
        gp_round = int(row["RoundNumber"])
        logger.info("Attempting latest-race probe: %s %s round %d",
                    year, row["EventName"], gp_round)
        try:
            session = ff.load_session(year, gp_round, "R", require_laps=False)
            if getattr(session, "results", None) is not None and len(session.results) > 0:
                return session
        except UpstreamDataUnavailableError:
            continue  # try the next-earlier race

    raise UpstreamDataUnavailableError(
        f"Could not load any completed race results for {year}."
    )


def _driver_to_dict(row: Any) -> dict:
    """Map one results-table row to the plain dict a PodiumDriver schema needs."""
    return {
        "position": _safe_int(row.get("Position")) or 0,
        "driver_code": str(row.get("Abbreviation", "")),
        "full_name": str(row.get("FullName", "")),
        "team_name": str(row.get("TeamName", "")),
        "driver_number": _safe_int(row.get("DriverNumber")),
        "grid_position": _safe_int(row.get("GridPosition")),
        "status": row.get("Status"),
        "points": _safe_float(row.get("Points")),
        "finish_gap": _format_timedelta(row.get("Time")),
    }


def _safe_int(v):
    try:
        if pd.isna(v):
            return None
        return int(v)
    except (TypeError, ValueError):
        return None


def _safe_float(v):
    try:
        if pd.isna(v):
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


def hero_from_session(session, year: int) -> dict:
    """Map an already-loaded Race session into the Hero payload dict."""
    results = ff.get_results(session)
    if results is None or results.empty:
        raise UpstreamDataUnavailableError("Session results data is empty or unavailable.")

    sorted_results = results.sort_values(by="Position")
    top3 = sorted_results.head(3)

    # Winner's completed lap count doubles as the race distance.
    winner = sorted_results.iloc[0]
    total_laps = _safe_int(winner.get("Laps"))

    # Race date: take the local race date from the loaded event info.
    event = session.event
    race_date = str(pd.to_datetime(event["EventDate"]).date())

    podium = [_driver_to_dict(row) for _, row in top3.iterrows()]

    return {
        "season": year,
        "round": int(event["RoundNumber"]),
        "event_name": str(event["EventName"]),

        "country": str(event["Country"]),
        "location": str(event["Location"]),
        "race_date": race_date,
        "total_laps": total_laps,
        "winner": podium[0] if podium else None,
        "podium": podium,
    }


def get_hero_payload(season: int | None = None, gp_round: int | None = None) -> dict:
    """Build the Hero payload.

    If gp_round is given, use that specific race; otherwise resolve the most
    recent completed race automatically.
    """
    year = season or datetime.now().year

    if gp_round is not None:
        session = ff.load_session(year, gp_round, "R", require_laps=False)
        if getattr(session, "results", None) is None or len(session.results) == 0:
            raise UpstreamDataUnavailableError(
                f"No results for {year} GP round {gp_round}."
            )
    else:
        session = find_latest_completed_session(year)

    return hero_from_session(session, year)
