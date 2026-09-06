import { HeroResponse, DriverStanding, ConstructorStanding } from "@/types/f1";

export const MOCK_HERO_DATA: HeroResponse = {
  season: 2026,
  round: 12,
  event_name: "Dutch Grand Prix",
  country: "Netherlands",
  location: "Circuit Zandvoort",
  race_date: "2026-08-23",
  total_laps: 72,
  winner: {
    position: 1,
    driver_code: "NOR",
    full_name: "Lando Norris",
    team_name: "McLaren",
    driver_number: 4,
    grid_position: 1,
    status: "Finished",
    points: 26,
    finish_gap: "1:30:45.519"
  },
  podium: [
    {
      position: 1,
      driver_code: "NOR",
      full_name: "Lando Norris",
      team_name: "McLaren",
      driver_number: 4,
      grid_position: 1,
      status: "Finished",
      points: 26,
      finish_gap: "1:30:45.519"
    },
    {
      position: 2,
      driver_code: "PIA",
      full_name: "Oscar Piastri",
      team_name: "McLaren",
      driver_number: 81,
      grid_position: 3,
      status: "Finished",
      points: 18,
      finish_gap: "+0:04.281"
    },
    {
      position: 3,
      driver_code: "VER",
      full_name: "Max Verstappen",
      team_name: "Red Bull Racing",
      driver_number: 1,
      grid_position: 2,
      status: "Finished",
      points: 15,
      finish_gap: "+0:18.730"
    }
  ]
};

export const MOCK_DRIVERS_STANDINGS: DriverStanding[] = [
  {
    position: 1,
    driver_code: "NOR",
    full_name: "Lando Norris",
    team_name: "McLaren",
    driver_number: 4,
    points: 342,
    wins: 6,
    podiums: 13,
    delta_position: 0
  },
  {
    position: 2,
    driver_code: "PIA",
    full_name: "Oscar Piastri",
    team_name: "McLaren",
    driver_number: 81,
    points: 308,
    wins: 3,
    podiums: 11,
    delta_position: 1
  },
  {
    position: 3,
    driver_code: "VER",
    full_name: "Max Verstappen",
    team_name: "Red Bull Racing",
    driver_number: 1,
    points: 295,
    wins: 4,
    podiums: 10,
    delta_position: -1
  },
  {
    position: 4,
    driver_code: "LEC",
    full_name: "Charles Leclerc",
    team_name: "Ferrari",
    driver_number: 16,
    points: 248,
    wins: 2,
    podiums: 8,
    delta_position: 0
  },
  {
    position: 5,
    driver_code: "HAM",
    full_name: "Lewis Hamilton",
    team_name: "Ferrari",
    driver_number: 44,
    points: 215,
    wins: 1,
    podiums: 6,
    delta_position: 1
  },
  {
    position: 6,
    driver_code: "RUS",
    full_name: "George Russell",
    team_name: "Mercedes",
    driver_number: 63,
    points: 198,
    wins: 1,
    podiums: 5,
    delta_position: -1
  },
  {
    position: 7,
    driver_code: "ANT",
    full_name: "Kimi Antonelli",
    team_name: "Mercedes",
    driver_number: 12,
    points: 124,
    wins: 0,
    podiums: 2,
    delta_position: 0
  },
  {
    position: 8,
    driver_code: "ALO",
    full_name: "Fernando Alonso",
    team_name: "Aston Martin",
    driver_number: 14,
    points: 92,
    wins: 0,
    podiums: 1,
    delta_position: 0
  },
  {
    position: 9,
    driver_code: "TSU",
    full_name: "Yuki Tsunoda",
    team_name: "RB",
    driver_number: 22,
    points: 44,
    wins: 0,
    podiums: 0,
    delta_position: 1
  },
  {
    position: 10,
    driver_code: "ALB",
    full_name: "Alexander Albon",
    team_name: "Williams",
    driver_number: 23,
    points: 36,
    wins: 0,
    podiums: 0,
    delta_position: -1
  }
];

export const MOCK_CONSTRUCTORS_STANDINGS: ConstructorStanding[] = [
  {
    position: 1,
    team_name: "McLaren",
    points: 650,
    wins: 9,
    podiums: 24,
    delta_position: 0,
    driver_codes: ["NOR", "PIA"]
  },
  {
    position: 2,
    team_name: "Ferrari",
    points: 463,
    wins: 3,
    podiums: 14,
    delta_position: 0,
    driver_codes: ["LEC", "HAM"]
  },
  {
    position: 3,
    team_name: "Red Bull Racing",
    points: 395,
    wins: 4,
    podiums: 11,
    delta_position: 0,
    driver_codes: ["VER", "PER"]
  },
  {
    position: 4,
    team_name: "Mercedes",
    points: 322,
    wins: 1,
    podiums: 7,
    delta_position: 0,
    driver_codes: ["RUS", "ANT"]
  },
  {
    position: 5,
    team_name: "Aston Martin",
    points: 118,
    wins: 0,
    podiums: 1,
    delta_position: 0,
    driver_codes: ["ALO", "STR"]
  },
  {
    position: 6,
    team_name: "RB",
    points: 58,
    wins: 0,
    podiums: 0,
    delta_position: 1,
    driver_codes: ["TSU", "LAW"]
  },
  {
    position: 7,
    team_name: "Williams",
    points: 42,
    wins: 0,
    podiums: 0,
    delta_position: -1,
    driver_codes: ["ALB", "SAI"]
  },
  {
    position: 8,
    team_name: "Alpine",
    points: 31,
    wins: 0,
    podiums: 0,
    delta_position: 0,
    driver_codes: ["GAS", "DOO"]
  },
  {
    position: 9,
    team_name: "Haas",
    points: 29,
    wins: 0,
    podiums: 0,
    delta_position: 0,
    driver_codes: ["OCO", "BEA"]
  },
  {
    position: 10,
    team_name: "Kick Sauber",
    points: 12,
    wins: 0,
    podiums: 0,
    delta_position: 0,
    driver_codes: ["HUL", "BOR"]
  }
];
