import { TeamColorInfo } from "@/types/f1";

export const F1_TEAMS: Record<string, TeamColorInfo> = {
  "McLaren": {
    name: "McLaren",
    primary: "#FF8000",
    secondary: "#47C7FC",
    glow: "rgba(255, 128, 0, 0.4)",
    border: "rgba(255, 128, 0, 0.6)",
    text: "#FF9B30",
  },
  "Ferrari": {
    name: "Ferrari",
    primary: "#E8002D",
    secondary: "#FFF200",
    glow: "rgba(232, 0, 45, 0.4)",
    border: "rgba(232, 0, 45, 0.6)",
    text: "#FF3358",
  },
  "Red Bull Racing": {
    name: "Red Bull Racing",
    primary: "#3671C6",
    secondary: "#F596C8",
    glow: "rgba(54, 113, 198, 0.4)",
    border: "rgba(54, 113, 198, 0.6)",
    text: "#528DDE",
  },
  "Mercedes": {
    name: "Mercedes",
    primary: "#27F4D2",
    secondary: "#C8CCCE",
    glow: "rgba(39, 244, 210, 0.4)",
    border: "rgba(39, 244, 210, 0.6)",
    text: "#4EFCE0",
  },
  "Aston Martin": {
    name: "Aston Martin",
    primary: "#229971",
    secondary: "#CEDC00",
    glow: "rgba(34, 153, 113, 0.4)",
    border: "rgba(34, 153, 113, 0.6)",
    text: "#2EBF8E",
  },
  "Alpine": {
    name: "Alpine",
    primary: "#0093CC",
    secondary: "#FF87BC",
    glow: "rgba(0, 147, 204, 0.4)",
    border: "rgba(0, 147, 204, 0.6)",
    text: "#2EB6EB",
  },
  "Williams": {
    name: "Williams",
    primary: "#64C4FF",
    secondary: "#00A0DE",
    glow: "rgba(100, 196, 255, 0.4)",
    border: "rgba(100, 196, 255, 0.6)",
    text: "#80D0FF",
  },
  "RB": {
    name: "RB",
    primary: "#6692FF",
    secondary: "#FFFFFF",
    glow: "rgba(102, 146, 255, 0.4)",
    border: "rgba(102, 146, 255, 0.6)",
    text: "#85A9FF",
  },
  "Kick Sauber": {
    name: "Kick Sauber",
    primary: "#52E252",
    secondary: "#000000",
    glow: "rgba(82, 226, 82, 0.4)",
    border: "rgba(82, 226, 82, 0.6)",
    text: "#74EC74",
  },
  "Haas": {
    name: "Haas",
    primary: "#B6BABD",
    secondary: "#DA291C",
    glow: "rgba(182, 186, 189, 0.35)",
    border: "rgba(182, 186, 189, 0.6)",
    text: "#D0D3D6",
  },
  "Audi": {
    name: "Audi",
    primary: "#F01515",
    secondary: "#000000",
    glow: "rgba(240, 21, 21, 0.4)",
    border: "rgba(240, 21, 21, 0.6)",
    text: "#FF3333",
  },
  "Cadillac": {
    name: "Cadillac",
    primary: "#D4AF37",
    secondary: "#1E3A8A",
    glow: "rgba(212, 175, 55, 0.4)",
    border: "rgba(212, 175, 55, 0.6)",
    text: "#E5C158",
  },
};

export const DEFAULT_TEAM_COLOR: TeamColorInfo = {
  name: "ApexGrid",
  primary: "#D2FF00",
  secondary: "#00F0FF",
  glow: "rgba(210, 255, 0, 0.4)",
  border: "rgba(210, 255, 0, 0.6)",
  text: "#D2FF00",
};

export function getTeamColors(teamName?: string | null): TeamColorInfo {
  if (!teamName) return DEFAULT_TEAM_COLOR;
  
  const normalized = Object.keys(F1_TEAMS).find(
    (key) => teamName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(teamName.toLowerCase())
  );

  return normalized ? F1_TEAMS[normalized] : DEFAULT_TEAM_COLOR;
}
