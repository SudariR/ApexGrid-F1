"use client";

import React from "react";

interface TimelineCircuitProps {
  trackPath: string;
  circuitName: string;
  status: "completed" | "current" | "upcoming";
  startFinish?: [number, number];
  cornerCount?: number;
  drsZones?: number;
  className?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  scale?: number;
}

export function TimelineCircuit({
  trackPath,
  circuitName,
  status,
  startFinish,
  cornerCount,
  drsZones,
  className = "",
  strokeWidth = 2.5,
  opacity = 1,
  rotation = 0,
  scale = 1,
}: TimelineCircuitProps) {
  // Determine stroke color and glow based on status
  const isCurrent = status === "current";
  const isCompleted = status === "completed";

  const strokeColor = isCurrent
    ? "#FF8000" // McLaren Papaya / Vibrant Accent
    : isCompleted
    ? "rgba(13, 13, 15, 0.45)" // Slightly greyed / faded completed circuit
    : "rgba(13, 13, 15, 0.22)"; // Muted upcoming circuit

  const filterId = `circuit-glow-${circuitName.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "center center",
        opacity,
      }}
    >
      <svg
        viewBox="0 0 400 320"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {isCurrent && (
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="6"
                floodColor="#FF8000"
                floodOpacity="0.4"
              />
            </filter>
          )}
        </defs>

        {/* Ambient track glow for current race */}
        {isCurrent && (
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255, 128, 0, 0.15)"
            strokeWidth={strokeWidth + 8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Secondary ghost underlay line */}
        <path
          d={trackPath}
          fill="none"
          stroke={
            isCurrent
              ? "rgba(255, 128, 0, 0.3)"
              : isCompleted
              ? "rgba(13, 13, 15, 0.12)"
              : "rgba(13, 13, 15, 0.08)"
          }
          strokeWidth={strokeWidth + 3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main real circuit geometry path */}
        <path
          d={trackPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={isCurrent ? `url(#${filterId})` : undefined}
          strokeDasharray={!isCompleted && !isCurrent ? "6 3" : undefined}
        />

        {/* Start / Finish line indicator */}
        {startFinish && (
          <g>
            <circle
              cx={startFinish[0]}
              cy={startFinish[1]}
              r={isCurrent ? 4.5 : 3.5}
              fill={isCurrent ? "#FF8000" : isCompleted ? "rgba(13, 13, 15, 0.5)" : "rgba(13, 13, 15, 0.3)"}
            />
            {isCurrent && (
              <circle
                cx={startFinish[0]}
                cy={startFinish[1]}
                r={8}
                fill="none"
                stroke="#FF8000"
                strokeWidth={1.5}
                className="animate-ping opacity-75"
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
