"use client";

import React from "react";
import { motion } from "framer-motion";
import type { HeadToHeadResponse, TeammateDuel } from "@/types/analytics";
import { ConstructorLogo } from "@/components/ui/ConstructorLogo";
import { getTeamColors } from "@/lib/teamColors";
import { LoadingSkeleton, ErrorState } from "./analyticsUtils";

interface TeammateEloGridProps {
  data: HeadToHeadResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMsg?: string;
}

function DuelCard({ duel, index }: { duel: TeammateDuel; index: number }) {
  const colors = getTeamColors(duel.constructor_name);
  const total = duel.wins_a + duel.wins_b;
  const ratioA = total > 0 ? (duel.wins_a / total) * 100 : 50;
  const ratioB = total > 0 ? (duel.wins_b / total) * 100 : 50;
  const leadsA = duel.elo_a >= duel.elo_b;
  const eloDelta = Math.abs(duel.elo_a - duel.elo_b).toFixed(1);
  const leader = leadsA ? duel.driver_a : duel.driver_b;
  const leaderElo = leadsA ? duel.elo_a : duel.elo_b;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm overflow-hidden"
    >
      {/* Team header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: `2px solid ${colors.primary}25` }}
      >
        <ConstructorLogo teamName={duel.constructor_name} size={22} />
        <div>
          <div
            className="font-mono text-[8px] tracking-[0.18em] uppercase font-bold"
            style={{ color: colors.primary }}
          >
            {duel.constructor_name}
          </div>
          <div className="font-mono text-[8px] text-ink-light">{duel.races} qualifying sessions</div>
        </div>
      </div>

      {/* Drivers */}
      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Wins bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[9px] text-ink font-bold">{duel.driver_a.code}</span>
            <span className="font-mono text-[9px] text-ink-light uppercase tracking-widest">QUALIFYING WINS</span>
            <span className="font-mono text-[9px] text-ink font-bold">{duel.driver_b.code}</span>
          </div>
          <div className="h-2.5 flex rounded-full overflow-hidden bg-[rgba(13,13,15,0.06)]">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${ratioA}%`, backgroundColor: "#0D0D0F" }}
            />
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${ratioB}%`, backgroundColor: "#00FF66" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-display text-base font-bold text-ink" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {duel.wins_a}
            </span>
            <span className="font-mono text-[8px] text-ink-light">
              {ratioA.toFixed(0)}% / {ratioB.toFixed(0)}%
            </span>
            <span className="font-display text-base font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00FF66" }}>
              {duel.wins_b}
            </span>
          </div>
        </div>

        {/* Elo ratings */}
        <div className="grid grid-cols-2 gap-3 border-t border-[rgba(13,13,15,0.06)] pt-3">
          <div>
            <div className="font-mono text-[8px] tracking-[0.14em] text-ink-light uppercase mb-0.5">
              {duel.driver_a.code} ELO
            </div>
            <div
              className="font-display text-base font-bold text-ink"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {duel.elo_a.toFixed(0)}
            </div>
            <div className="font-mono text-[8px] text-ink-light truncate">{duel.driver_a.name}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[8px] tracking-[0.14em] text-ink-light uppercase mb-0.5">
              {duel.driver_b.code} ELO
            </div>
            <div
              className="font-display text-base font-bold"
              style={{ fontFamily: "'Orbitron', sans-serif", color: "#00FF66" }}
            >
              {duel.elo_b.toFixed(0)}
            </div>
            <div className="font-mono text-[8px] text-ink-light truncate">{duel.driver_b.name}</div>
          </div>
        </div>

        {/* Elo delta */}
        <div className="flex items-center justify-between pt-1">
          <div className="font-mono text-[8px] text-ink-light uppercase tracking-widest">Elo Gap</div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px] font-bold text-ink">{leader.code} leads by</span>
            <span
              className="font-mono text-[10px] font-bold"
              style={{ color: colors.primary }}
            >
              {eloDelta}
            </span>
            <span className="font-mono text-[8px] text-ink-light">pts</span>
          </div>
          <div className="font-mono text-[8px] text-ink-light">
            Rating: {leaderElo.toFixed(0)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TeammateEloGrid({ data, isLoading, isError, errorMsg }: TeammateEloGridProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (isError) {
    return (
      <ErrorState message={errorMsg ?? "Head-to-head data temporarily unavailable."} />
    );
  }
  if (!data || data.duels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase mb-2">NO DATA</div>
        <div className="font-display text-base font-bold text-ink-mid" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          No qualifying battles yet
        </div>
        <div className="font-mono text-[10px] text-ink-light mt-2">
          Data loads once qualifying sessions are completed.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase">
          {data.season} Season
        </span>
        <span className="font-mono text-[9px] text-ink-faint">·</span>
        <span className="font-mono text-[9px] text-ink-light">
          Through Round {data.as_of_round}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.duels.map((duel, i) => (
          <DuelCard
            key={`${duel.constructor_name}-${duel.driver_a.code}-${duel.driver_b.code}`}
            duel={duel}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
}
