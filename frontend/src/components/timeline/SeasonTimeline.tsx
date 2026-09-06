"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { F1_2026_CALENDAR } from "@/lib/calendarData";
import { RaceEvent } from "@/types/calendar";
import { useTimelineData } from "@/lib/hooks/useTimelineData";
import { TimelineCircuit } from "./TimelineCircuit";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COUNTRY ISO2 MAP  (for flag CDN)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COUNTRY_ISO2: Record<string, string> = {
  BHR: "bh", SAU: "sa", AUS: "au", JPN: "jp", CHN: "cn",
  USA: "us", ITA: "it", MCO: "mc", CAN: "ca", ESP: "es",
  AUT: "at", GBR: "gb", HUN: "hu", NLD: "nl", AZE: "az",
  SGP: "sg", MEX: "mx", BRA: "br", QAT: "qa", UAE: "ae",
  BEL: "be",
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FLAG GRAPHIC â€” same size/style as before
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FlagGraphic({
  countryCode,
  flagEmoji,
  countryName,
  size = "large",
  className = "",
}: {
  countryCode: string;
  flagEmoji: string;
  countryName: string;
  size?: "normal" | "large" | "massive";
  className?: string;
}) {
  const iso2 = COUNTRY_ISO2[countryCode.toUpperCase()] || countryCode.toLowerCase().slice(0, 2);
  const heightClass =
    size === "massive" ? "h-12 md:h-16"
    : size === "large" ? "h-9 md:h-12"
    : "h-7 md:h-9";

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/h80/${iso2}.png`}
        alt={`${countryName} flag`}
        className={`${heightClass} w-auto object-contain rounded-[2px] shadow-sm border border-ink/10`}
        loading="lazy"
        onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
      />
      <span className="sr-only">{flagEmoji}</span>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CANVAS CONSTANTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CARD_W = 340;
const CARD_H_NORMAL = 420;
const CARD_H_CURRENT = 500;
const CARD_GAP = 72;
const CANVAS_PADDING_X = 140;
const CANVAS_H = 900;
const CENTRE_Y = CANVAS_H / 2;

// Slight vertical diagonals â€” detective board zigzag
const ROUND_Y_OFFSETS: Record<number, number> = {
  1: -60,   2: 80,   3: -40,  4: 100,
  5: -80,   6: 40,   7: -100, 8: 60,
  9: -50,   10: 90,  11: -70, 12: 50,
  13: -90,  14: 0,   15: 80,  16: -60,
  17: 100,  18: -80, 19: 60,  20: -100,
  21: 80,   22: -50, 23: 70,  24: -80,
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UTIL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString("en-US", {
      day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
    }).toUpperCase();
  } catch { return dateString.toUpperCase(); }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONNECTOR THREAD SVG
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface NodePos { x: number; y: number; }

function ConnectorSvg({ nodes, canvasWidth }: { nodes: NodePos[]; canvasWidth: number }) {
  if (nodes.length < 2) return null;
  const pts: string[] = [];
  nodes.forEach((n, i) => {
    if (i === 0) { pts.push(`M ${n.x} ${n.y}`); return; }
    const prev = nodes[i - 1];
    const cpX = (prev.x + n.x) / 2;
    pts.push(`C ${cpX} ${prev.y} ${cpX} ${n.y} ${n.x} ${n.y}`);
  });
  const d = pts.join(" ");

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={CANVAS_H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      <defs>
        <linearGradient id="thread-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(13,13,15,0.05)" />
          <stop offset="40%"  stopColor="rgba(13,13,15,0.22)" />
          <stop offset="60%"  stopColor="rgba(255,128,0,0.30)" />
          <stop offset="100%" stopColor="rgba(255,128,0,0.08)" />
        </linearGradient>
      </defs>
      {/* Wide ghost underlay */}
      <path d={d} fill="none" stroke="rgba(13,13,15,0.05)" strokeWidth={10} strokeLinecap="round" />
      {/* Main thread */}
      <path d={d} fill="none" stroke="url(#thread-grad)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="5 4" />
    </svg>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// RACE CARD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RaceCard({
  race, cardLeft, cardTop, isCurrent, isCompleted, isUpcoming, dotY,
}: {
  race: RaceEvent;
  cardLeft: number;
  cardTop: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  dotY: number; // Y centre of the connector dot in absolute canvas coords
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px -20% 0px -20%" });
  const cardH = isCurrent ? CARD_H_CURRENT : CARD_H_NORMAL;
  const cardW = isCurrent ? CARD_W + 60 : CARD_W;

  return (
    <motion.div
      ref={ref}
      className="absolute"
      style={{ left: cardLeft, top: cardTop, width: cardW, height: cardH, zIndex: isCurrent ? 10 : 1 }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (race.round % 5) * 0.06 }}
    >
      {/* â”€â”€ Connector dot (sits at dotY relative to cardTop) â”€â”€ */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: dotY - cardTop - 6 }}
      >
        <div className={`w-3 h-3 rounded-full ${
          isCurrent
            ? "bg-accent shadow-[0_0_14px_rgba(255,128,0,0.7)]"
            : isCompleted
            ? "bg-ink-light/35 border border-ink-light/25"
            : "border border-ink-light/20 bg-transparent"
        }`} />
        {isCurrent && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-accent/50 animate-ping" />
        )}
      </div>

      {/* â”€â”€ CARD SHELL â”€â”€ */}
      <div
        className={`absolute inset-0 flex flex-col overflow-hidden rounded-sm transition-all duration-300
          ${isCurrent
            ? "border border-accent/35 bg-bg/90 shadow-[0_0_40px_rgba(255,128,0,0.07),0_2px_20px_rgba(0,0,0,0.06)]"
            : isCompleted
            ? "border border-ink-light/12 bg-bg/55"
            : "border border-ink-light/8 bg-bg/30"
          }`}
        style={{ opacity: isUpcoming ? 0.58 : isCompleted ? 0.85 : 1 }}
      >
        {/* Accent top bar for current */}
        {isCurrent && (
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-70" />
        )}

        {/* â”€â”€ HEADER: round + date â”€â”€ */}
        <div className={`flex items-center justify-between px-4 pt-4 pb-2 ${isCompleted ? "opacity-70" : ""}`}>
          <div className="flex items-center gap-2">
            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
            <span className={`font-mono text-[9px] tracking-[0.28em] uppercase ${isCurrent ? "text-accent font-bold" : "text-ink-light"}`}>
              RD {String(race.round).padStart(2, "0")}
            </span>
            <span className={`font-mono text-[9px] tracking-widest uppercase ${isCompleted ? "text-ink-light/40 line-through" : "text-ink-light/60"}`}>
              {formatDate(race.race_date)}
            </span>
          </div>
          <span className={`font-mono text-[8px] tracking-widest uppercase ${
            isCurrent ? "text-accent" : isCompleted ? "text-ink-light/40" : "text-ink-light/25"
          }`}>
            {isCurrent ? "ACTIVE" : isCompleted ? "✓ FIN" : "TBC"}
          </span>
        </div>

        {/* — FLAG + LOCATION — */}
        <div className="px-4 pb-2 flex items-center gap-3">
          <FlagGraphic
            countryCode={race.country_code}
            flagEmoji={race.flag}
            countryName={race.country}
            size={isCurrent ? "large" : "normal"}
          />
          <div>
            <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-light leading-tight">
              {race.country.toUpperCase()} &middot; {race.location.toUpperCase()}
            </div>
            {isCurrent && (
              <div className="font-mono text-[8px] tracking-widest text-accent uppercase mt-0.5">
                {race.circuit_name.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ GRAND PRIX NAME â”€â”€ */}
        <div className="px-4 pb-2">
          <h3 className={`font-display font-black tracking-tight uppercase leading-none ${
            isCurrent ? "text-2xl text-ink" : isCompleted ? "text-lg text-ink-mid" : "text-base text-ink-mid/80"
          }`}>
            {race.event_name}
          </h3>
          <div className="font-mono text-[9px] text-ink-light/55 tracking-wide mt-1">
            {race.circuit_name} &middot; {race.total_laps}L &middot; {race.circuit_length_km}KM
          </div>
        </div>

        {/* â”€â”€ CIRCUIT GEOMETRY â”€â”€ */}
        <div className={`mx-4 flex items-center justify-center flex-1 min-h-0 ${isCurrent ? "my-1" : ""}`}>
          <TimelineCircuit
            trackPath={race.track_path}
            circuitName={race.circuit_name}
            status={race.status}
            startFinish={race.start_finish}
            cornerCount={race.corner_count}
            drsZones={race.drs_zones}
            scale={isCurrent ? 1.25 : 0.95}
            rotation={0}
            strokeWidth={isCurrent ? 2.8 : 2}
            opacity={isUpcoming ? 0.42 : isCompleted ? 0.65 : 1}
            className="w-full h-full"
          />
        </div>

        {/* â”€â”€ WINNER / STATUS FOOTER â”€â”€ */}
        <div className="px-4 pb-4 pt-2 border-t border-ink-light/8 mt-auto">
          {isCompleted && race.winner && (
            <div>
              <div className="font-display font-bold text-sm tracking-wider uppercase text-ink leading-tight">
                {race.winner.full_name}
              </div>
              <div className="font-mono text-[9px] text-ink-light/55 mt-0.5 flex items-center gap-2">
                <span>{race.winner.team_name}</span>
                {race.winner.finish_gap && <><span>&middot;</span><span>{race.winner.finish_gap}</span></>}
              </div>
            </div>
          )}
          {isCurrent && race.winner && (
            <div>
              <div className="font-mono text-[8px] tracking-[0.2em] text-accent uppercase mb-1">RACE WINNER</div>
              <div className="font-display font-black text-xl tracking-tight uppercase text-ink leading-none">
                {race.winner.full_name}
              </div>
              <div className="font-mono text-[9px] mt-1 flex items-center gap-2 text-ink-light">
                <span className="text-accent">{race.winner.team_name}</span>
                <span>&middot;</span>
                <span>{race.winner.finish_gap || "1:30:45.519"}</span>
              </div>
              <div className="mt-2 flex gap-3 font-mono text-[9px] text-ink-light/65">
                <span><span className="text-ink font-bold">{race.total_laps}</span> L</span>
                <span><span className="text-ink font-bold">{race.corner_count}</span> CRN</span>
                <span><span className="text-ink font-bold">{race.drs_zones}</span> DRS</span>
              </div>
            </div>
          )}
          {isCurrent && !race.winner && (
            <div>
              <div className="font-mono text-[8px] tracking-[0.2em] text-accent uppercase mb-1">RACE WEEKEND ACTIVE</div>
              <div className="font-display font-black text-lg tracking-tight uppercase text-ink leading-tight">
                GRAND PRIX IN PROGRESS
              </div>
              <div className="mt-2 flex gap-3 font-mono text-[9px] text-ink-light/65">
                <span><span className="text-ink font-bold">{race.total_laps}</span> L</span>
                <span><span className="text-ink font-bold">{race.corner_count}</span> CRN</span>
                <span><span className="text-ink font-bold">{race.drs_zones}</span> DRS</span>
              </div>
            </div>
          )}
          {isUpcoming && (
            <div className="font-mono text-[9px] text-ink-light/40 tracking-widest uppercase flex items-center gap-2">
              <span className="w-1 h-1 rounded-full border border-ink-light/30" />
              RESULTS PENDING &middot; {race.corner_count}CRN &middot; {race.drs_zones}DRS
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN EXPORT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function SeasonTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const {
    events: allRaces,
    season,
    totalRounds,
    currentRound,
    isLive,
  } = useTimelineData();

  const completedCount = allRaces.filter((r) => r.round < currentRound).length;
  const upcomingCount = allRaces.filter((r) => r.round > currentRound).length;

  const totalCards = allRaces.length;
  const canvasWidth = CANVAS_PADDING_X * 2 + totalCards * CARD_W + (totalCards - 1) * CARD_GAP;

  // Compute per-card layout
  const cards = allRaces.map((race, i) => {
    const isCurrent = race.round === currentRound;
    const isCompleted = race.round < currentRound;
    const isUpcoming = race.round > currentRound;
    const cardW = isCurrent ? CARD_W + 60 : CARD_W;
    const cardH = isCurrent ? CARD_H_CURRENT : CARD_H_NORMAL;
    const yOffset = ROUND_Y_OFFSETS[race.round] ?? 0;
    const cardTop = CENTRE_Y + yOffset - cardH / 2;
    const cardLeft = CANVAS_PADDING_X + i * (CARD_W + CARD_GAP);
    const dotY = CENTRE_Y + yOffset; // mid of card in canvas coords
    return {
      race,
      cardLeft,
      cardTop,
      cardW,
      cardH,
      dotY,
      isCurrent,
      isCompleted,
      isUpcoming,
    };
  });

  const nodes: NodePos[] = cards.map(c => ({ x: c.cardLeft + c.cardW / 2, y: c.dotY }));

  useEffect(() => { setMounted(true); }, []);

  // Auto-scroll to current race
  useEffect(() => {
    if (!mounted) return;
    const currentIdx = allRaces.findIndex(r => r.round === currentRound);
    if (currentIdx < 0 || !scrollRef.current) return;
    const c = cards[currentIdx];
    if (!c) return;
    const targetX = c.cardLeft - window.innerWidth / 2 + c.cardW / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: Math.max(0, targetX), behavior: "smooth" });
    }, 700);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentRound]);

  // Redirect vertical wheel delta to horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);


  return (
    <section id="timeline" className="relative w-full bg-bg text-ink">
      {/* Engineering grid background (static area) */}
      <div className="absolute inset-0 bg-engineering-grid pointer-events-none opacity-55" />

      {/* ── SECTION HEADER ── */}
      <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-28 pb-8">
        <div className="section-index mb-3">
          04 &nbsp;/&nbsp; {season} FIA FORMULA 1 WORLD CHAMPIONSHIP
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-black tracking-tight uppercase leading-none">
              SEASON TIMELINE
            </h2>
            <p className="font-mono text-xs md:text-sm text-ink-light tracking-widest uppercase mt-3">
              CHRONOLOGICAL ARCHIVE &bull; {totalRounds} ROUNDS &bull; REAL TRACK GEOMETRIES
            </p>
          </div>
          <div className="font-mono text-[11px] text-ink-light tracking-widest uppercase flex flex-wrap items-center gap-4 md:gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ink-light opacity-50" />
              {completedCount} COMPLETED
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              RD {currentRound} CURRENT
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-ink-light opacity-30" />
              {upcomingCount} UPCOMING
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-ink-faint/40 bg-bg/70 text-[9px] tracking-[0.15em]">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-accent animate-pulse" : "bg-ink-light"}`} />
              {isLive ? "2026 SCHEDULE LIVE" : "LOCAL ARCHIVE"}
            </span>
          </div>
        </div>

      </div>


      {/* â”€â”€ HORIZONTAL CANVAS â”€â”€ */}
      <div
        ref={scrollRef}
        id="timeline-scroll"
        className="relative overflow-x-auto overflow-y-hidden"
        style={{ height: CANVAS_H }}
      >
        <div className="relative" style={{ width: canvasWidth, height: CANVAS_H }}>
          {/* Canvas grid */}
          <div className="absolute inset-0 bg-engineering-grid opacity-35 pointer-events-none" />

          {/* Connector thread */}
          {mounted && <ConnectorSvg nodes={nodes} canvasWidth={canvasWidth} />}

          {/* Race cards */}
          {cards.map((c) => (
            <RaceCard
              key={c.race.round}
              race={c.race}
              cardLeft={c.cardLeft}
              cardTop={c.cardTop}
              isCurrent={c.isCurrent}
              isCompleted={c.isCompleted}
              isUpcoming={c.isUpcoming}
              dotY={c.dotY}
            />
          ))}

          {/* Season end label */}
          <div
            className="absolute font-mono text-[9px] tracking-widest text-ink-light/25 uppercase"
            style={{ left: canvasWidth - CANVAS_PADDING_X + 20, top: CENTRE_Y - 8 }}
          >
            END OF SEASON
          </div>
        </div>

        {/* Edge vignettes (depth effect) */}
        <div
          className="absolute inset-y-0 left-0 w-28 pointer-events-none z-20"
          style={{ background: "linear-gradient(to right, #F5F2ED 0%, transparent 100%)" }}
        />
        <div
          className="absolute inset-y-0 right-0 w-28 pointer-events-none z-20"
          style={{ background: "linear-gradient(to left, #F5F2ED 0%, transparent 100%)" }}
        />
      </div>

      {/* Timeline-current anchor for Hero HUD scroll */}
      <div id="timeline-current" style={{ position: "absolute", top: 0 }} />

      <div className="h-16" />
    </section>
  );
}