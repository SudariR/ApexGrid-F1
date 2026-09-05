import logging
from pathlib import Path

import pandas as pd
from typing import Any
import fastf1
from fastf1.core import Session
from fastf1.ergast import Ergast

from app.core.config import get_settings
from app.services.errors import UpstreamDataUnavailableError

logger = logging.getLogger(__name__)

# Session-type strings fastf1 understands. Maps our friendly names.
#   FP1/FP2/FP3 = practice, Q = qualifying, S = sprint, R = race
_SESSION_TYPES = ("FP1", "FP2", "FP3", "Q", "S", "R")

# --- Caching bootstrap -----------------------------------------------------


def init_cache() -> None:
    settings = get_settings()
    cache_path = Path(settings.fastf1_cache_dir)
    cache_path.mkdir(parents=True, exist_ok=True)
    # 'no_mp' avoids multiprocessing issues in some environments.
    fastf1.Cache.enable_cache(str(cache_path))
    logger.info("FastF1 disk cache enabled at: %s", cache_path.resolve())


def _get_session(year: int, gp_round: int, session_type: str) -> Session:
    st = session_type.upper()
    if st not in _SESSION_TYPES:
        raise ValueError(
            f"Invalid session_type '{session_type}'. Expected one of {_SESSION_TYPES}."
        )
    return fastf1.get_session(year, gp_round, st)


def _ergast() -> Ergast:
    return Ergast()


def get_driver_standings_raw(season: int):
    """Return the raw DriverStandings list for a season (latest completed GP)."""
    resp: Any = _ergast().get_driver_standings(season=season, result_type="raw")
    block = resp[0]  # single request -> one element
    return block["season"], block["round"], block["DriverStandings"]


def get_constructor_standings_raw(season: int):
    """Return the raw ConstructorStandings list (latest completed GP)."""
    resp: Any = _ergast().get_constructor_standings(season=season, result_type="raw")
    block = resp[0]
    return block["season"], block["round"], block["ConstructorStandings"]


# --- Schedule helpers ------------------------------------------------------


def get_schedule(year: int):
    """Return the season's event schedule as a pandas DataFrame.

    Exposes only the rows that correspond to actual races (RoundNumber >= 1),
    dropping the pre-season testing entry which fastf1 labels round 0.
    """
    schedule = fastf1.get_event_schedule(year)
    races = pd.DataFrame(schedule[schedule["RoundNumber"] >= 1]).copy()
    races = races.sort_values(by="RoundNumber").reset_index(drop=True)
    return races


def get_results(session: Session):
    """Return the final classification DataFrame for a loaded session."""
    return session.results

# --- Loaded-session wrapper ------------------------------------------------

def load_session(
    year: int,
    gp_round: int,
    session_type: str,
    *,
    require_laps: bool = True,
) -> Session:
    """Load a session, returning a clean, *verified* object."""
    session = _get_session(year, gp_round, session_type)

    try:
        session.load()
    except Exception as exc:  # network errors, provider down, etc.
        logger.warning("fastf1 session load failed for %s %s %s: %s",
                       year, gp_round, session_type, exc)
        raise UpstreamDataUnavailableError(
            f"Could not load {session_type} session for GP round {gp_round} in {year}."
        ) from exc

    if require_laps and not _has_laps(session):
        logger.warning("Lap data missing for %s GP %s %s (provider issue?).",
                       year, gp_round, session_type)
        raise UpstreamDataUnavailableError(
            f"Lap/telemetry data unavailable for GP round {gp_round} in {year}."
        )

    return session


def _has_laps(session: Session) -> bool:
    """Safely report whether the session has lap data loaded.

    Uses the private _laps attribute to avoid triggering fastf1's raising
    property. Treats any non-empty frame as 'present'.
    """
    try:
        laps = getattr(session, "_laps", None)
        return laps is not None and len(laps) > 0
    except Exception:
        return False
