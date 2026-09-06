"""Unit tests for the pure teammate head-to-head / Elo engine (offline)."""
from app.services.headtohead_engine import (
    elo_after,
    expected_score,
    process_season_qualifying,
)


class TestEloMath:
    def test_equal_players_expected_0_5(self):
        assert abs(expected_score(1000, 1000) - 0.5) < 1e-9

    def test_stronger_expected_higher(self):
        # A 200-point gap -> ~0.76 win expectancy for the stronger driver.
        assert expected_score(1200, 1000) > 0.75

    def test_winner_elo_rises_loser_falls(self):
        w, l = elo_after(1000, 1000)
        assert w > 1000
        assert l < 1000
        # Symmetry: total rating conserved.
        assert abs((w + l) - 2000) < 1e-9


class TestProcessSeasonQualifying:
    def _round(self, pairs):
        """Build a round's rows from list of ((code,pos), (code,pos)) per team."""
        rows = []
        for a, b in pairs:
            team = a[2]
            rows.append({"code": a[0], "position": a[1], "constructor": team})
            rows.append({"code": b[0], "position": b[1], "constructor": team})
        return rows

    def test_one_duel_counts_win(self):
        r1 = self._round([(("A", 1, "T1"), ("B", 2, "T1"))])
        res = process_season_qualifying([r1])
        assert len(res["duels"]) == 1
        d = res["duels"][0]
        assert (d["driver_a"], d["driver_b"]) in (("A", "B"), ("B", "A"))
        # driver A (pos 1) beat driver B (pos 2)
        winner = "A"
        wins_a = d["wins_a"] if d["driver_a"] == "A" else d["wins_b"]
        assert wins_a == 1
        assert d["elo_a"] != d["elo_b"]

    def test_consistent_winner_has_higher_elo(self):
        rounds = []
        for _ in range(5):
            rounds.append(self._round([(("A", 1, "T1"), ("B", 2, "T1"))]))
        res = process_season_qualifying(rounds)
        d = res["duels"][0]
        elo_a = d["elo_a"] if d["driver_a"] == "A" else d["elo_b"]
        elo_b = d["elo_b"] if d["driver_a"] == "A" else d["elo_a"]
        assert elo_a > elo_b
        assert d["wins_a"] + d["wins_b"] == 5

    def test_multiple_teams_isolated(self):
        r1 = self._round([(("A", 1, "T1"), ("B", 2, "T1")),
                          (("C", 1, "T2"), ("D", 2, "T2"))])
        res = process_season_qualifying([r1])
        assert len(res["duels"]) == 2

    def test_team_with_one_driver_no_duel(self):
        r1 = [{"code": "A", "position": 1, "constructor": "T1"}]
        res = process_season_qualifying([r1])
        assert res["duels"] == []

    def test_empty_season_no_duels(self):
        assert process_season_qualifying([])["duels"] == []
