"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getTeamColors } from "@/lib/teamColors";

interface ConstructorLogoProps {
  teamName: string;
  className?: string;
  size?: number;
}

// Map all 10 F1 constructor team names strictly to the user's files in public/assets/team-logo/
const TEAM_LOGO_MAP: Record<string, string> = {
  "mclaren": "/assets/team-logo/mclaren.png",
  "ferrari": "/assets/team-logo/ferrari.png",
  "red bull": "/assets/team-logo/redbull.png",
  "redbull": "/assets/team-logo/redbull.png",
  "red bull racing": "/assets/team-logo/redbull.png",
  "mercedes": "/assets/team-logo/mercedes.png",
  "aston martin": "/assets/team-logo/aston-martin.png",
  "aston": "/assets/team-logo/aston-martin.png",
  "alpine": "/assets/team-logo/alpine.png",
  "williams": "/assets/team-logo/williams.png",
  "racing bulls": "/assets/team-logo/racingbulls.png",
  "racingbulls": "/assets/team-logo/racingbulls.png",
  "rb": "/assets/team-logo/racingbulls.png",
  "vcarb": "/assets/team-logo/racingbulls.png",
  "visa cash app": "/assets/team-logo/racingbulls.png",
  "kick sauber": "/assets/team-logo/kick.png",
  "sauber": "/assets/team-logo/kick.png",
  "kick": "/assets/team-logo/kick.png",
  "haas": "/assets/team-logo/haas.png",
  "haas f1 team": "/assets/team-logo/haas.png",
  "audi": "/assets/team-logo/audi.png",
  "cadillac": "/assets/team-logo/cadillac.png",
  "cadillac f1": "/assets/team-logo/cadillac.png",
  "cadillac f1 team": "/assets/team-logo/cadillac.png",
  "cadillac racing": "/assets/team-logo/cadillac.png",
};

export function ConstructorLogo({
  teamName,
  className = "",
  size = 28,
}: ConstructorLogoProps) {
  const [imgError, setImgError] = useState(false);
  const normalized = teamName.toLowerCase().trim();
  const colors = getTeamColors(teamName);

  // Find matching logo path
  const logoKey = Object.keys(TEAM_LOGO_MAP).find((key) =>
    normalized.includes(key) || key.includes(normalized)
  );
  const logoPath = logoKey ? TEAM_LOGO_MAP[logoKey] : null;

  if (logoPath && !imgError) {
    // Determine aspect ratio scaling based on team logo shape
    const isWide = normalized.includes("aston") || normalized.includes("red bull") || normalized.includes("audi") || normalized.includes("alpine") || normalized.includes("cadillac");
    const isSquareOrRound = normalized.includes("mercedes") || normalized.includes("haas") || normalized.includes("williams") || normalized.includes("kick") || normalized.includes("rb") || normalized.includes("racing");
    const isFerrari = normalized.includes("ferrari");

    const width = isFerrari ? size * 0.85 : isWide ? size * 1.5 : isSquareOrRound ? size : size * 1.2;
    const height = size;

    return (
      <div
        className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        title={teamName}
      >
        <Image
          src={logoPath}
          alt={`${teamName} logo`}
          width={Math.round(width * 2)}
          height={Math.round(height * 2)}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          priority
        />
      </div>
    );
  }

  // Clean fallback if file is not found
  return (
    <div
      className={`rounded-full flex items-center justify-center text-[9px] font-mono font-bold text-bg flex-shrink-0 ${className}`}
      style={{
        width: `${size * 0.8}px`,
        height: `${size * 0.8}px`,
        backgroundColor: colors.primary,
      }}
      title={teamName}
    >
      {teamName.charAt(0)}
    </div>
  );
}
