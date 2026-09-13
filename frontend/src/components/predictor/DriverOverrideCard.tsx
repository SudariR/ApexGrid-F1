"use client";

import React from "react";
import type { DriverOverride } from "@/types/analytics";
import { getTeamColors } from "@/lib/teamColors";
import { ConstructorLogo } from "@/components/ui/ConstructorLogo";

interface DriverOverrideCardProps {
  override: DriverOverride;
  onRatingChange: (code: string, value: number) => void;
  onDnfChange: (code: string, value: number) => void;
}

export function DriverOverrideCard({ override, onRatingChange, onDnfChange }: DriverOverrideCardProps) {
  const colors = getTeamColors(override.team_name);
  const rating = override.rating ?? 1.0;
  const dnf = override.dnf_probability ?? 0.05;

  return (
    <div className="group bg-white border border-[rgba(13,13,15,0.08)] rounded-sm overflow-hidden hover:border-[rgba(13,13,15,0.2)] transition-colors">
      {/* Driver header */}
      <div
        className="px-3 py-2 flex items-center gap-2.5 overflow-hidden"
        style={{ borderBottom: `2px solid ${colors.primary}25` }}
      >
        <ConstructorLogo teamName={override.team_name} size={18} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] font-bold text-ink leading-tight">{override.code}</div>
          <div className="relative overflow-hidden w-full" title={override.full_name}>
            <span className="font-mono text-[7.5px] text-ink-light whitespace-nowrap inline-block transition-transform duration-700 ease-in-out group-hover:-translate-x-1/3">
              {override.full_name}
            </span>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="px-3 py-2.5 flex flex-col gap-3">
        {/* Pace Rating: 0.0 – 4.0 */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[8px] tracking-[0.14em] text-ink-light uppercase">Pace Rating</span>
            <span className="font-mono text-[9px] font-bold text-ink">{rating.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={4.0}
            step={0.05}
            value={rating}
            onChange={(e) => onRatingChange(override.code, parseFloat(e.target.value))}
            className="w-full h-1.5 cursor-pointer"
            style={{ accentColor: "#0D0D0F" }}
          />
          <div className="flex justify-between font-mono text-[7px] text-ink-faint">
            <span>0.0</span><span>4.0</span>
          </div>
        </div>

        {/* DNF Probability: 0% – 50% */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[8px] tracking-[0.14em] text-ink-light uppercase">DNF Risk</span>
            <span
              className="font-mono text-[9px] font-bold"
              style={{ color: dnf > 0.2 ? "#E8002D" : "#22C55E" }}
            >
              {(dnf * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={dnf}
            onChange={(e) => onDnfChange(override.code, parseFloat(e.target.value))}
            className="w-full h-1.5 cursor-pointer"
            style={{ accentColor: dnf > 0.2 ? "#E8002D" : "#22C55E" }}
          />
          <div className="flex justify-between font-mono text-[7px] text-ink-faint">
            <span>0%</span><span>50%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
