"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PredictResponse, SimTab, WinProbability } from "@/types/analytics";
import { getTeamColors } from "@/lib/teamColors";
import { LoadingSkeleton, ErrorState } from "@/components/analytics/analyticsUtils";

interface SimulationDashboardProps {
  baseline: PredictResponse | null;
  scenario: PredictResponse | null;
  isLoading: boolean;
  isError: boolean;
  errorMsg?: string;
}

function ProbabilityRow({
  item,
  baselineItem,
  maxProb,
  index,
  tab,
}: {
  item: WinProbability;
  baselineItem?: WinProbability;
  maxProb: number;
  index: number;
  tab: SimTab;
}) {
  const colors = tab === "WCC" ? getTeamColors(item.name ?? item.code) : null;
  const barColor = colors?.primary ?? "#0D0D0F";
  const pct = maxProb > 0 ? (item.win_probability / maxProb) * 100 : 0;
  const winPct = (item.win_probability * 100).toFixed(1);

  // Delta vs baseline
  const delta =
    baselineItem != null
      ? ((item.win_probability - baselineItem.win_probability) * 100).toFixed(1)
      : null;
  const deltaNum = delta != null ? parseFloat(delta) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-center gap-3 py-2 border-b border-[rgba(13,13,15,0.05)] last:border-0"
    >
      {/* Position */}
      <span className="font-mono text-[9px] text-ink-light w-5 flex-shrink-0 text-right">
        {index + 1}
      </span>

      {/* Code + name */}
      <div className="w-24 flex-shrink-0">
        <div className="font-mono text-[10px] font-bold text-ink">{item.code}</div>
        {item.name && (
          <div className="font-mono text-[8px] text-ink-light truncate">{item.name}</div>
        )}
      </div>

      {/* Bar */}
      <div className="flex-1 h-2 bg-[rgba(13,13,15,0.06)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
          style={{ backgroundColor: barColor }}
        />
      </div>

      {/* Probability */}
      <div className="flex items-center gap-1.5 flex-shrink-0 w-20 justify-end">
        <span
          className="font-display text-sm font-bold"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {winPct}%
        </span>
        {delta !== null && deltaNum !== 0 && (
          <span
            className={`font-mono text-[8px] font-bold ${
              deltaNum > 0 ? "text-[#22C55E]" : "text-[#EF4444]"
            }`}
          >
            {deltaNum > 0 ? "▲" : "▼"} {Math.abs(deltaNum).toFixed(1)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function SimulationDashboard({
  baseline,
  scenario,
  isLoading,
  isError,
  errorMsg,
}: SimulationDashboardProps) {
  const [tab, setTab] = useState<SimTab>("WDC");

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message={errorMsg ?? "Simulation failed. Please retry."} />;
  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase mb-2">
          AWAITING SIMULATION
        </div>
        <div
          className="font-display text-base font-bold text-ink-mid"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Configure scenario and run
        </div>
        <div className="font-mono text-[10px] text-ink-light mt-2">
          Results will appear here after simulation completes.
        </div>
      </div>
    );
  }

  const displayData = tab === "WDC" ? scenario.drivers : scenario.constructors;
  const baselineData = tab === "WDC" ? baseline?.drivers : baseline?.constructors;
  const maxProb = Math.max(...displayData.map((d) => d.win_probability), 0.001);

  const baselineByCode = baselineData
    ? Object.fromEntries(baselineData.map((d) => [d.code, d]))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      {/* Simulation metadata */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[9px] text-ink-light uppercase tracking-widest">
          {scenario.n_simulations.toLocaleString()} simulations
        </span>
        <span className="font-mono text-[9px] text-ink-faint">·</span>
        <span className="font-mono text-[9px] text-ink-light">
          {scenario.remaining_races} races remaining
        </span>
        <span className="font-mono text-[9px] text-ink-faint">·</span>
        <span className="font-mono text-[9px] text-ink-light">
          Through Round {scenario.as_of_round}
        </span>
        {baselineByCode && (
          <>
            <span className="font-mono text-[9px] text-ink-faint">·</span>
            <span className="font-mono text-[9px] text-[#22C55E] tracking-widest">▲▼ vs BASELINE</span>
          </>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex border border-[rgba(13,13,15,0.12)] rounded-sm overflow-hidden w-fit">
        {(["WDC", "WCC"] as SimTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 font-mono text-[9px] font-bold tracking-[0.14em] uppercase transition-colors duration-200 ${
              tab === t ? "bg-ink text-accent" : "bg-white text-ink hover:bg-[rgba(13,13,15,0.04)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Probability list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm px-4 py-3"
        >
          <div className="flex items-center gap-3 pb-2 border-b border-[rgba(13,13,15,0.06)] mb-1">
            <span className="font-mono text-[8px] text-ink-light w-5" />
            <span className="font-mono text-[8px] text-ink-light w-24">DRIVER / TEAM</span>
            <span className="font-mono text-[8px] text-ink-light flex-1">PROBABILITY</span>
            <span className="font-mono text-[8px] text-ink-light w-20 text-right">WIN %</span>
          </div>
          {displayData.map((item, i) => (
            <ProbabilityRow
              key={item.code}
              item={item}
              baselineItem={baselineByCode?.[item.code]}
              maxProb={maxProb}
              index={i}
              tab={tab}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="font-mono text-[8px] text-ink-faint tracking-wide border-t border-[rgba(13,13,15,0.06)] pt-3">
        Results from Monte Carlo simulation. Win probability = fraction of simulated seasons in which
        the driver/constructor finishes with the most points. Not a guaranteed forecast.
      </div>
    </motion.div>
  );
}
