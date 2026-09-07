"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useConstructorStandings } from "@/lib/hooks/useStandings";
import { getTeamColors } from "@/lib/teamColors";
import { ConstructorLogo } from "@/components/ui/ConstructorLogo";
import { StandingsDrawer } from "@/components/ui/StandingsDrawer";

export function ConstructorsStandings() {
  const { constructors, round, season, isLive } = useConstructorStandings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  // Show top 5 constructors in editorial rows on the main page (full list available via drawer)
  const displayConstructors = constructors.slice(0, 5);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (marqueeRef.current && sectionRef.current) {
      gsap.fromTo(
        marqueeRef.current,
        { x: "-40%" },
        {
          x: "0%",
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

  return (
    <section
      ref={sectionRef}
      id="constructors"
      className="relative w-full min-h-screen bg-bg-alt overflow-hidden"
    >
      {/* Background engineering grid — slightly denser */}
      <div className="absolute inset-0 bg-engineering-grid pointer-events-none opacity-80" />

      {/* ── Scroll-driven watermark: CONSTRUCTORS • FIA 2026 with enhanced visibility ── */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-[0] flex items-center">
        <div
          ref={marqueeRef}
          className="whitespace-nowrap select-none will-change-transform"
          style={{
            fontSize: "clamp(6rem, 16vw, 18rem)",
            fontFamily: "Orbitron, sans-serif",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            color: "transparent",
            WebkitTextStroke: "2px rgba(13,13,15,0.14)",
          }}
        >
          CONSTRUCTORS • FIA {season || 2026} • CONSTRUCTORS • FIA {season || 2026} • CONSTRUCTORS • FIA {season || 2026} •
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-[2] w-full min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-16 py-16 sm:py-20 md:py-24">

        {/* Section header */}
        <div className="mb-8 sm:mb-10 md:mb-14">
          <div className="section-index mb-2 sm:mb-3">
            03 &nbsp;/&nbsp; WORLD CONSTRUCTORS&apos; CHAMPIONSHIP
          </div>
          <div
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(2.2rem, 6vw, 7rem)", letterSpacing: "-0.03em" }}
          >
            CONSTRUCTORS&apos;
          </div>
          <div
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(2.2rem, 6vw, 7rem)", letterSpacing: "-0.03em" }}
          >
            CHAMPIONSHIP
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4">
            <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] text-ink-light uppercase">
              {constructors.length} TEAMS
            </div>
            <div className="w-8 sm:w-12 h-[1px] bg-ink-faint" />
            <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] text-ink-light uppercase">
              SEASON {season || 2026}
            </div>
            <div className="w-8 sm:w-12 h-[1px] bg-ink-faint" />
            <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] text-ink-light uppercase">
              ROUND {round || 12} / 24
            </div>
            <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isLive ? "bg-accent animate-pulse" : "bg-ink-light"}`} />
            <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] text-ink-light uppercase">
              {isLive ? "FIA VERIFIED LIVE" : "FIA ARCHIVE"}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[60px_50px_1fr_180px_80px_100px] gap-4 items-center mb-2 px-2">
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">POS</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase"></div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">CONSTRUCTOR</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">LINEUP</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase">WINS</div>
          <div className="font-mono text-[8px] tracking-[0.25em] text-ink-light uppercase text-right">POINTS</div>
        </div>

        <div className="classification-rule-accent" />

        {/* Classification rows */}
        <div>
          {displayConstructors.map((team, index) => {
            const colors = getTeamColors(team.team_name);
            const isP1 = index === 0;
            const isHovered = hoveredTeam === team.team_name;

            return (
              <React.Fragment key={team.team_name}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  onHoverStart={() => setHoveredTeam(team.team_name)}
                  onHoverEnd={() => setHoveredTeam(null)}
                  className="classification-row py-3.5 sm:py-4 md:py-5 px-1 sm:px-2 cursor-default"
                >
                  {/* Team color hover accent */}
                  <div
                    className="absolute left-0 top-0 bottom-0 transition-all duration-200"
                    style={{
                      width: isHovered ? "3px" : "2px",
                      backgroundColor: isHovered ? colors.primary : isP1 ? colors.primary : "transparent",
                      opacity: isHovered ? 1 : isP1 ? 0.6 : 0,
                    }}
                  />

                  {/* Mobile layout */}
                  <div className="md:hidden flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <span
                        className="font-display font-black text-ink-light text-sm sm:text-base flex-shrink-0"
                        style={{ color: isP1 ? colors.primary : undefined }}
                      >
                        P{team.position}
                      </span>
                      <ConstructorLogo teamName={team.team_name} size={20} />
                      <div className="min-w-0">
                        <div
                          className="font-display font-black text-ink uppercase text-sm sm:text-base truncate"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          {team.team_name}
                        </div>
                        <div className="font-mono text-[8px] sm:text-[9px] tracking-wider text-ink-light uppercase mt-0.5 truncate">
                          {team.driver_codes.join(" · ")} &nbsp;·&nbsp; {team.wins}W
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className="font-display font-black text-ink text-lg sm:text-xl"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {team.points}
                      </div>
                      <div className="font-mono text-[7.5px] sm:text-[8px] tracking-widest text-ink-light uppercase">PTS</div>
                    </div>
                  </div>

                  {/* Desktop editorial row */}
                  <div className="hidden md:grid grid-cols-[60px_50px_1fr_180px_80px_100px] gap-4 items-center">
                    {/* Position */}
                    <div
                      className="font-display font-black uppercase"
                      style={{
                        fontSize: "clamp(1rem, 2.5vw, 2rem)",
                        letterSpacing: "-0.03em",
                        color: isP1 ? colors.primary : "var(--ink-light)",
                      }}
                    >
                      P{team.position}
                    </div>

                    {/* Constructor Logo in between POS and CONSTRUCTOR */}
                    <div className="flex items-center">
                      <ConstructorLogo teamName={team.team_name} size={28} />
                    </div>

                    {/* Team name — without progression bar */}
                    <div>
                      <div
                        className="font-display font-black text-ink uppercase"
                        style={{
                          fontSize: "clamp(1.2rem, 2.2vw, 2.5rem)",
                          letterSpacing: "-0.025em",
                          lineHeight: 1,
                        }}
                      >
                        {team.team_name}
                      </div>
                    </div>

                    {/* Driver lineup */}
                    <div className="font-mono text-xs text-ink-mid tracking-[0.1em] uppercase">
                      {team.driver_codes.join(" · ")}
                    </div>

                    {/* Wins */}
                    <div>
                      <div className="font-display font-bold text-ink" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                        {team.wins}
                      </div>
                      <div className="font-mono text-[8px] text-ink-light uppercase tracking-widest">
                        {team.wins === 1 ? "WIN" : "WINS"}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div
                        className="font-display font-black text-ink"
                        style={{ fontSize: "clamp(1.2rem, 2.2vw, 2.5rem)", letterSpacing: "-0.03em" }}
                      >
                        {team.points}
                      </div>
                      <div className="font-mono text-[8px] text-ink-light uppercase tracking-widest">PTS</div>
                    </div>
                  </div>
                </motion.div>

                <div className={isP1 ? "classification-rule-accent" : "classification-rule"} />
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="font-mono text-[8px] sm:text-[9px] tracking-[0.2em] text-ink-light uppercase">
            SHOWING {displayConstructors.length} OF {constructors.length} CONSTRUCTORS
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="group flex items-center gap-2 sm:gap-3 font-display font-bold text-xs tracking-[0.15em] uppercase text-ink hover:text-accent transition-colors duration-200"
          >
            <span>VIEW ALL CONSTRUCTORS</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      <StandingsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        type="constructors"
        constructors={constructors}
        season={season}
        round={round}
      />
    </section>
  );
}
