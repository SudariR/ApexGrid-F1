from datetime import datetime

from app.services import fastf1_service as ff


def _driver_row_to_entry(row: dict) -> dict:
    """Map one raw DriverStandings row to the dict our DriverStanding needs."""
    driver = row.get("Driver", {})
    given = driver.get("givenName", "")
    family = driver.get("familyName", "")
    full = f"{given} {family}".strip()
    # A driver can have driven for multiple constructors in a season; join names.
    teams = [c.get("name", "") for c in row.get("Constructors", []) if c.get("name")]
    return {
        "position": int(row.get("position", 0)),
        "driver_code": driver.get("code", ""),
        "full_name": full,
        "nationality": driver.get("nationality"),
        "team_name": ", ".join(teams) if teams else None,
        "points": float(row.get("points", 0)),
        "wins": int(row.get("wins", 0)),
    }


def _constructor_row_to_entry(row: dict) -> dict:
    """Map one raw ConstructorStandings row to our ConstructorStanding dict."""
    constructor = row.get("Constructor", {})
    return {
        "position": int(row.get("position", 0)),
        "name": constructor.get("name", ""),
        "nationality": constructor.get("nationality"),
        "points": float(row.get("points", 0)),
        "wins": int(row.get("wins", 0)),
    }


def get_standings_payload(season: int | None = None) -> dict:
    """Build the combined Drivers + Constructors standings payload dict."""
    year = season or datetime.now().year

    drv_season, drv_round, drv_rows = ff.get_driver_standings_raw(year)
    _con_season, con_round, con_rows = ff.get_constructor_standings_raw(year)

    drivers = [_driver_row_to_entry(r) for r in drv_rows]
    constructors = [_constructor_row_to_entry(r) for r in con_rows]

    # Both calls should reflect the same round; trust the driver one primarily.
    effective_round = drv_round or con_round

    return {
        "season": int(drv_season or year),
        "round": int(effective_round),
        "drivers": drivers,
        "constructors": constructors,
    }
