"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useHeroData } from "@/lib/hooks/useHeroData";
import { getTeamColors } from "@/lib/teamColors";
import { getDriverImage, getTeamCarImage } from "@/lib/f1Assets";
import { F1_2026_CALENDAR } from "@/lib/calendarData";
import { TrackMap } from "@/components/hero/TrackMap";
import { CarSpatialAnnotation } from "@/components/hero/CarSpatialAnnotation";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function HeroSection() {
  const { hero, isLive } = useHeroData();
  const { scrollTo } = useSmoothScroll();
  const winner = hero.winner;
  const teamColors = getTeamColors(winner?.team_name);

  // Dynamic asset resolutions with fallback error handling
  const [driverImgError, setDriverImgError] = useState(false);
  const [carImgError, setCarImgError] = useState(false);

  useEffect(() => {
    setDriverImgError(false);
  }, [winner?.driver_code]);

  useEffect(() => {
    setCarImgError(false);
  }, [winner?.team_name]);

  const driverImgSrc = driverImgError
    ? "/assets/driver-winner.png"
    : getDriverImage(winner?.driver_code, winner?.full_name);

  const carImgSrc = carImgError
    ? "/assets/car-aero.png"
    : getTeamCarImage(winner?.team_name);

  // Compute next race from calendar (race following the latest completed GP)
  const currentOrHeroRound = hero.round || 12;
  const nextRace =
    F1_2026_CALENDAR.find((e) => e.round === currentOrHeroRound + 1) ||
    F1_2026_CALENDAR.find((e) => e.status === "current") ||
    F1_2026_CALENDAR.find((e) => e.status === "upcoming");
  const formattedNextRaceDate = nextRace?.race_date
    ? new Date(nextRace.race_date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).toUpperCase()
    : "TBD";

  // Mouse parallax values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const heroRef = useRef<HTMLElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    mouseX.set((e.clientX - innerWidth / 2) / 60);
    mouseY.set((e.clientY - innerHeight / 2) / 60);
  };

  // Scroll reveal for driver name
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  // Split driver name for editorial layout
  const nameParts = (winner?.full_name || "Lando Norris").split(" ");
  const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

  return (
    <section
      id="hero"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen overflow-hidden bg-bg"
      style={{ cursor: "default" }}
    >
      {/* ── LAYER 0: Engineering background grid ── */}
      <div className="absolute inset-0 bg-engineering-grid opacity-100 pointer-events-none" />

      {/* ── LAYER 0b: Subtle team color ambient — dynamic team hue ── */}
      <div
        className="absolute top-0 right-0 w-[60vw] h-[100vh] pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 80% 40%, ${teamColors.primary}12 0%, transparent 65%)`,
        }}
      />

      {/* ── LAYER 1: Circuit track map — dynamically displays current GP circuit ── */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <TrackMap
          circuitName={hero.location || hero.event_name || "Zandvoort"}
          round={hero.round}
          className="absolute top-[20%] right-[-10%] w-[58%] h-[82%] max-w-none"
          opacity={0.85}
        />
      </div>

      {/* ── LAYER 2: Monumental driver name watermark ── */}
      <div className="absolute inset-0 flex items-center pointer-events-none z-[2] overflow-hidden">
        <div
          key={`watermark-${winner?.driver_code}`}
          className="font-display font-black uppercase leading-none select-none transition-all duration-500"
          style={{
            fontSize: "clamp(5rem, 17vw, 18rem)",
            letterSpacing: "-0.04em",
            color: "transparent",
            WebkitTextStroke: "2px rgba(13,13,15,0.13)",
            whiteSpace: "nowrap",
            transform: "translateY(-5%)",
          }}
        >
          {lastName || winner?.driver_code || "NORRIS"}
        </div>
      </div>

      {/* ── LAYER 4: Driver photo — dynamic driver portrait ── */}
      <motion.div
        key={`driver-${winner?.driver_code}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute z-[4] pointer-events-none"
        style={{
          x: springX,
          y: springY,
          left: "0%",
          bottom: "0",
          width: "clamp(280px, 38vw, 600px)",
          height: "100%",
        }}
      >
        {/* Team color accent strip at left edge */}
        <div
          className="absolute left-0 top-[15%] bottom-0 w-[3px] z-10 transition-colors duration-500"
          style={{ backgroundColor: teamColors.primary }}
        />

        {/* Driver image — clickable hitbox strictly on the image itself */}
        <div className="absolute inset-0 flex items-end justify-start">
          <motion.div
            onClick={() => scrollTo("#drivers")}
            className="relative w-full cursor-pointer pointer-events-auto"
            style={{ height: "95%" }}
            whileHover={{ scale: 1.012 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            title={`View ${winner?.full_name} in Drivers' Championship`}
          >
            <Image
              src={driverImgSrc}
              alt={winner?.full_name || "Grand Prix Winner"}
              fill
              priority
              onError={() => setDriverImgError(true)}
              className="object-contain object-bottom"
              style={{ objectPosition: "left bottom" }}
            />
            {/* Bottom gradient fade */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </motion.div>

      {/* ── LAYER 5: Typography — dynamic driver & round stats ── */}
      <div
        className="absolute z-[6] pointer-events-none select-none"
        style={{
          left: "clamp(240px, 32vw, 500px)",
          top: "23%",
          transform: "translateY(-50%)",
        }}
      >
        {/* Race round micro label */}
        <div className="font-mono text-[9px] tracking-[0.22em] text-ink-light uppercase mb-2.5">
          RD {hero.round} / 24 &nbsp;·&nbsp; {hero.season} SEASON
        </div>

        {/* Foreground Name on ONE LINE */}
        <motion.div
          key={`name-${winner?.driver_code}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-black text-ink leading-none uppercase whitespace-nowrap"
          style={{ fontSize: "clamp(1.8rem, 3.8vw, 4.6rem)", letterSpacing: "-0.025em" }}
        >
          {winner?.full_name}
        </motion.div>

        {/* Team + Winner position in gap */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-3.5 flex items-center gap-3"
        >
          <div
            className="w-7 h-[2px] transition-colors duration-500"
            style={{ backgroundColor: teamColors.primary }}
          />
          <span className="font-display font-bold text-xs tracking-[0.15em] uppercase text-ink-mid">
            {winner?.team_name}
          </span>
          <div
            className="w-3 h-[2px] transition-colors duration-500"
            style={{ backgroundColor: teamColors.primary }}
          />
          <span className="font-mono text-xs text-ink-light">
            P{winner?.position || 1} WINNER
          </span>
        </motion.div>
      </div>

      {/* ── LAYER 6: Race-winning car — dynamic constructor livery & spatial annotations ── */}
      <div
        className="absolute z-[5] pointer-events-none"
        style={{
          right: "0",
          bottom: "0",
          width: "clamp(420px, 58vw, 900px)",
          height: "68vh",
        }}
      >
        {/* Car spatial annotation system — real finish time, laps, points, and position */}
        <CarSpatialAnnotation
          totalTime={winner?.finish_gap || "1:30:45.519"}
          laps={hero.total_laps}
          gridPosition={winner?.grid_position}
          points={winner?.points}
          circuit={hero.location}
          pitStops={2}
        />

        {/* The car image — clickable hitbox strictly on the car visual */}
        <motion.div
          style={{ x: springX, y: springY }}
          className="absolute inset-0"
        >
          <motion.div
            onClick={() => scrollTo("#constructors")}
            className="absolute inset-0 cursor-pointer pointer-events-auto"
            style={{
              bottom: "-5%",
              right: "-3%",
            }}
            whileHover={{ scale: 1.015 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            title={`View ${winner?.team_name} in Constructors' Championship`}
          >
            <Image
              key={`car-${winner?.team_name}`}
              src={carImgSrc}
              alt={`${winner?.team_name} Formula 1 race car`}
              fill
              priority
              onError={() => setCarImgError(true)}
              className="object-contain"
              style={{ objectPosition: "right bottom" }}
            />
            {/* Subtle ground plane shadow */}
            <div
              className="absolute bottom-[2%] left-[15%] right-[5%] h-8 pointer-events-none transition-all duration-500"
              style={{
                background: `radial-gradient(ellipse, ${teamColors.primary}20 0%, transparent 70%)`,
                filter: "blur(12px)",
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* ── LAYER 7: Top HUD bar — latest race, live indicator & next race ── */}
      <div className="absolute top-0 left-0 right-0 z-[7] pt-20 px-6 md:px-10 flex items-center justify-between pointer-events-none">
        {/* Left: Latest Race & Circuit — Click to smoothly scroll to Timeline */}
        <div
          onClick={() => scrollTo("#timeline-current")}
          className="flex items-center gap-6 pointer-events-auto cursor-pointer group"
          title="Click to view Season Timeline"
        >
          <div>
            <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase group-hover:text-accent transition-colors flex items-center gap-1.5">
              <span>LATEST RACE</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">↓</span>
            </div>
            <div className="font-display font-bold text-sm text-ink group-hover:text-ink/80 uppercase tracking-tight mt-0.5 transition-colors">
              {hero.event_name}
            </div>
          </div>
          <div className="w-[1px] h-8 bg-ink-faint group-hover:bg-accent/40 transition-colors" />
          <div>
            <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase group-hover:text-accent transition-colors">
              CIRCUIT
            </div>
            <div className="font-mono text-xs text-ink-mid group-hover:text-ink mt-0.5 uppercase tracking-wide transition-colors">
              {hero.location}{hero.country ? `, ${hero.country}` : ""}
            </div>
          </div>
        </div>

        {/* Center: Live Backend Telemetry Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-ink-faint/40 bg-bg/70 backdrop-blur-sm pointer-events-auto">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLive ? "bg-accent shadow-[0_0_8px_rgba(210,255,0,0.8)] animate-pulse" : "bg-ink-light"
            }`}
          />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-mid">
            {isLive ? "2026 API CONNECTED" : "OFFLINE CACHE"}
          </span>
        </div>

        {/* Right: Next Race & Race Day — Dynamically computed from 2026 calendar */}
        <div
          onClick={() => scrollTo("#timeline")}
          className="flex items-center gap-6 text-right pointer-events-auto cursor-pointer group"
          title="Click to view Season Timeline"
        >
          <div>
            <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase group-hover:text-accent transition-colors flex items-center justify-end gap-1.5">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">↓</span>
              <span>NEXT RACE</span>
            </div>
            <div className="font-display font-bold text-sm text-ink group-hover:text-ink/80 uppercase tracking-tight mt-0.5 transition-colors">
              {nextRace?.event_name || "Next Grand Prix"}
            </div>
          </div>
          <div className="w-[1px] h-8 bg-ink-faint group-hover:bg-accent/40 transition-colors" />
          <div>
            <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase group-hover:text-accent transition-colors">
              RACE DAY
            </div>
            <div className="font-mono text-xs text-ink-mid group-hover:text-ink mt-0.5 uppercase tracking-wide transition-colors">
              {formattedNextRaceDate}
            </div>
          </div>
        </div>
      </div>

      {/* ── LAYER 8: Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[8] flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-[1px] h-14 bg-ink-faint scroll-line" />
        <div className="font-mono text-[8px] tracking-[0.3em] text-ink-light uppercase">
          SCROLL
        </div>
      </div>

      {/* ── LAYER 9: Clickable overlay for sections ── */}
      <div className="absolute bottom-8 right-6 md:right-10 z-[9] flex items-center gap-4">
        <button
          onClick={() => scrollTo("#drivers")}
          className="font-display font-bold text-[10px] tracking-[0.2em] uppercase text-ink-light hover:text-ink transition-colors duration-200 flex items-center gap-2"
        >
          <span>DRIVERS</span>
          <span className="text-accent">↓</span>
        </button>
      </div>
    </section>
  );
}
