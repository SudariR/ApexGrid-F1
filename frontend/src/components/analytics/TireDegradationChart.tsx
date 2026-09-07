"use client";

import React from "react";
import { motion } from "framer-motion";
import type { TireDegradationResponse, TireStint } from "@/types/analytics";
import { formatLapTime, formatSlope, compoundColor, compoundLabel, LoadingSkeleton, ErrorState, EmptyState } from "./analyticsUtils";

interface TireDegradationChartProps {
  data: TireDegradationResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMsg?: string;
  onRetry?: () => void;
}

function StintCard({ stint, index }: { stint: TireStint; index: number }) {
  const color = compoundColor(stint.compound);
  const label = compoundLabel(stint.compound);
  const isDegrading = stint.slope_s_per_lap > 0;
  const r2Good = stint.r2 >= 0.7;

  // Derived: projected total lap time loss over the stint (slope × laps)
  const projectedLoss = stint.slope_s_per_lap * stint.n_laps;

  // R² bar width (0–100)
  const r2Width = Math.min(100, Math.round(stint.r2 * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: `2px solid ${color}20` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
          <div>
            <div className="font-mono text-[9px] tracking-[0.15em] text-ink-light uppercase">
              {stint.compound} · Stint {stint.stint}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] text-ink-light">
            {stint.n_laps} laps
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="px-4 py-3 grid grid-cols-2 gap-y-3 gap-x-4">
        {/* Degradation rate */}
        <div>
          <div className="font-mono text-[8px] tracking-[0.15em] text-ink-light uppercase mb-0.5">
            Degradation
          </div>
          <div
            className="font-display text-base font-bold"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: isDegrading ? "#E8002D" : "#22C55E",
            }}
          >
            {formatSlope(stint.slope_s_per_lap)}
          </div>
        </div>

        {/* Intercept (effective base lap time) */}
        <div>
          <div className="font-mono text-[8px] tracking-[0.15em] text-ink-light uppercase mb-0.5">
            Base Lap
          </div>
          <div
            className="font-display text-base font-bold text-ink"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {formatLapTime(stint.intercept_s)}
          </div>
        </div>

        {/* Projected loss — derived */}
        <div className="col-span-2">
          <div className="font-mono text-[8px] tracking-[0.15em] text-ink-light uppercase mb-0.5">
            Projected total loss <span className="text-ink-faint">(derived: slope × laps)</span>
          </div>
          <div
            className="font-mono text-sm font-bold"
            style={{ color: isDegrading ? "#E8002D" : "#22C55E" }}
          >
            {isDegrading ? "+" : ""}{projectedLoss.toFixed(2)}s over {stint.n_laps} laps
          </div>
        </div>

        {/* R² bar */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div className="font-mono text-[8px] tracking-[0.15em] text-ink-light uppercase">
              Model Fit (R²)
            </div>
            <div
              className={`font-mono text-[9px] font-bold ${r2Good ? "text-[#22C55E]" : "text-ink-mid"}`}
            >
              {stint.r2.toFixed(3)}
            </div>
          </div>
          <div className="h-1.5 bg-[rgba(13,13,15,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${r2Width}%`,
                backgroundColor: r2Good ? "#22C55E" : "#FFC906",
              }}
            />
          </div>
          <div className="font-mono text-[8px] text-ink-faint mt-0.5">
            {r2Good ? "Good fit — reliable estimate" : "Low fit — interpret with caution"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TireDegradationChart({
  data,
  isLoading,
  isError,
  errorMsg,
  onRetry,
}: TireDegradationChartProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message={errorMsg ?? "Tyre degradation data unavailable."} onRetry={onRetry} />;
  if (!data) {
    return (
      <EmptyState
        message="No data loaded"
        hint="Select a driver and race, then click Analyze."
      />
    );
  }
  if (data.stints.length === 0) {
    return (
      <EmptyState
        message="No stint data available"
        hint="This session may not have sufficient laps for degradation analysis."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      {/* Event badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase">
          {data.event_name}
        </span>
        <span className="font-mono text-[9px] text-ink-faint">·</span>
        <span className="font-mono text-[9px] tracking-[0.15em] text-ink-light uppercase">
          {data.driver_code}
        </span>
        <span className="font-mono text-[9px] text-ink-faint">· SESSION {data.session_type}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.stints.map((stint, i) => (
          <StintCard key={`${stint.compound}-${stint.stint}`} stint={stint} index={i} />
        ))}
      </div>

      <div className="font-mono text-[8px] text-ink-faint tracking-wide border-t border-[rgba(13,13,15,0.06)] pt-3">
        Degradation = linear regression of lap time vs tyre age across clean laps.
        Projected loss is derived (slope × n_laps) and not provided by the backend.
      </div>
    </motion.div>
  );
}
