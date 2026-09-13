"use client";

import React from "react";

/** Format seconds into M:SS.mmm — e.g. 75.240 → "1:15.240" */
export function formatLapTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const secStr = secs.toFixed(3).padStart(6, "0");
  return mins > 0 ? `${mins}:${secStr}` : `${secs.toFixed(3)}`;
}

/** Format a slope value as "+0.054 s/lap" */
export function formatSlope(slope: number): string {
  const sign = slope >= 0 ? "+" : "";
  return `${sign}${slope.toFixed(3)} s/lap`;
}

/** Compound → Pirelli standard color */
export function compoundColor(compound: string): string {
  switch (compound.toUpperCase()) {
    case "SOFT":
      return "#E8002D";
    case "MEDIUM":
      return "#FFC906";
    case "HARD":
      return "#C0C0C0";
    case "INTERMEDIATE":
    case "INTER":
      return "#39B54A";
    case "WET":
      return "#0067FF";
    default:
      return "#999999";
  }
}

/** Compound → short label */
export function compoundLabel(compound: string): string {
  switch (compound.toUpperCase()) {
    case "SOFT": return "S";
    case "MEDIUM": return "M";
    case "HARD": return "H";
    case "INTERMEDIATE": return "I";
    case "WET": return "W";
    default: return compound.charAt(0);
  }
}

interface SectionHeaderProps {
  index: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}

export function SectionHeader({ index, title, subtitle, badge }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-[0.22em] text-ink-light uppercase">
            {index}
          </span>
          <div className="w-px h-3 bg-[rgba(13,13,15,0.15)]" />
          <h2
            className="font-display text-lg font-bold tracking-tight text-ink uppercase"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {title}
          </h2>
        </div>
        {badge}
      </div>
      {subtitle && (
        <p className="font-mono text-[10px] text-ink-light tracking-wide">{subtitle}</p>
      )}
      <div className="h-px bg-[rgba(13,13,15,0.08)] mt-3" />
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  hint?: string;
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase mb-2">
        NO DATA
      </div>
      <div className="font-display text-base font-bold text-ink-mid" style={{ fontFamily: "'Orbitron', sans-serif" }}>
        {message}
      </div>
      {hint && (
        <div className="font-mono text-[10px] text-ink-light mt-2 max-w-xs">{hint}</div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="font-mono text-[9px] tracking-[0.2em] text-[#E8002D] uppercase mb-2">
        DATA UNAVAILABLE
      </div>
      <div className="font-mono text-[11px] text-ink-mid max-w-sm">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 font-mono text-[10px] tracking-widest text-ink border border-[rgba(13,13,15,0.2)] px-4 py-2 hover:border-accent hover:text-accent transition-colors"
        >
          RETRY
        </button>
      )}
    </div>
  );
}

export function SkeletonBar({ height = 24, width = "100%" }: { height?: number; width?: string }) {
  return (
    <div
      className="bg-[rgba(13,13,15,0.06)] rounded animate-pulse"
      style={{ height, width }}
    />
  );
}

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-6">
      <SkeletonBar height={20} width="40%" />
      <SkeletonBar height={200} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBar key={i} height={72} />
        ))}
      </div>
    </div>
  );
}
