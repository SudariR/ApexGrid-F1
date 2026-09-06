"use client";

import React from "react";

interface Annotation {
  id: string;
  label: string;
  value: string;
  // Percentage positions relative to the annotation container
  x: number;
  y: number;
  // Line direction: vector to draw from x,y
  lineEndX: number;
  lineEndY: number;
  align: "left" | "right";
}

interface CarSpatialAnnotationProps {
  fastestLap?: string | null;
  totalTime?: string | null;
  laps?: number | null;
  pitStops?: number;
  position?: number;
  gridPosition?: number | null;
  team?: string;
  circuit?: string;
  points?: number | null;
  className?: string;
}

export function CarSpatialAnnotation({
  fastestLap,
  totalTime,
  laps,
  pitStops = 2,
  gridPosition,
  points,
  circuit = "Zandvoort",
  className = "",
}: CarSpatialAnnotationProps) {
  const annotations: Annotation[] = [
    // 1. FRONT WING: Fastest Lap or Race Distance Laps
    ...(fastestLap
      ? [
          {
            id: "fastest-lap",
            label: "FASTEST LAP",
            value: fastestLap,
            x: -8,
            y: 52,
            lineEndX: 14,
            lineEndY: 54.5,
            align: "left" as const,
          },
        ]
      : laps
      ? [
          {
            id: "race-laps",
            label: "RACE DISTANCE",
            value: `${laps} LAPS`,
            x: -8,
            y: 52,
            lineEndX: 14,
            lineEndY: 54.5,
            align: "left" as const,
          },
        ]
      : []),

    // 2. TOTAL TIME — top area in clean negative space above halo/cockpit
    ...(totalTime
      ? [
          {
            id: "total-time",
            label: "TOTAL TIME",
            value: totalTime,
            x: 46,
            y: 6,
            lineEndX: 56,
            lineEndY: 28,
            align: "left" as const,
          },
        ]
      : []),

    // 3. POINTS / PIT STOPS — right area next to rear tyre
    ...(points !== undefined && points !== null
      ? [
          {
            id: "points-scored",
            label: "POINTS SCORED",
            value: `+${points} PTS`,
            x: 95,
            y: 42,
            lineEndX: 84,
            lineEndY: 44,
            align: "right" as const,
          },
        ]
      : [
          {
            id: "pit-stops",
            label: "PIT STOPS",
            value: `${pitStops}x`,
            x: 95,
            y: 42,
            lineEndX: 84,
            lineEndY: 44,
            align: "right" as const,
          },
        ]),
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Subtle, elegant SVG leader lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {annotations.map((ann) => (
          <g key={ann.id}>
            {/* Origin dot on chassis reference coordinate */}
            <circle
              cx={ann.lineEndX}
              cy={ann.lineEndY}
              r="0.4"
              fill="rgba(13,13,15,0.25)"
            />
            {/* Thin subtle leader line */}
            <line
              x1={ann.lineEndX}
              y1={ann.lineEndY}
              x2={ann.x + (ann.align === "right" ? 6 : -0.5)}
              y2={ann.y + 2.5}
              stroke="rgba(13,13,15,0.18)"
              strokeWidth="0.35"
            />
            {/* Terminus dot at text baseline */}
            <circle
              cx={ann.x + (ann.align === "right" ? 6 : -0.5)}
              cy={ann.y + 2.5}
              r="0.4"
              fill="rgba(13,13,15,0.2)"
            />
          </g>
        ))}
      </svg>

      {/* 4 Clean text labels in negative space */}
      {annotations.map((ann) => (
        <div
          key={ann.id}
          className="absolute pointer-events-none"
          style={{
            left: `${ann.x}%`,
            top: `${ann.y}%`,
            transform:
              ann.align === "right"
                ? "translateX(-100%)"
                : "translateX(0)",
            textAlign: ann.align,
          }}
        >
          <div className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase leading-tight">
            {ann.label}
          </div>
          <div className="font-mono font-bold text-xs tracking-wide text-ink-mid leading-tight mt-0.5">
            {ann.value}
          </div>
        </div>
      ))}
    </div>
  );
}
