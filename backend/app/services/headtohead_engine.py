from __future__ import annotations

# Elo 'K factor': how much each duel moves the ratings. 16 is a common choice.
_K_FACTOR = 16.0
# Everyone starts here.
_STARTING_ELO = 1000.0


def expected_score(rating_a: float, rating_b: float) -> float:
    """Probability driver A beats driver B given their Elo ratings."""
    return 1.0 / (1.0 + 10.0 ** ((rating_b - rating_a) / 400.0))


def elo_after(winner_elo: float, loser_elo: float, k: float = _K_FACTOR):
    """Return updated (winner_elo, loser_elo) after a single duel."""
    expected_win = expected_score(winner_elo, loser_elo)
    new_winner = winner_elo + k * (1.0 - expected_win)
    new_loser = loser_elo + k * (0.0 - (1.0 - expected_win))
    return new_winner, new_loser


def process_season_qualifying(round_rows: list[list[dict]]) -> dict:
    """Aggregate teammate qualifying duels over a list of rounds.

    `round_rows` is a list, one per round, of qualifying rows. Each row dict:
        {"code": "VER", "position": 1, "constructor": "Red Bull"}

    Returns:
        {
          "teams": { constructor: {driver_code: elo, ...} },   # final Elo
          "duels": [ { "constructor", "driver_a", "driver_b",
                       "wins_a", "wins_b", "draws" }, ... ]
        }
    """
    elo: dict[str, float] = {}
    # Duels keyed by the team they share; track ordered pairs.
    team_members: dict[str, set] = {}
    # per-(pair) tally of who won. Key: tuple(sorted codes), value wins per code
    pair_wins: dict[tuple, dict] = {}

    def get_elo(code: str) -> float:
        return elo.get(code, _STARTING_ELO)

    for round_rows_i in round_rows:
        # Group this round's drivers by constructor.
        by_team: dict[str, list[dict]] = {}
        for row in round_rows_i:
            by_team.setdefault(row["constructor"], []).append(row)

        for team, drivers in by_team.items():
            if len(drivers) < 2:
                continue  # no teammate to duel
            # Sort by qualifying position; lower = ahead.
            drivers = sorted(drivers, key=lambda d: d["position"])
            a, b = drivers[0], drivers[1]
            if a["code"] == b["code"]:
                continue
            a_code, b_code = a["code"], b["code"]
            a_pos, b_pos = a["position"], b["position"]

            team_members.setdefault(team, set()).update([a_code, b_code])

            # Tally head-to-head.
            pair = tuple(sorted((a_code, b_code)))
            tally = pair_wins.setdefault(pair, {a_code: 0, b_code: 0})
            if a_pos < b_pos:
                tally[a_code] += 1
                # Elo update: a beats b.
                ea, eb = get_elo(a_code), get_elo(b_code)
                na, nb = elo_after(ea, eb)
                elo[a_code], elo[b_code] = na, nb
            elif b_pos < a_pos:
                tally[b_code] += 1
                ea, eb = get_elo(a_code), get_elo(b_code)
                nb, na = elo_after(eb, ea)  # b beats a
                elo[a_code], elo[b_code] = na, nb
            # Equal position (extremely rare): no elo move, no win credited.

    # Build output duels for every pair that raced together.
    duels = []
    for pair, tally in pair_wins.items():
        a_code, b_code = pair
        # Find the constructor for this pair.
        team = _find_team(pair, team_members)
        duels.append({
            "constructor": team,
            "driver_a": a_code,
            "driver_b": b_code,
            "wins_a": tally[a_code],
            "wins_b": tally[b_code],
            "draws": 0,
            "elo_a": round(get_elo(a_code), 1),
            "elo_b": round(get_elo(b_code), 1),
        })

    return {
        "elo": {k: round(v, 1) for k, v in elo.items()},
        "duels": duels,
    }


def _find_team(pair: tuple, team_members: dict) -> str | None:
    """Find which team both drivers of a pair belong to."""
    for team, members in team_members.items():
        if set(pair).issubset(members):
            return team
    return None
