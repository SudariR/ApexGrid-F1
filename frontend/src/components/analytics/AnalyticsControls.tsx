"use client";

import React from "react";
import { useTimelineData } from "@/lib/hooks/useTimelineData";
import { useDriverStandings } from "@/lib/hooks/useStandings";
import type { SessionType } from "@/types/analytics";

const SESSIONS: { label: string; value: SessionType }[] = [
  { label: "Race", value: "R" },
  { label: "Qualifying", value: "Q" },
  { label: "Sprint", value: "S" },
  { label: "FP1", value: "FP1" },
  { label: "FP2", value: "FP2" },
  { label: "FP3", value: "FP3" },
];

interface AnalyticsControlsProps {
  selectedRound: number | null;
  onRoundChange: (round: number) => void;
  selectedDriver: string | null;
  onDriverChange: (code: string) => void;
  compareDriver: string | null;
  onCompareDriverChange: (code: string | null) => void;
  selectedSession: SessionType;
  onSessionChange: (session: SessionType) => void;
  onAnalyze: () => void;
  isLoading?: boolean;
}

export function AnalyticsControls({
  selectedRound,
  onRoundChange,
  selectedDriver,
  onDriverChange,
  compareDriver,
  onCompareDriverChange,
  selectedSession,
  onSessionChange,
  onAnalyze,
  isLoading,
}: AnalyticsControlsProps) {
  const { events, isLoading: schedLoading } = useTimelineData();
  const { drivers, isLoading: driversLoading } = useDriverStandings();

  const completedEvents = events.filter((e) => e.status === "completed" || e.status === "current");
  const driverList = drivers ?? [];

  return (
    <div className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm p-4 md:p-5">
      <div className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase mb-4">
        Race · Driver · Session Selection
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Race / Round selector */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[8px] tracking-[0.16em] text-ink-light uppercase">
            Race
          </label>
          <select
            value={selectedRound ?? ""}
            onChange={(e) => onRoundChange(parseInt(e.target.value))}
            disabled={schedLoading}
            className="bg-[rgba(13,13,15,0.03)] border border-[rgba(13,13,15,0.12)] rounded-sm px-3 py-2 font-mono text-[10px] text-ink focus:outline-none focus:border-ink transition-colors cursor-pointer"
          >
            <option value="" disabled>
              {schedLoading ? "Loading…" : "Select race"}
            </option>
            {completedEvents.map((ev) => (
              <option key={ev.round} value={ev.round}>
                Rd {ev.round} — {ev.event_name}
              </option>
            ))}
          </select>
        </div>

        {/* Primary driver selector */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[8px] tracking-[0.16em] text-ink-light uppercase">
            Driver
          </label>
          <select
            value={selectedDriver ?? ""}
            onChange={(e) => onDriverChange(e.target.value)}
            disabled={driversLoading}
            className="bg-[rgba(13,13,15,0.03)] border border-[rgba(13,13,15,0.12)] rounded-sm px-3 py-2 font-mono text-[10px] text-ink focus:outline-none focus:border-ink transition-colors cursor-pointer"
          >
            <option value="" disabled>
              {driversLoading ? "Loading…" : "Select driver"}
            </option>
            {driverList.map((d) => (
              <option key={d.driver_code} value={d.driver_code}>
                {d.driver_code} — {d.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Compare driver (optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[8px] tracking-[0.16em] text-ink-light uppercase">
            Compare Driver <span className="text-ink-faint">(optional)</span>
          </label>
          <select
            value={compareDriver ?? ""}
            onChange={(e) => onCompareDriverChange(e.target.value || null)}
            disabled={driversLoading}
            className="bg-[rgba(13,13,15,0.03)] border border-[rgba(13,13,15,0.12)] rounded-sm px-3 py-2 font-mono text-[10px] text-ink focus:outline-none focus:border-ink transition-colors cursor-pointer"
          >
            <option value="">None</option>
            {driverList
              .filter((d) => d.driver_code !== selectedDriver)
              .map((d) => (
                <option key={d.driver_code} value={d.driver_code}>
                  {d.driver_code} — {d.full_name}
                </option>
              ))}
          </select>
        </div>

        {/* Session selector */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[8px] tracking-[0.16em] text-ink-light uppercase">
            Session
          </label>
          <div className="grid grid-cols-3 gap-1">
            {SESSIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => onSessionChange(s.value)}
                className={`py-1.5 font-mono text-[8px] font-bold border rounded-sm transition-colors ${
                  selectedSession === s.value
                    ? "bg-ink text-accent border-ink"
                    : "bg-white text-ink border-[rgba(13,13,15,0.12)] hover:border-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analyze button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={!selectedRound || !selectedDriver || isLoading}
          className={`px-8 py-2.5 font-display font-bold text-xs tracking-[0.14em] uppercase border transition-all duration-200 rounded-sm ${
            !selectedRound || !selectedDriver || isLoading
              ? "bg-[rgba(13,13,15,0.04)] text-ink-light border-[rgba(13,13,15,0.1)] cursor-not-allowed"
              : "bg-ink text-bg border-ink hover:bg-accent hover:text-ink hover:border-accent"
          }`}
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {isLoading ? "ANALYZING…" : "ANALYZE"}
        </button>
      </div>
    </div>
  );
}
