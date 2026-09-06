import { HeroResponse, DriverStanding, ConstructorStanding, StandingsResponse } from "@/types/f1";
import { BackendScheduleResponse } from "@/types/calendar";
import { MOCK_HERO_DATA, MOCK_DRIVERS_STANDINGS, MOCK_CONSTRUCTORS_STANDINGS } from "./mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const DRIVER_NUMBERS: Record<string, number> = {
  NOR: 4,
  VER: 1,
  HAM: 44,
  LEC: 16,
  PIA: 81,
  RUS: 63,
  ANT: 12,
  ALO: 14,
  SAI: 55,
  ALB: 23,
  GAS: 10,
  OCO: 31,
  HUL: 27,
  BEA: 87,
  BOR: 5,
  BOT: 77,
  COL: 43,
  HAD: 6,
  LAW: 30,
  LIN: 40,
  PER: 11,
  STR: 18,
  TSU: 22,
};

const DEFAULT_TEAM_DRIVERS: Record<string, string[]> = {
  mercedes: ["RUS", "ANT"],
  ferrari: ["LEC", "HAM"],
  mclaren: ["NOR", "PIA"],
  "red bull": ["VER", "HAD"],
  "red bull racing": ["VER", "HAD"],
  "rb f1 team": ["LIN", "TSU"],
  rb: ["LIN", "TSU"],
  "racing bulls": ["LIN", "TSU"],
  "alpine f1 team": ["COL", "GAS"],
  alpine: ["COL", "GAS"],
  "haas f1 team": ["BEA", "OCO"],
  haas: ["BEA", "OCO"],
  audi: ["BOR", "HUL"],
  williams: ["SAI", "ALB"],
  "aston martin": ["ALO", "STR"],
  "cadillac f1 team": ["BOT", "PER"],
};

export async function fetchHeroData(
  season?: number,
  round?: number
): Promise<HeroResponse & { _isLive?: boolean }> {
  try {
    const params = new URLSearchParams();
    if (season) params.set("season", season.toString());
    if (round) params.set("round", round.toString());
    const query = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE_URL}/hero/latest${query}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Backend responded with ${res.status}, falling back to mock hero data.`);
      return { ...MOCK_HERO_DATA, _isLive: false };
    }

    const data = await res.json();
    return { ...data, _isLive: true };
  } catch (err) {
    console.warn("Backend unavailable, using mock hero data:", err);
    return { ...MOCK_HERO_DATA, _isLive: false };
  }
}

export async function fetchStandings(
  season?: number
): Promise<StandingsResponse & { _isLive?: boolean }> {
  try {
    const params = new URLSearchParams();
    if (season) params.set("season", season.toString());
    const query = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE_URL}/standings${query}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Backend responded with ${res.status}, falling back to mock standings.`);
      return {
        season: 2026,
        round: 12,
        drivers: MOCK_DRIVERS_STANDINGS,
        constructors: MOCK_CONSTRUCTORS_STANDINGS,
        _isLive: false,
      };
    }

    const raw = await res.json();

    // Normalize drivers with numbers, nationality, etc.
    const drivers: DriverStanding[] = (raw.drivers || []).map((d: any) => ({
      position: d.position,
      driver_code: d.driver_code,
      full_name: d.full_name,
      team_name: d.team_name || "Unknown",
      nationality: d.nationality || null,
      driver_number: d.driver_number || DRIVER_NUMBERS[d.driver_code] || 0,
      points: d.points || 0,
      wins: d.wins || 0,
      podiums: d.podiums || 0,
      delta_position: d.delta_position || 0,
    }));

    // Normalize constructors with lineup derived from drivers
    const constructors: ConstructorStanding[] = (raw.constructors || []).map((c: any) => {
      const teamName = c.name || c.team_name || "Unknown";
      const normName = teamName.toLowerCase();

      // Find driver codes matching this team
      const matchedDrivers = drivers
        .filter((d) => {
          const dTeam = d.team_name.toLowerCase();
          return (
            dTeam.includes(normName) ||
            normName.includes(dTeam) ||
            (normName.includes("red bull") && dTeam.includes("red bull")) ||
            (normName.includes("rb") && dTeam.includes("rb")) ||
            (normName.includes("cadillac") && dTeam.includes("cadillac"))
          );
        })
        .map((d) => d.driver_code);

      const driverCodes =
        matchedDrivers.length > 0
          ? matchedDrivers
          : DEFAULT_TEAM_DRIVERS[normName] || [];

      return {
        position: c.position,
        team_name: teamName,
        name: teamName,
        nationality: c.nationality || null,
        points: c.points || 0,
        wins: c.wins || 0,
        podiums: c.podiums || 0,
        delta_position: c.delta_position || 0,
        driver_codes: driverCodes,
      };
    });

    return {
      season: raw.season,
      round: raw.round,
      drivers,
      constructors,
      _isLive: true,
    };
  } catch (err) {
    console.warn("Backend unavailable, using mock standings:", err);
    return {
      season: 2026,
      round: 12,
      drivers: MOCK_DRIVERS_STANDINGS,
      constructors: MOCK_CONSTRUCTORS_STANDINGS,
      _isLive: false,
    };
  }
}

export async function fetchDriverStandings(): Promise<DriverStanding[]> {
  const standings = await fetchStandings();
  return standings.drivers;
}

export async function fetchConstructorStandings(): Promise<ConstructorStanding[]> {
  const standings = await fetchStandings();
  return standings.constructors;
}

export async function fetchSchedule(
  season?: number
): Promise<BackendScheduleResponse & { _isLive?: boolean }> {
  try {
    const params = new URLSearchParams();
    if (season) params.set("season", season.toString());
    const query = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE_URL}/schedule${query}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Backend responded with ${res.status}, falling back to static schedule.`);
      return {
        season: 2026,
        total_rounds: 24,
        current_round: 13,
        events: [],
        _isLive: false,
      };
    }

    const data: BackendScheduleResponse = await res.json();
    return { ...data, _isLive: true };
  } catch (err) {
    console.warn("Backend unavailable, using static schedule:", err);
    return {
      season: 2026,
      total_rounds: 24,
      current_round: 13,
      events: [],
      _isLive: false,
    };
  }
}

