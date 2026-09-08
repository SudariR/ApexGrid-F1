// ────────────────────────────────────────────────────────────
// ANALYTICS TYPES — mirrors backend Pydantic schemas exactly
// Source of truth: backend/app/models/schemas.py
// ────────────────────────────────────────────────────────────

// --- Pace Consistency ---------------------------------------------------

export interface PaceStats {
  count: number;
  mean_s: number;
  median_s: number;
  std_s: number;
  /** Coefficient of variation (%). Lower = more consistent. */
  cv_pct: number;
  q1_s: number;
  q3_s: number;
  min_s: number;
  max_s: number;
}

export interface KdePoint {
  lap_time_s: number;
  density: number;
}

export interface PaceResponse {
  season: number;
  round: number;
  event_name: string;
  driver_code: string;
  session_type: string;
  stats: PaceStats;
  kde: KdePoint[];
}

// --- Tyre Degradation ---------------------------------------------------

export interface TireStint {
  compound: string;
  stint: number;
  n_laps: number;
  slope_s_per_lap: number;
  intercept_s: number;
  r2: number;
}

export interface TireDegradationResponse {
  season: number;
  round: number;
  event_name: string;
  driver_code: string;
  session_type: string;
  stints: TireStint[];
}

// --- Teammate Head-to-Head + Elo ----------------------------------------

export interface DuelDriver {
  code: string;
  name: string;
}

export interface TeammateDuel {
  constructor_name: string;
  driver_a: DuelDriver;
  driver_b: DuelDriver;
  wins_a: number;
  wins_b: number;
  races: number;
  elo_a: number;
  elo_b: number;
}

export interface HeadToHeadResponse {
  season: number;
  as_of_round: number;
  duels: TeammateDuel[];
}

// --- Monte Carlo Predictor -----------------------------------------------

export interface DriverScenario {
  code: string;
  /** Pace rating override. Backend default spread: 0–2.0. Override range: 0–4.0. */
  rating?: number | null;
  /** Per-race DNF probability override. Range: 0.0–1.0. */
  dnf_probability?: number | null;
}

export interface PredictRequest {
  season?: number | null;
  /** Number of Monte Carlo runs. Backend: 100–500000. Default 10000. */
  n_simulations?: number;
  seed?: number | null;
  remaining_races?: number | null;
  overrides?: DriverScenario[];
}

export interface WinProbability {
  code: string;
  name?: string | null;
  /** Championship win probability (0–1). */
  win_probability: number;
}

export interface PredictResponse {
  season: number;
  as_of_round: number;
  remaining_races: number;
  n_simulations: number;
  drivers: WinProbability[];
  constructors: WinProbability[];
}

// --- UI-only helpers -----------------------------------------------------

export type SessionType = "FP1" | "FP2" | "FP3" | "Q" | "S" | "R";

export type SimTab = "WDC" | "WCC";

export interface DriverOverride extends DriverScenario {
  /** Display name — sourced from standings, not backend analytics */
  full_name: string;
  /** Team name for coloring */
  team_name: string;
}
