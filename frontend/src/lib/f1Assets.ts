// Asset resolution mapping for drivers and constructor liveries

const DRIVER_CODE_TO_FILE: Record<string, string> = {
  NOR: "norris.png",
  VER: "verstappen.png",
  HAM: "hamilton.png",
  LEC: "leclerc.png",
  PIA: "piastri.png",
  RUS: "russell.png",
  ANT: "antonelli.png",
  ALO: "alonso.png",
  SAI: "sainz.png",
  ALB: "albon.png",
  GAS: "gasly.png",
  OCO: "ocon.png",
  HUL: "hulkenberg.png",
  BEA: "bearman.png",
  BOR: "bortoleto.png",
  BOT: "bottas.png",
  COL: "colapinto.png",
  HAD: "hadjar.png",
  LAW: "lawson.png",
  LIN: "lindblad.png",
  PER: "perez.png",
  STR: "stroll.png",
  TSU: "lawson.png", // fallback if driver file is missing
};

const TEAM_LIVERY_MAP: Record<string, string> = {
  mclaren: "/assets/liveries/mclaren.png",
  mercedes: "/assets/liveries/mercedes.png",
  ferrari: "/assets/liveries/ferrari.png",
  "red bull": "/assets/liveries/redbull.png",
  redbull: "/assets/liveries/redbull.png",
  "red bull racing": "/assets/liveries/redbull.png",
  "aston martin": "/assets/liveries/aston-martin.png",
  aston: "/assets/liveries/aston-martin.png",
  alpine: "/assets/liveries/alpine.png",
  williams: "/assets/liveries/williams.png",
  "racing bulls": "/assets/liveries/racingbulls.png",
  racingbulls: "/assets/liveries/racingbulls.png",
  rb: "/assets/liveries/racingbulls.png",
  vcarb: "/assets/liveries/racingbulls.png",
  "visa cash app": "/assets/liveries/racingbulls.png",
  "kick sauber": "/assets/liveries/kick.png",
  sauber: "/assets/liveries/kick.png",
  kick: "/assets/liveries/kick.png",
  haas: "/assets/liveries/haas.png",
  "haas f1 team": "/assets/liveries/haas.png",
  audi: "/assets/liveries/audi.png",
};

/**
 * Returns the path to the driver portrait image in /assets/driver-img/
 * Falls back to /assets/driver-winner.png if no match is found.
 */
export function getDriverImage(driverCode?: string | null, fullName?: string | null): string {
  if (driverCode) {
    const upperCode = driverCode.trim().toUpperCase();
    if (DRIVER_CODE_TO_FILE[upperCode]) {
      return `/assets/driver-img/${DRIVER_CODE_TO_FILE[upperCode]}`;
    }
  }

  if (fullName) {
    const parts = fullName.toLowerCase().trim().split(" ");
    const lastName = parts[parts.length - 1];
    for (const [code, file] of Object.entries(DRIVER_CODE_TO_FILE)) {
      if (file.replace(".png", "") === lastName) {
        return `/assets/driver-img/${file}`;
      }
    }
  }

  return "/assets/driver-winner.png";
}

/**
 * Returns the path to the car livery image in /assets/liveries/
 * Falls back to /assets/car-aero.png if no match is found.
 */
export function getTeamCarImage(teamName?: string | null): string {
  if (!teamName) return "/assets/car-aero.png";

  const normalized = teamName.toLowerCase().trim();
  const match = Object.keys(TEAM_LIVERY_MAP).find(
    (key) => normalized.includes(key) || key.includes(normalized)
  );

  return match ? TEAM_LIVERY_MAP[match] : "/assets/car-aero.png";
}
