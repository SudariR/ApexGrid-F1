"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import type { PaceResponse, KdePoint } from "@/types/analytics";
import { AnalyticsMetricCard } from "./AnalyticsMetricCard";
import { formatLapTime, LoadingSkeleton, ErrorState, EmptyState } from "./analyticsUtils";

interface PaceConsistencyChartProps {
  primary: PaceResponse | null;
  compare?: PaceResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMsg?: string;
  onRetry?: () => void;
}

interface MergedKdePoint {
  lap_time_s: number;
  primaryDensity: number;
  compareDensity?: number;
}

// Resample KDE distributions onto a single shared uniform grid across both drivers
function computeKdeDistribution(
  primary: PaceResponse,
  compare?: PaceResponse | null,
  numPoints: number = 80
) {
  const pStats = primary.stats;
  const cStats = compare?.stats;

  const minLap = Math.min(
    pStats.min_s,
    cStats ? cStats.min_s : pStats.min_s
  );
  const maxLap = Math.max(
    pStats.max_s,
    cStats ? cStats.max_s : pStats.max_s
  );

  const span = Math.max(maxLap - minLap, 1.0);
  const padding = Math.max(span * 0.04, 0.25);
  const startX = minLap - padding;
  const endX = maxLap + padding;
  const step = (endX - startX) / (numPoints - 1);

  // Linear interpolation for smooth curve reconstruction
  const evalKde = (kde: KdePoint[], x: number): number => {
    if (!kde || kde.length === 0) return 0;
    if (x < kde[0].lap_time_s || x > kde[kde.length - 1].lap_time_s) {
      return 0;
    }
    for (let i = 0; i < kde.length - 1; i++) {
      const p0 = kde[i];
      const p1 = kde[i + 1];
      if (x >= p0.lap_time_s && x <= p1.lap_time_s) {
        const dx = p1.lap_time_s - p0.lap_time_s;
        if (dx <= 0) return p0.density;
        const t = (x - p0.lap_time_s) / dx;
        return p0.density + t * (p1.density - p0.density);
      }
    }
    return 0;
  };

  const points: MergedKdePoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = startX + i * step;
    const pD = evalKde(primary.kde, x);
    const cD = compare ? evalKde(compare.kde, x) : undefined;
    points.push({
      lap_time_s: parseFloat(x.toFixed(3)),
      primaryDensity: parseFloat(pD.toFixed(5)),
      ...(cD !== undefined ? { compareDensity: parseFloat(cD.toFixed(5)) } : {}),
    });
  }

  return { points, minLap: startX, maxLap: endX };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, primaryCode, compareCode }: any) {
  if (!active || !payload?.length) return null;
  const lap = payload[0]?.payload?.lap_time_s as number | undefined;
  return (
    <div className="bg-white border border-[rgba(13,13,15,0.12)] p-2.5 shadow-lg rounded-sm min-w-[150px]">
      <div className="font-mono text-[8px] text-ink-light tracking-widest uppercase mb-1">
        Lap Time: <span className="font-bold text-ink">{lap !== undefined ? formatLapTime(lap) : "—"}</span>
      </div>
      <div className="space-y-1.5 mt-1 border-t border-[rgba(13,13,15,0.06)] pt-1.5">
        {payload.map((entry: { dataKey: string; value: number; color: string }, i: number) => {
          const isPrimary = entry.dataKey === "primaryDensity";
          const code = isPrimary ? primaryCode : compareCode;
          return (
            <div key={i} className="flex items-center justify-between gap-3 font-mono text-[9px]">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                {code}
              </span>
              <span className="text-ink-mid font-semibold">
                {(entry.value * 100).toFixed(2)}% rel. density
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeadToHeadCard({
  title,
  sublabel,
  primaryCode,
  primaryValue,
  primaryFormatted,
  compareCode,
  compareValue,
  compareFormatted,
  lowerIsBetter = true,
  unit = "",
  deltaFormatter,
  index = 0,
}: {
  title: string;
  sublabel?: string;
  primaryCode: string;
  primaryValue: number;
  primaryFormatted: string;
  compareCode: string;
  compareValue: number;
  compareFormatted: string;
  lowerIsBetter?: boolean;
  unit?: string;
  deltaFormatter?: (diff: number, winner: string) => string;
  index?: number;
}) {
  const diff = Math.abs(primaryValue - compareValue);
  const isPrimaryBetter = lowerIsBetter
    ? primaryValue < compareValue
    : primaryValue > compareValue;
  const isTie = Math.abs(primaryValue - compareValue) < 0.0001;
  const winnerCode = isPrimaryBetter ? primaryCode : compareCode;

  const deltaText = deltaFormatter
    ? deltaFormatter(diff, winnerCode)
    : isTie
      ? "Identical"
      : `${winnerCode} +${diff.toFixed(2)}${unit} ahead`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm p-3.5 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] tracking-[0.16em] text-ink-light uppercase">
          {title}
        </span>
        {sublabel && (
          <span className="font-mono text-[7.5px] text-ink-light uppercase tracking-wider">{sublabel}</span>
        )}
      </div>

      {/* 2-Driver Side-by-Side Values */}
      <div className="grid grid-cols-2 gap-2 border-y border-[rgba(13,13,15,0.06)] py-2.5 my-1">
        {/* Primary Driver */}
        <div className={`flex flex-col ${isPrimaryBetter && !isTie ? "border-l-2 border-ink pl-2" : "pl-2"}`}>
          <div className="flex items-center gap-1 font-mono text-[8.5px] font-bold text-ink">
            <span className="w-1.5 h-1.5 rounded-full bg-ink inline-block" />
            {primaryCode}
            {isPrimaryBetter && !isTie && (
              <span className="text-[7px] font-mono text-white bg-ink px-1 py-0.2 rounded-xs uppercase tracking-wider font-bold">
                BETTER
              </span>
            )}
          </div>
          <div
            className={`font-display text-base font-bold mt-1 ${isPrimaryBetter ? "text-ink" : "text-ink-mid"
              }`}
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {primaryFormatted}
          </div>
        </div>

        {/* Compare Driver */}
        <div className={`flex flex-col text-right ${!isPrimaryBetter && !isTie ? "border-r-2 border-[#00CC55] pr-2" : "pr-2"}`}>
          <div className="flex items-center justify-end gap-1 font-mono text-[8.5px] font-bold" style={{ color: "#009944" }}>
            {!isPrimaryBetter && !isTie && (
              <span className="text-[7px] font-mono text-ink bg-accent px-1 py-0.2 rounded-xs uppercase tracking-wider font-bold">
                BETTER
              </span>
            )}
            {compareCode}
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] inline-block" />
          </div>
          <div
            className={`font-display text-base font-bold mt-1 ${!isPrimaryBetter && !isTie ? "text-ink" : "text-ink-mid"
              }`}
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {compareFormatted}
          </div>
        </div>
      </div>

      {/* Delta pill summary */}
      <div className="mt-2 flex items-center justify-between pt-0.5">
        <span className="font-mono text-[7.5px] text-ink-light uppercase tracking-wider">Advantage</span>
        <span
          className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded-xs ${isTie
              ? "bg-[rgba(13,13,15,0.05)] text-ink-mid"
              : isPrimaryBetter
                ? "bg-[rgba(13,13,15,0.08)] text-ink"
                : "bg-[#00FF66]/20 text-[#008833]"
            }`}
        >
          {deltaText}
        </span>
      </div>
    </motion.div>
  );
}

export function PaceConsistencyChart({
  primary,
  compare,
  isLoading,
  isError,
  errorMsg,
  onRetry,
}: PaceConsistencyChartProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message={errorMsg ?? "Pace data unavailable."} onRetry={onRetry} />;
  if (!primary) {
    return (
      <EmptyState
        message="No data loaded"
        hint="Select a driver and race, then click Analyze."
      />
    );
  }

  // Generate smooth, aligned KDE distribution data on a shared uniform grid
  const { points } = useMemo(() => {
    return computeKdeDistribution(primary, compare, 80);
  }, [primary, compare]);

  const { stats } = primary;

  // Single Driver Stats Grid
  const singleDriverCards = [
    { label: `${primary.driver_code} Avg Pace`, value: formatLapTime(stats.mean_s), accent: true, index: 0 },
    { label: `${primary.driver_code} Median Pace`, value: formatLapTime(stats.median_s), index: 1 },
    { label: `${primary.driver_code} Consistency (CV)`, value: `${stats.cv_pct.toFixed(2)}%`, subValue: "lower = more consistent", index: 2 },
    { label: `${primary.driver_code} Std Deviation`, value: `${stats.std_s.toFixed(3)}s`, subValue: "spread per lap", index: 3 },
    { label: `${primary.driver_code} Fastest Lap`, value: formatLapTime(stats.min_s), accent: true, index: 4 },
    { label: `${primary.driver_code} Slowest Clean Lap`, value: formatLapTime(stats.max_s), index: 5 },
    { label: `${primary.driver_code} Clean Laps`, value: String(stats.count), subValue: "safety-car & traffic free", index: 6 },
    { label: `${primary.driver_code} IQR Window`, value: `${formatLapTime(stats.q1_s)} – ${formatLapTime(stats.q3_s)}`, subValue: "middle 50% pace", index: 7 },
  ];

  // Head-to-Head Comparison Summary Banner Text
  const paceAdvantage = compare
    ? primary.stats.mean_s <= compare.stats.mean_s
      ? `${primary.driver_code} is ${(compare.stats.mean_s - primary.stats.mean_s).toFixed(3)}s faster on average`
      : `${compare.driver_code} is ${(primary.stats.mean_s - compare.stats.mean_s).toFixed(3)}s faster on average`
    : "";

  const consistencyAdvantage = compare
    ? primary.stats.cv_pct <= compare.stats.cv_pct
      ? `${primary.driver_code} is ${(compare.stats.cv_pct - primary.stats.cv_pct).toFixed(2)}% more consistent`
      : `${compare.driver_code} is ${(primary.stats.cv_pct - compare.stats.cv_pct).toFixed(2)}% more consistent`
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* Event & Head-to-Head header banner */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase">
            {primary.event_name}
          </span>
          <span className="font-mono text-[9px] text-ink-faint">·</span>
          <span className="font-mono text-[9px] tracking-[0.15em] text-ink font-bold uppercase">
            {primary.driver_code}
          </span>
          {compare && (
            <>
              <span className="font-mono text-[9px] text-ink-faint">vs</span>
              <span
                className="font-mono text-[9px] tracking-[0.15em] font-bold uppercase"
                style={{ color: "#009944" }}
              >
                {compare.driver_code}
              </span>
            </>
          )}
          <span className="font-mono text-[9px] text-ink-faint ml-1">· SESSION {primary.session_type}</span>
        </div>

        {compare && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[8px] tracking-wider uppercase px-2 py-0.5 bg-ink text-bg rounded-xs font-semibold">
              {paceAdvantage}
            </span>
            <span className="font-mono text-[8px] tracking-wider uppercase px-2 py-0.5 bg-[rgba(0,255,102,0.15)] text-[#007733] border border-[#00FF66]/40 rounded-xs font-semibold">
              {consistencyAdvantage}
            </span>
          </div>
        )}
      </div>

      {/* KDE Chart */}
      <div className="bg-white border border-[rgba(13,13,15,0.08)] rounded-sm overflow-hidden p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <p className="font-mono text-[9px] tracking-[0.16em] text-ink font-bold uppercase">
              Lap Time Distribution (Kernel Density Estimate)
            </p>
            <p className="font-mono text-[8px] text-ink-light mt-0.5">
              Curve peak = most frequent pace · Taller & narrower curve = higher consistency · Shifted left = faster lap times
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[8.5px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-ink inline-block" />
              <span className="font-bold text-ink">{primary.driver_code} (Avg: {formatLapTime(primary.stats.mean_s)})</span>
            </div>
            {compare && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] inline-block border border-[#009944]" />
                <span className="font-bold text-[#008833]">{compare.driver_code} (Avg: {formatLapTime(compare.stats.mean_s)})</span>
              </div>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={points} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
            <defs>
              <linearGradient id="kdePrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D0D0F" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#0D0D0F" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="kdeCompare" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF66" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#00FF66" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,15,0.05)" vertical={false} />
            <XAxis
              dataKey="lap_time_s"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickCount={7}
              minTickGap={40}
              tickFormatter={formatLapTime}
              tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fill: "#888888" }}
              axisLine={{ stroke: "rgba(13,13,15,0.1)" }}
              tickLine={false}
            />
            <YAxis hide />
            {/* Mean reference lines */}
            <ReferenceLine
              x={primary.stats.mean_s}
              stroke="#0D0D0F"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `${primary.driver_code} avg`,
                position: "top",
                fontFamily: "JetBrains Mono",
                fontSize: 8,
                fill: "#0D0D0F",
                fontWeight: 700,
              }}
            />
            {compare && (
              <ReferenceLine
                x={compare.stats.mean_s}
                stroke="#00CC55"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `${compare.driver_code} avg`,
                  position: "top",
                  fontFamily: "JetBrains Mono",
                  fontSize: 8,
                  fill: "#009944",
                  fontWeight: 700,
                }}
              />
            )}
            <Tooltip
              content={
                <CustomTooltip
                  primaryCode={primary.driver_code}
                  compareCode={compare?.driver_code}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="primaryDensity"
              name={primary.driver_code}
              stroke="#0D0D0F"
              strokeWidth={2.5}
              fill="url(#kdePrimary)"
              dot={false}
              activeDot={{ r: 4, stroke: "#0D0D0F", strokeWidth: 2, fill: "#FFF" }}
            />
            {compare && (
              <Area
                type="monotone"
                dataKey="compareDensity"
                name={compare.driver_code}
                stroke="#00FF66"
                strokeWidth={2.5}
                fill="url(#kdeCompare)"
                dot={false}
                activeDot={{ r: 4, stroke: "#00FF66", strokeWidth: 2, fill: "#FFF" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* METRIC COMPARISON SECTION */}
      {compare ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] tracking-[0.18em] text-ink-light uppercase">
              Head-to-Head Metric Comparison · {primary.driver_code} vs {compare.driver_code}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <HeadToHeadCard
              title="Average Pace"
              sublabel="all clean laps"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.mean_s}
              primaryFormatted={formatLapTime(primary.stats.mean_s)}
              compareCode={compare.driver_code}
              compareValue={compare.stats.mean_s}
              compareFormatted={formatLapTime(compare.stats.mean_s)}
              lowerIsBetter={true}
              deltaFormatter={(d, w) => `${w} -${d.toFixed(3)}s faster`}
              index={0}
            />
            <HeadToHeadCard
              title="Consistency (CV)"
              sublabel="lower % = more consistent"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.cv_pct}
              primaryFormatted={`${primary.stats.cv_pct.toFixed(2)}%`}
              compareCode={compare.driver_code}
              compareValue={compare.stats.cv_pct}
              compareFormatted={`${compare.stats.cv_pct.toFixed(2)}%`}
              lowerIsBetter={true}
              deltaFormatter={(d, w) => `${w} +${d.toFixed(2)}% more consistent`}
              index={1}
            />
            <HeadToHeadCard
              title="Median Pace"
              sublabel="50th percentile lap"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.median_s}
              primaryFormatted={formatLapTime(primary.stats.median_s)}
              compareCode={compare.driver_code}
              compareValue={compare.stats.median_s}
              compareFormatted={formatLapTime(compare.stats.median_s)}
              lowerIsBetter={true}
              deltaFormatter={(d, w) => `${w} -${d.toFixed(3)}s median`}
              index={2}
            />
            <HeadToHeadCard
              title="Std Deviation"
              sublabel="pace dispersion"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.std_s}
              primaryFormatted={`${primary.stats.std_s.toFixed(3)}s`}
              compareCode={compare.driver_code}
              compareValue={compare.stats.std_s}
              compareFormatted={`${compare.stats.std_s.toFixed(3)}s`}
              lowerIsBetter={true}
              deltaFormatter={(d, w) => `${w} ${d.toFixed(3)}s tighter`}
              index={3}
            />
            <HeadToHeadCard
              title="Fastest Lap"
              sublabel="peak single-lap pace"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.min_s}
              primaryFormatted={formatLapTime(primary.stats.min_s)}
              compareCode={compare.driver_code}
              compareValue={compare.stats.min_s}
              compareFormatted={formatLapTime(compare.stats.min_s)}
              lowerIsBetter={true}
              deltaFormatter={(d, w) => `${w} -${d.toFixed(3)}s faster`}
              index={4}
            />
            <HeadToHeadCard
              title="Slowest Clean Lap"
              sublabel="worst non-SC lap"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.max_s}
              primaryFormatted={formatLapTime(primary.stats.max_s)}
              compareCode={compare.driver_code}
              compareValue={compare.stats.max_s}
              compareFormatted={formatLapTime(compare.stats.max_s)}
              lowerIsBetter={true}
              deltaFormatter={(d, w) => `${w} -${d.toFixed(3)}s floor`}
              index={5}
            />
            <HeadToHeadCard
              title="Clean Laps Count"
              sublabel="SC/VSC excluded"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.count}
              primaryFormatted={`${primary.stats.count} laps`}
              compareCode={compare.driver_code}
              compareValue={compare.stats.count}
              compareFormatted={`${compare.stats.count} laps`}
              lowerIsBetter={false}
              deltaFormatter={(d, w) => d === 0 ? "Equal count" : `${w} +${d} laps`}
              index={6}
            />
            <HeadToHeadCard
              title="IQR Window (Middle 50%)"
              sublabel="core pace range (Q1–Q3)"
              primaryCode={primary.driver_code}
              primaryValue={primary.stats.q3_s - primary.stats.q1_s}
              primaryFormatted={`${formatLapTime(primary.stats.q1_s)} – ${formatLapTime(primary.stats.q3_s)}`}
              compareCode={compare.driver_code}
              compareValue={compare.stats.q3_s - compare.stats.q1_s}
              compareFormatted={`${formatLapTime(compare.stats.q1_s)} – ${formatLapTime(compare.stats.q3_s)}`}
              lowerIsBetter={true}
              deltaFormatter={(d, w) => `${w} has ${(d).toFixed(3)}s tighter core window`}
              index={7}
            />
          </div>
        </div>
      ) : (
        /* Single Driver Stat Cards */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {singleDriverCards.map((card) => (
            <AnalyticsMetricCard key={card.label} {...card} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
