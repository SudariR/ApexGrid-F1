export interface PodiumDriver {
  position: number;
  driver_code: string;
  full_name: string;
  team_name: string;
  driver_number?: number | null;
  grid_position?: number | null;
  status?: string | null;
  points?: number | null;
  finish_gap?: string | null;
}

export interface HeroResponse {
  season: number;
  round: number;
  event_name: string;
  country: string;
  location: string;
  race_date: string;
  total_laps?: number | null;
  winner: PodiumDriver;
  podium: PodiumDriver[];
}

export interface DriverStanding {
  position: number;
  driver_code: string;
  full_name: string;
  team_name: string;
  driver_number?: number;
  nationality?: string | null;
  points: number;
  wins: number;
  podiums?: number;
  delta_position?: number; // e.g. +1, -1, 0 compared to last race
  avatar_url?: string;
}

export interface ConstructorStanding {
  position: number;
  team_name: string;
  name?: string;
  nationality?: string | null;
  points: number;
  wins: number;
  podiums?: number;
  delta_position?: number;
  driver_codes: string[];
  car_slug?: string;
}

export interface StandingsResponse {
  season: number;
  round: number;
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}

export interface TeamColorInfo {
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  border: string;
  text: string;
}
