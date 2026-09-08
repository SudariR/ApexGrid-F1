"use client";

import React from "react";
import { Info } from "lucide-react";
import type { DriverOverride, PredictRequest } from "@/types/analytics";
import { DriverOverrideCard } from "./DriverOverrideCard";

type Preset = "current" | "reliability-nightmare" | "challenger-surge";

interface ScenarioControlsProps {
  overrides: DriverOverride[];
  onRatingChange: (code: string, value: number) => void;
  onDnfChange: (code: string, value: number) => void;
  onApplyPreset: (preset: Preset) => void;
  nSimulations: number;
  onNSimChange: (n: number) => void;
  remainingRaces: number;
  onRemainingRacesChange: (n: number) => void;
  onRun: () => void;
  isRunning: boolean;
  buildRequest: () => PredictRequest;
}

const PRESET_DESCRIPTIONS: Record<Preset, string> = {
  "current": "Use current championship standings as baseline. No modifications.",
  "reliability-nightmare": "All drivers face elevated DNF risk (15%). Chaos ensues.",
  "challenger-surge": "Midfield drivers get a +0.5 pace rating boost. Can they challenge?",
};

const SIM_OPTIONS = [
  { label: "1K", value: 1000 },
  { label: "10K", value: 10000 },
  { label: "50K", value: 50000 },
];

export function ScenarioControls({
  overrides,
  onRatingChange,
  onDnfChange,
  onApplyPreset,
  nSimulations,
  onNSimChange,
  remainingRaces,
  onRemainingRacesChange,
  onRun,
  isRunning,
}: ScenarioControlsProps) {
  const [activePreset, setActivePreset] = React.useState<Preset>("current");
  const [showInfo, setShowInfo] = React.useState(false);

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    onApplyPreset(preset);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Presets */}
      <div>
        <div className="font-mono text-[9px] tracking-[0.18em] text-ink-light uppercase mb-3">
          Scenario Presets
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {(["current", "reliability-nightmare", "challenger-surge"] as Preset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className={`flex-1 px-3 py-2.5 text-left border transition-all duration-200 rounded-sm ${activePreset === preset
                  ? "bg-ink text-bg border-ink"
                  : "bg-white text-ink border-[rgba(13,13,15,0.12)] hover:border-ink"
                }`}
            >
              <div className={`font-mono text-[9px] font-bold tracking-[0.14em] uppercase ${activePreset === preset ? "text-accent" : "text-ink"}`}>
                {preset === "current" ? "Current Trajectory" : preset === "reliability-nightmare" ? "Reliability Nightmare" : "Challenger Surge"}
              </div>
              <div className={`font-mono text-[8px] mt-0.5 ${activePreset === preset ? "text-[rgba(240,240,236,0.6)]" : "text-ink-light"}`}>
                {PRESET_DESCRIPTIONS[preset]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Simulation parameters */}
      <div className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm px-4 py-3">
        <div className="font-mono text-[9px] tracking-[0.18em] text-ink-light uppercase mb-3">
          Simulation Parameters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monte Carlo runs */}
          <div>
            <div className="font-mono text-[8px] tracking-[0.14em] text-ink-light uppercase mb-2">
              Simulations
            </div>
            <div className="flex gap-2">
              {SIM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onNSimChange(opt.value)}
                  className={`flex-1 py-1.5 font-mono text-[10px] font-bold border transition-colors rounded-sm ${nSimulations === opt.value
                      ? "bg-ink text-accent border-ink"
                      : "bg-white text-ink border-[rgba(13,13,15,0.15)] hover:border-ink"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remaining races override */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[8px] tracking-[0.14em] text-ink-light uppercase">
                Remaining Races
              </span>
              <span className="font-mono text-[10px] font-bold text-ink">{remainingRaces}</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={remainingRaces}
              onChange={(e) => onRemainingRacesChange(parseInt(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: "#0D0D0F" }}
            />
            <div className="flex justify-between font-mono text-[7px] text-ink-faint mt-0.5">
              <span>0</span><span>24</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-driver overrides */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-[0.18em] text-ink-light uppercase">
              Per-Driver Overrides
            </span>
            <button
              type="button"
              onClick={() => setShowInfo((prev) => !prev)}
              className="inline-flex items-center gap-1 font-mono text-[8px] text-ink-mid hover:text-ink bg-[rgba(13,13,15,0.04)] hover:bg-[rgba(13,13,15,0.08)] border border-[rgba(13,13,15,0.08)] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              title="Click to view what Pace Rating and DNF Risk do"
            >
              <Info size={11} className="text-ink-mid" />
              <span className="uppercase tracking-wider font-semibold">{showInfo ? "Hide Info" : "Parameters Info"}</span>
            </button>
          </div>
        </div>

        {/* Info tab for non-F1 users */}
        {showInfo && (
          <div className="mb-3 p-3 bg-white border border-[rgba(13,13,15,0.12)] rounded-sm text-ink shadow-sm">
            <div className="font-mono text-[8px] tracking-[0.14em] text-ink font-bold uppercase mb-1.5">
              Quick Guide for Simulation Parameters
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] leading-relaxed text-ink-mid">
              <div className="p-2 bg-[rgba(13,13,15,0.03)] rounded-sm border border-[rgba(13,13,15,0.05)]">
                <span className="font-mono font-bold text-ink text-[10px] uppercase block mb-0.5">
                  Pace Rating (0.0 – 4.0)
                </span>
                Controls car & driver performance multiplier. Higher rating = faster lap times, better race positions, and more race victories (1.00 is baseline).
              </div>
              <div className="p-2 bg-[rgba(13,13,15,0.03)] rounded-sm border border-[rgba(13,13,15,0.05)]">
                <span className="font-mono font-bold text-ink text-[10px] uppercase block mb-0.5">
                  DNF Risk (0% – 50%)
                </span>
                &quot;Did Not Finish&quot; probability (crashes, mechanical or engine failures). Higher percentage = more frequent race retirements with zero points scored.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {overrides.map((ov) => (
            <DriverOverrideCard
              key={ov.code}
              override={ov}
              onRatingChange={onRatingChange}
              onDnfChange={onDnfChange}
            />
          ))}
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className={`w-full py-4 font-display font-bold text-sm tracking-[0.12em] uppercase transition-all duration-300 border ${isRunning
            ? "bg-[rgba(13,13,15,0.05)] text-ink-light border-[rgba(13,13,15,0.1)] cursor-not-allowed"
            : "bg-ink text-bg border-ink hover:bg-accent hover:text-ink hover:border-accent"
          }`}
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        {isRunning
          ? "RUNNING SIMULATION…"
          : `RUN ${nSimulations.toLocaleString()} SIMULATIONS`}
      </button>
    </div>
  );
}
