"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnalyticsMetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  accent?: boolean;
  delta?: string;
  deltaPositive?: boolean;
  index?: number;
}

export function AnalyticsMetricCard({
  label,
  value,
  subValue,
  accent,
  delta,
  deltaPositive,
  index = 0,
}: AnalyticsMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm px-4 py-3 flex flex-col gap-1 relative overflow-hidden"
    >
      {/* accent stripe */}
      {accent && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent" />
      )}

      <span className="font-mono text-[9px] tracking-[0.18em] text-ink-light uppercase leading-none">
        {label}
      </span>

      <div className="flex items-baseline gap-2">
        <span
          className={`font-display text-xl font-bold tracking-tight leading-none ${
            accent ? "text-ink" : "text-ink"
          }`}
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {value}
        </span>
        {delta && (
          <span
            className={`font-mono text-[10px] font-bold ${
              deltaPositive ? "text-[#22C55E]" : "text-[#EF4444]"
            }`}
          >
            {deltaPositive ? "▲" : "▼"} {delta}
          </span>
        )}
      </div>

      {subValue && (
        <span className="font-mono text-[9px] text-ink-light tracking-wide">
          {subValue}
        </span>
      )}
    </motion.div>
  );
}
