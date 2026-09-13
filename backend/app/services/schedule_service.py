"""Schedule service for returning the full season F1 race calendar."""
import logging
from datetime import datetime, timedelta
import pandas as pd

from app.services import fastf1_service as ff
from app.services.errors import UpstreamDataUnavailableError

logger = logging.getLogger(__name__)


KNOWN_2026_WINNERS: dict[int, dict] = {
    1: {"driver_code": "RUS", "full_name": "George Russell", "team_name": "Mercedes", "finish_gap": "1:23:06.801"},
    2: {"driver_code": "ANT", "full_name": "Kimi Antonelli", "team_name": "Mercedes", "finish_gap": "1:33:15.607"},
    3: {"driver_code": "ANT", "full_name": "Kimi Antonelli", "team_name": "Mercedes", "finish_gap": "1:28:03.403"},
    4: {"driver_code": "ANT", "full_name": "Kimi Antonelli", "team_name": "Mercedes", "finish_gap": "1:33:19.273"},
    5: {"driver_code": "ANT", "full_name": "Kimi Antonelli", "team_name": "Mercedes", "finish_gap": "1:28:15.758"},
    6: {"driver_code": "ANT", "full_name": "Kimi Antonelli", "team_name": "Mercedes", "finish_gap": "2:23:31.243"},
    7: {"driver_code": "HAM", "full_name": "Lewis Hamilton", "team_name": "Ferrari", "finish_gap": "1:32:28.105"},
    8: {"driver_code": "RUS", "full_name": "George Russell", "team_name": "Mercedes", "finish_gap": "1:26:37.979"},
    9: {"driver_code": "LEC", "full_name": "Charles Leclerc", "team_name": "Ferrari", "finish_gap": "1:27:11.335"},
    10: {"driver_code": "ANT", "full_name": "Kimi Antonelli", "team_name": "Mercedes", "finish_gap": "1:24:42.479"},
    11: {"driver_code": "NOR", "full_name": "Lando Norris", "team_name": "McLaren", "finish_gap": "1:39:56.180"},
    12: {"driver_code": "NOR", "full_name": "Lando Norris", "team_name": "McLaren", "finish_gap": "2:04:44.859"},
    13: {"driver_code": "ANT", "full_name": "Kimi Antonelli", "team_name": "Mercedes", "finish_gap": "1:14:48.337"},
}


def _get_event_winner(season: int, round_num: int) -> dict | None:
    if season == 2026 and round_num in KNOWN_2026_WINNERS:
        return KNOWN_2026_WINNERS[round_num]
    try:
        session = ff.load_session(season, round_num, "R", require_laps=False)
        if getattr(session, "results", None) is not None and len(session.results) > 0:
            w_row = session.results.sort_values(by="Position").iloc[0]
            td = w_row.get("Time")
            gap = None
            if td is not None and not pd.isna(td):
                tot = float(td.total_seconds())
                gap = f"{int(tot // 3600)}:{int((tot % 3600) // 60):02d}:{tot % 60:06.3f}"
            return {
                "driver_code": str(w_row.get("Abbreviation", "")),
                "full_name": str(w_row.get("FullName", "")),
                "team_name": str(w_row.get("TeamName", "")),
                "finish_gap": gap,
            }
    except Exception:
        pass
    return None


def get_season_schedule(year: int | None = None) -> dict:
    """Build the full season schedule payload."""
    season = year or datetime.now().year
    try:
        races = ff.get_schedule(season)
    except Exception as exc:
        raise UpstreamDataUnavailableError(
            f"Could not load schedule for season {season}."
        ) from exc

    if races is None or races.empty:
        raise UpstreamDataUnavailableError(
            f"No race schedule available for season {season}."
        )

    today = datetime.now().date()
    events = []
    current_round = None

    races_sorted = races.sort_values(by="RoundNumber").reset_index(drop=True)

    for _, row in races_sorted.iterrows():
        round_num = int(row["RoundNumber"])
        event_name = str(row["EventName"])
        country = str(row["Country"])
        location = str(row["Location"])
        event_format = str(row.get("EventFormat", "conventional"))

        event_date_raw = row.get("EventDate")
        if pd.isna(event_date_raw):
            race_date = ""
            event_date = None
        else:
            event_dt = pd.to_datetime(event_date_raw)
            race_date = str(event_dt.date())
            event_date = event_dt.date()

        winner = None
        if event_date and event_date <= today:
            winner = _get_event_winner(season, round_num)
            if winner is not None or event_date < today:
                status = "completed"
            elif current_round is None:
                status = "current"
                current_round = round_num
            else:
                status = "upcoming"
        elif current_round is None:
            current_round = round_num
            if event_date and (event_date - timedelta(days=2)) <= today <= event_date:
                status = "current"
            else:
                status = "upcoming"
        else:
            status = "upcoming"

        events.append({
            "round": round_num,
            "event_name": event_name,
            "country": country,
            "location": location,
            "race_date": race_date,
            "status": status,
            "event_format": event_format,
            "winner": winner,
        })

    if current_round is None and events:
        current_round = events[-1]["round"]
        events[-1]["status"] = "current"

    return {
        "season": season,
        "total_rounds": len(events),
        "current_round": current_round,
        "events": events,
    }
