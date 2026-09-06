from datetime import datetime

from app.services import fastf1_service as ff
from app.services.errors import UpstreamDataUnavailableError
from app.services.headtohead_engine import process_season_qualifying


def _normalise(qual_rows: list) -> list[dict]:
    """Convert raw Ergast qualifying rows to the simple engine input shape."""
    out = []
    for row in qual_rows:
        driver = row.get("Driver", {})
        constructor = row.get("Constructor", {})
        code = driver.get("code")
        position = row.get("position")
        if not code or position is None:
            continue
        try:
            position = int(position)
        except (TypeError, ValueError):
            continue
        out.append({
            "code": code,
            "position": position,
            "constructor": constructor.get("name", ""),
        })
    return out


def get_headtohead_payload(season: int | None = None) -> dict:
    """Build the teammate head-to-head payload for a season."""
    year = season or datetime.now().year

    # Figure out the latest completed round from standings.
    try:
        _, as_of_round, standings_rows = ff.get_driver_standings_raw(year)
    except Exception as exc:
        raise UpstreamDataUnavailableError(
            f"Could not load standings for {year}: {exc}"
        ) from exc
    as_of_round = int(as_of_round or 0)
    if as_of_round < 1:
        raise UpstreamDataUnavailableError(
            f"No completed rounds yet for season {year}."
        )

    # Fetch qualifying for every completed round 1..as_of_round.
    all_rounds: list[list[dict]] = []
    for gp_round in range(1, as_of_round + 1):
        qual = ff.get_qualifying_raw(year, gp_round)
        all_rounds.append(_normalise(qual))

    result = process_season_qualifying(all_rounds)

    # Build name lookups from the standings rows.
    names: dict[str, str] = {}
    teams: dict[str, str] = {}  # driver code -> team name (current)
    for row in standings_rows:
        driver = row.get("Driver", {})
        code = driver.get("code")
        if not code:
            continue
        names[code] = f"{driver.get('givenName','')} {driver.get('familyName','')}".strip()
        cons = row.get("Constructors", [])
        teams[code] = cons[0].get("name", "") if cons else ""

    # Decorate duels with names.
    duels_out = []
    for d in result["duels"]:
        a_code, b_code = d["driver_a"], d["driver_b"]
        duels_out.append({
            "constructor": d["constructor"],
            "constructor_name": d["constructor"],
            "driver_a": {"code": a_code, "name": names.get(a_code, a_code)},
            "driver_b": {"code": b_code, "name": names.get(b_code, b_code)},
            "wins_a": d["wins_a"],
            "wins_b": d["wins_b"],
            "races": d["wins_a"] + d["wins_b"] + d["draws"],
            "elo_a": d["elo_a"],
            "elo_b": d["elo_b"],
        })

    return {
        "season": year,
        "as_of_round": as_of_round,
        "duels": duels_out,
    }
