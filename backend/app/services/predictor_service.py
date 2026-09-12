from datetime import datetime

from app.services import fastf1_service as ff
from app.services.errors import UpstreamDataUnavailableError
from app.services.simulation_engine import DriverInput, run_monte_carlo

# Per-race chance of not finishing, used as the default for every driver.
_DEFAULT_DNF_PROBABILITY = 0.05
# Spread of the default pace rating (leader gets this many "units" of pace).
_RATING_SPREAD = 2.0


def _driver_constructor_name(constructors: list) -> str:
    """Return the team name for a driver, or a placeholder if unknown."""
    if constructors:
        return constructors[0].get("name", "")
    return "Unknown"


def _constructor_code(team_name: str) -> str:
    """Derive a short, stable code from a constructor name.

    e.g. 'Mercedes' -> 'MER', 'Red Bull' -> 'RB', 'Aston Martin' -> 'AM'.
    """
    words = [w for w in team_name.replace("-", " ").split() if w.isalnum()]
    if not words:
        return team_name.upper()
    if len(words) == 1:
        return words[0][:3].upper()
    return "".join(w[0] for w in words).upper()


def _compute_remaining_races(season: int, as_of_round: int) -> int:
    """Count scheduled rounds strictly after the round standings reflect."""
    schedule = ff.get_schedule(season)
    if schedule is None or schedule.empty:
        return 0
    return int((schedule["RoundNumber"] > as_of_round).sum())


def _load_drivers(season: int):
    """Fetch standings and build list of DriverInput with default ratings.

    Returns (as_of_round, drivers, name_lookup) where name_lookup maps a
    driver code -> full name, and con_lookup maps driver code -> team name.
    """
    _, as_of_round, rows = ff.get_driver_standings_raw(season)
    if not rows:
        raise UpstreamDataUnavailableError(
            f"No driver standings available for season {season}."
        )

    leader_points = max(float(r.get("points", 0)) for r in rows) or 1.0
    drivers: list[DriverInput] = []
    driver_names: dict[str, str] = {}
    driver_teams: dict[str, str] = {}

    for row in rows:
        driver = row.get("Driver", {})
        code = driver.get("code", "")
        if not code:
            continue
        points = float(row.get("points", 0))
        # Rating proportional to points vs the leader, in [0, RATING_SPREAD].
        rating = (points / leader_points) * _RATING_SPREAD
        team_name = _driver_constructor_name(row.get("Constructors", []))
        drivers.append(
            DriverInput(
                code=code,
                constructor_code=_constructor_code(team_name),
                points=points,
                rating=rating,
                dnf_probability=_DEFAULT_DNF_PROBABILITY,
            )
        )
        driver_names[code] = f"{driver.get('givenName','')} {driver.get('familyName','')}".strip()
        driver_teams[code] = team_name

    return as_of_round, drivers, driver_names, driver_teams


def _apply_overrides(drivers: list[DriverInput], overrides) -> list[DriverInput]:
    """Return a NEW list of DriverInput with What-If overrides applied.

    WHY NOT MUTATE IN PLACE?
    ------------------------
    Mutating the caller's objects is a hidden side effect: if the caller reuses
    that list (e.g. to run a baseline then a scenario), the first run would
    silently corrupt the second. Returning fresh copies keeps the function pure
    and makes baseline-vs-scenario comparisons correct.

    Accepts either Pydantic DriverScenario objects or plain dicts, so it is
    easy to call both from tests and from the HTTP endpoint.
    """
    # Build a normalised view of the overrides keyed by driver code.
    by_code: dict[str, dict] = {}
    for ov in overrides:
        code = ov.code if hasattr(ov, "code") else ov.get("code")
        rating = ov.rating if hasattr(ov, "rating") else ov.get("rating")
        dnf = (
            ov.dnf_probability
            if hasattr(ov, "dnf_probability")
            else ov.get("dnf_probability")
        )
        if code is not None:
            by_code[code] = {"rating": rating, "dnf_probability": dnf}

    out: list[DriverInput] = []
    for d in drivers:
        ov = by_code.get(d.code)
        if ov is None:
            out.append(d)  # no override -> reuse the original (immutable use)
            continue
        out.append(
            DriverInput(
                code=d.code,
                constructor_code=d.constructor_code,
                points=d.points,
                rating=ov["rating"] if ov["rating"] is not None else d.rating,
                dnf_probability=(
                    ov["dnf_probability"]
                    if ov["dnf_probability"] is not None
                    else d.dnf_probability
                ),
            )
        )
    return out


def get_predict_payload(
    season: int | None = None,
    n_simulations: int = 10000,
    seed: int | None = None,
    remaining_races: int | None = None,
    overrides=None,
    chaos_spread: float = 0.0,
) -> dict:
    """Build the full predictor response payload.

    chaos_spread > 0 models some races being wilder than others (see
    simulation_engine.run_monte_carlo).
    """
    overrides = overrides or []
    year = season or datetime.now().year

    as_of_round, drivers, driver_names, driver_teams = _load_drivers(year)

    # Determine how many races remain.
    if remaining_races is None:
        remaining = _compute_remaining_races(year, as_of_round)
    else:
        remaining = remaining_races

    # Apply What-If overrides (returns new driver objects; does not mutate).
    drivers = _apply_overrides(drivers, overrides)

    result = run_monte_carlo(
        drivers=drivers,
        remaining_races=remaining,
        n_simulations=n_simulations,
        seed=seed,
        chaos_spread=chaos_spread,
    )

    # Decorate driver probabilities with names; derive constructor names.
    constructor_names = {}
    for code, team in driver_teams.items():
        constructor_names.setdefault(_constructor_code(team), team)

    drivers_out = [
        {"code": item["code"],
         "name": driver_names.get(item["code"]),
         "win_probability": item["win_probability"]}
        for item in result["drivers"]
    ]
    constructors_out = [
        {"code": item["code"],
         "name": constructor_names.get(item["code"]),
         "win_probability": item["win_probability"]}
        for item in result["constructors"]
    ]

    return {
        "season": year,
        "as_of_round": int(as_of_round),
        "remaining_races": remaining,
        "n_simulations": n_simulations,
        "drivers": drivers_out,
        "constructors": constructors_out,
    }
