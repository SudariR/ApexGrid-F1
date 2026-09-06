"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDriverStandings } from "@/lib/hooks/useStandings";
import { getTeamColors } from "@/lib/teamColors";
import { ConstructorLogo } from "@/components/ui/ConstructorLogo";
import { Helmet3DViewer } from "@/components/standings/Helmet3DViewer";
import { StandingsDrawer } from "@/components/ui/StandingsDrawer";

export function DriversStandings() {
  const { drivers, round, season, isLive } = useDriverStandings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (marqueeRef.current && sectionRef.current) {
      gsap.fromTo(
        marqueeRef.current,
        { x: "0%" },
        {
          x: "-40%",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        }
      );
    }
  }, []);

  // Show top 5 drivers in editorial rows on the main page (full list available via drawer)
  const displayDrivers = drivers.slice(0, 5);

  return (
    <section
      ref={sectionRef}
      id="drivers"
      className="relative w-full min-h-screen bg-bg overflow-hidden"
    >
      {/* Background engineering grid */}
      <div className="absolute inset-0 bg-engineering-grid pointer-events-none" />

      {/* ── Scroll-driven watermark typography: DRIVERS • FIA 2026 with enhanced visibility ── */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-[0] flex items-center">
        <div
          ref={marqueeRef}
          className="whitespace-nowrap select-none will-change-transform"
          style={{
            fontSize: "clamp(7rem, 16vw, 18rem)",
            fontFamily: "Orbitron, sans-serif",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            color: "transparent",
            WebkitTextStroke: "2px rgba(13,13,15,0.14)",
            paddingTop: "0.1em",
          }}
        >
          DRIVERS • FIA {season || 2026} • DRIVERS • FIA {season || 2026} • DRIVERS • FIA {season || 2026} •
        </div>
      </div>

      {/* ── 3D Helmet — background compositional element, right side ── */}
      <div
        className="absolute z-[1] pointer-events-none"
        style={{
          right: "-8vw",
          top: "50%",
          transform: "translateY(-50%)",
          width: "clamp(300px, 42vw, 650px)",
          height: "80vh",
          opacity: 0.12,
        }}
      >
        <Helmet3DViewer
          driverCode={drivers[0]?.driver_code || "RUS"}
          driverName={drivers[0]?.full_name || "George Russell"}
          teamName={drivers[0]?.team_name || "Mercedes"}
          accentColor="#00FF66"
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-[2] w-full min-h-screen flex flex-col justify-center px-6 md:px-10 lg:px-16 py-24">

        {/* Section header — left-aligned, not centered */}
        <div className="mb-10 md:mb-14">
          <div className="section-index mb-3">
            02 &nbsp;/&nbsp; WORLD DRIVERS&apos; CHAMPIONSHIP
          </div>
          <div
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(2.5rem, 6vw, 7rem)", letterSpacing: "-0.03em" }}
          >
            DRIVERS&apos;
          </div>
          <div
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(2.5rem, 6vw, 7rem)", letterSpacing: "-0.03em" }}
          >
            CHAMPIONSHIP
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="font-mono text-[10px] tracking-[0.2em] text-ink-light uppercase">
              SEASON {season || 2026}
            </div>
            <div className="w-12 h-[1px] bg-ink-faint" />
            <div className="font-mono text-[10px] tracking-[0.2em] text-ink-light uppercase">
              ROUND {round || 12} / 24
            </div>
            <div className={`w-2 h-2 rounded-full ${isLive ? "bg-accent animate-pulse" : "bg-ink-light"}`} />
            <div className="font-mono text-[10px] tracking-[0.2em] text-ink-light uppercase">
              {isLive ? "FIA VERIFIED LIVE" : "FIA ARCHIVE"}
            </div>
          </div>
        </div>

        {/* Column headers — editorial, no background box */}
        <div className="hidden md:grid grid-cols-[60px_80px_1fr_120px_80px_100px] gap-4 items-center mb-2 px-2">
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">POS</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">NO.</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">DRIVER</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">TEAM</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">WINS</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase text-right">POINTS</div>
        </div>

        {/* Top accent rule */}
        <div className="classification-rule-accent mb-0" />

        {/* Classification rows */}
        <div>
          {displayDrivers.map((driver, index) => {
            const team = getTeamColors(driver.team_name);
            const isP1 = index === 0;
            const isHovered = hoveredDriver === driver.driver_code;

            return (
              <React.Fragment key={driver.driver_code}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  onHoverStart={() => setHoveredDriver(driver.driver_code)}
                  onHoverEnd={() => setHoveredDriver(null)}
                  className="classification-row py-4 md:py-5 px-2 cursor-default"
                >
                  {/* Team color hover accent — 2px left border */}
                  <div
                    className="absolute left-0 top-0 bottom-0 transition-all duration-200"
                    style={{
                      width: isHovered ? "3px" : "2px",
                      backgroundColor: isHovered ? team.primary : isP1 ? team.primary : "transparent",
                      opacity: isHovered ? 1 : isP1 ? 0.6 : 0,
                    }}
                  />

                  {/* Mobile layout */}
                  <div className="md:hidden flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className="font-display font-black text-ink-light"
                        style={{ fontSize: "1rem", letterSpacing: "-0.02em" }}
                      >
                        P{driver.position}
                      </span>
                      <div>
                        <div
                          className="font-display font-black text-ink uppercase"
                          style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}
                        >
                          {driver.full_name}
                        </div>
                        <div className="font-mono text-[9px] tracking-widest text-ink-light uppercase mt-0.5">
                          {driver.team_name} &nbsp;·&nbsp; #{driver.driver_number}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-display font-black text-ink"
                        style={{ fontSize: "1.4rem", letterSpacing: "-0.02em" }}
                      >
                        {driver.points}
                      </div>
                      <div className="font-mono text-[8px] tracking-widest text-ink-light uppercase">PTS</div>
                    </div>
                  </div>

                  {/* Desktop editorial row */}
                  <div className="hidden md:grid grid-cols-[60px_80px_1fr_120px_80px_100px] gap-4 items-center">
                    {/* Position */}
                    <div
                      className="font-display font-black uppercase"
                      style={{
                        fontSize: "clamp(1rem, 2.5vw, 2rem)",
                        letterSpacing: "-0.03em",
                        color: isP1 ? team.primary : "var(--ink-light)",
                      }}
                    >
                      P{driver.position}
                    </div>

                    {/* Driver number */}
                    <div
                      className="font-display font-black text-ink-faint"
                      style={{
                        fontSize: "clamp(1rem, 2.5vw, 2.2rem)",
                        letterSpacing: "-0.04em",
                        color: isHovered ? team.primary : undefined,
                        transition: "color 0.2s ease",
                      }}
                    >
                      #{driver.driver_number}
                    </div>

                    {/* Driver name + Team name underneath */}
                    <div>
                      <div
                        className="font-display font-black text-ink uppercase"
                        style={{
                          fontSize: "clamp(1.2rem, 2.2vw, 2.5rem)",
                          letterSpacing: "-0.025em",
                          lineHeight: 1,
                        }}
                      >
                        {driver.full_name}
                      </div>
                      <div className="font-mono text-[10px] tracking-[0.16em] text-ink-light uppercase mt-1">
                        {driver.team_name}
                      </div>
                    </div>

                    {/* Team Logo in TEAM column */}
                    <div className="flex items-center">
                      <ConstructorLogo teamName={driver.team_name} size={26} />
                    </div>

                    {/* Wins */}
                    <div>
                      <div
                        className="font-display font-bold text-ink"
                        style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}
                      >
                        {driver.wins}
                      </div>
                      <div className="font-mono text-[8px] text-ink-light uppercase tracking-widest">
                        {driver.wins === 1 ? "WIN" : "WINS"}
                      </div>
                    </div>

                    {/* Points — right aligned */}
                    <div className="text-right">
                      <div
                        className="font-display font-black text-ink"
                        style={{
                          fontSize: "clamp(1.2rem, 2.2vw, 2.5rem)",
                          letterSpacing: "-0.03em",
                          color: isP1 ? "var(--ink)" : undefined,
                        }}
                      >
                        {driver.points}
                      </div>
                      <div className="font-mono text-[8px] text-ink-light uppercase tracking-widest">PTS</div>
                    </div>
                  </div>
                </motion.div>

                {/* Classification separator rule */}
                <div
                  className={isP1 ? "classification-rule-accent" : "classification-rule"}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom — View All link, no button box */}
        <div className="mt-10 flex items-center justify-between">
          <div className="font-mono text-[9px] tracking-[0.2em] text-ink-light uppercase">
            SHOWING {displayDrivers.length} OF {drivers.length} DRIVERS
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="group flex items-center gap-3 font-display font-bold text-xs tracking-[0.15em] uppercase text-ink hover:text-accent transition-colors duration-200"
          >
            <span>VIEW ALL CLASSIFICATIONS</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      {/* StandingsDrawer — all functionality preserved */}
      <StandingsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        type="drivers"
        drivers={drivers}
        season={season}
        round={round}
      />
    </section>
  );
}
