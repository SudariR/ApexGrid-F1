"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { F1_2026_CALENDAR } from "@/lib/calendarData";

interface TrackMapProps {
  circuitName?: string;
  round?: number;
  className?: string;
  opacity?: number;
}

// Default fallback track path (Zandvoort)
const ZANDVOORT_PATH =
  "M 200 20 C 240 18 275 22 295 38 C 318 56 325 80 320 100 " +
  "C 315 120 300 130 290 148 C 280 166 278 180 285 195 " +
  "C 292 210 308 218 315 232 C 322 246 320 262 308 272 " +
  "C 295 282 275 284 255 282 C 235 280 215 272 195 268 " +
  "C 175 264 155 262 138 268 C 120 274 108 285 92 284 " +
  "C 76 283 62 274 56 260 C 50 246 54 228 62 214 " +
  "C 70 200 82 192 88 178 C 94 164 90 148 82 135 " +
  "C 74 122 60 114 54 100 C 48 86 52 68 64 54 " +
  "C 78 38 108 25 140 20 C 160 17 180 18 200 20 Z";

// Default Corner markers [x, y, label]
const CORNER_MARKERS: [number, number, string][] = [
  [295, 38, "T1"],
  [320, 100, "T3"],
  [290, 148, "T5"],
  [315, 232, "T9"],
  [255, 282, "T11"],
  [138, 268, "T13"],
  [56, 260, "T14"],
  [62, 214, "T16"],
  [54, 100, "T18"],
  [64, 54, "T1"],
];

// Sector boundary markers
const SECTOR_MARKERS: [number, number, number, string][] = [
  [295, 38, 0, "S1"],
  [285, 195, 0, "S2"],
  [138, 268, 0, "S3"],
];

export function TrackMap({ circuitName = "Zandvoort", round, className = "", opacity = 1 }: TrackMapProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<SVGSVGElement>(null);

  // Find matching circuit in calendar data (prioritize circuit / location name, fallback to round)
  const event = F1_2026_CALENDAR.find((e) => {
    if (circuitName) {
      const normName = circuitName.toLowerCase();
      if (
        e.location.toLowerCase().includes(normName) ||
        normName.includes(e.location.toLowerCase()) ||
        e.event_name.toLowerCase().includes(normName) ||
        normName.includes(e.event_name.toLowerCase()) ||
        e.circuit_name.toLowerCase().includes(normName) ||
        normName.includes(e.circuit_name.toLowerCase())
      ) {
        return true;
      }
    }
    if (round && e.round === round) return true;
    return false;
  });

  const trackPath = event?.track_path || ZANDVOORT_PATH;
  const startFinish = event?.start_finish || [195, 20];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!pathRef.current) return;

    // Get path length for stroke-dasharray
    const length = pathRef.current.getTotalLength();
    gsap.set(pathRef.current, {
      strokeDasharray: length,
      strokeDashoffset: length,
    });

    // Animate path draw on mount or path change
    gsap.to(pathRef.current, {
      strokeDashoffset: 0,
      duration: 2.5,
      ease: "power2.inOut",
      delay: 0.3,
    });

    // Subtle parallax on scroll
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        },
      });
    }
  }, [trackPath]);

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 400 310"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-label={`${circuitName} circuit map`}
    >
      {/* Background subtle track glow */}
      <path
        d={trackPath}
        fill="none"
        stroke="rgba(0,255,102,0.04)"
        strokeWidth="8"
      />

      {/* Main track outline — animated draw */}
      <path
        ref={pathRef}
        d={trackPath}
        fill="none"
        stroke="rgba(13,13,15,0.14)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner kerb line — offset inward, static */}
      <path
        d={trackPath}
        fill="none"
        stroke="rgba(13,13,15,0.05)"
        strokeWidth="0.5"
        transform="scale(0.94) translate(12, 9)"
      />

      {/* Start / Finish line */}
      <line
        x1={startFinish[0] - 5}
        y1={startFinish[1] - 4}
        x2={startFinish[0] + 5}
        y2={startFinish[1] - 4}
        stroke="rgba(0,255,102,0.7)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text
        x={startFinish[0] + 7}
        y={startFinish[1] - 1}
        fontSize="5"
        fill="rgba(0,255,102,0.6)"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.1em"
      >
        START/FINISH
      </text>

      {/* Corner markers */}
      {CORNER_MARKERS.slice(0, 6).map(([x, y, label], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.5" fill="rgba(13,13,15,0.25)" />
          <text
            x={x + 4}
            y={y + 2}
            fontSize="4.5"
            fill="rgba(13,13,15,0.35)"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.08em"
          >
            {label}
          </text>
        </g>
      ))}

      {/* Sector labels */}
      {SECTOR_MARKERS.map(([x, y, , label], i) => (
        <text
          key={i}
          x={x + 10}
          y={y}
          fontSize="5"
          fill="rgba(0,255,102,0.5)"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="0.15em"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
