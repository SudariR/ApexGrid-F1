"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { DriverStanding, ConstructorStanding } from "@/types/f1";
import { getTeamColors } from "@/lib/teamColors";

import { ConstructorLogo } from "@/components/ui/ConstructorLogo";

interface StandingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: "drivers" | "constructors";
  drivers?: DriverStanding[];
  constructors?: ConstructorStanding[];
  season?: number;
  round?: number;
}

export function StandingsDrawer({
  isOpen,
  onClose,
  type,
  drivers = [],
  constructors = [],
  season,
  round,
}: StandingsDrawerProps) {
  const isDriver = type === "drivers";
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and pause Lenis while drawer is open
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;

    if (isOpen) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      lenis?.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-lenis-prevent="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer — dark editorial */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            data-lenis-prevent="true"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col shadow-2xl"
            style={{ backgroundColor: "#0D0D0F", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Header */}
            <div
              className="px-4 sm:px-8 py-5 sm:py-7 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <div className="font-mono text-[8px] sm:text-[9px] tracking-[0.25em] text-[#999999] uppercase mb-1 sm:mb-1.5">
                  FIA OFFICIAL · {season || 2026} · ROUND {round || 12}/24
                </div>
                <h3
                  className="font-display font-black text-[#F0F0EC] uppercase text-base sm:text-xl md:text-2xl"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {isDriver ? "DRIVERS'" : "CONSTRUCTORS'"} CHAMPIONSHIP
                </h3>
              </div>

              <button
                onClick={onClose}
                className="font-mono text-[8px] sm:text-[9px] tracking-[0.2em] text-[#999999] hover:text-[#F0F0EC] uppercase transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2"
                aria-label="Close standings"
              >
                <X className="w-3.5 h-3.5" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* Column header */}
            <div
              className="px-4 sm:px-8 py-2.5 sm:py-3 grid grid-cols-[28px_1fr_68px_48px] sm:grid-cols-[40px_1fr_120px_60px] gap-2 sm:gap-4 items-center"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {["POS", isDriver ? "DRIVER" : "TEAM", isDriver ? "WINS / POD" : "LINEUP", "PTS"].map((col, idx) => (
                <div
                  key={col}
                  className={`font-mono text-[7px] sm:text-[8px] tracking-[0.2em] text-[#555555] uppercase ${
                    idx === 3 ? "text-right" : ""
                  }`}
                >
                  {col}
                </div>
              ))}
            </div>

            {/* Classification list */}
            <div
              ref={scrollContainerRef}
              data-lenis-prevent="true"
              className="flex-1 overflow-y-auto overscroll-contain"
            >
              {isDriver
                ? drivers.map((d) => {
                    return (
                      <div
                        key={d.driver_code}
                        className="px-4 sm:px-8 py-3 sm:py-4 grid grid-cols-[28px_1fr_68px_48px] sm:grid-cols-[40px_1fr_120px_60px] gap-2 sm:gap-4 items-center group transition-colors duration-150 hover:bg-white/[0.03]"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {/* Position */}
                        <div
                          className="font-display font-black text-sm sm:text-base"
                          style={{
                            letterSpacing: "-0.03em",
                            color: d.position === 1 ? "#00FF66" : "rgba(240,240,236,0.3)",
                          }}
                        >
                          P{d.position}
                        </div>

                        {/* Driver name */}
                        <div className="min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <ConstructorLogo teamName={d.team_name} size={15} />
                            <div
                              className="font-display font-bold text-[#F0F0EC] uppercase text-xs sm:text-[0.95rem] truncate"
                              style={{ letterSpacing: "-0.015em" }}
                            >
                              {d.full_name}
                            </div>
                          </div>
                          <div className="font-mono text-[7.5px] sm:text-[8px] tracking-[0.15em] text-[#666666] uppercase mt-0.5 pl-5 sm:pl-6 truncate">
                            {d.team_name} &nbsp;·&nbsp; #{d.driver_number || "--"}
                          </div>
                        </div>

                        {/* Wins / Podiums */}
                        <div className="font-mono text-[8.5px] sm:text-[10px] text-[#F0F0EC] whitespace-nowrap">
                          {d.wins}W{d.podiums !== undefined ? ` · ${d.podiums}P` : ""}
                        </div>

                        {/* Points */}
                        <div className="text-right whitespace-nowrap">
                          <span
                            className="font-display font-black text-[#F0F0EC] text-xs sm:text-base"
                            style={{ letterSpacing: "-0.02em" }}
                          >
                            {d.points}
                          </span>
                          <span className="font-mono text-[7px] sm:text-[8px] text-[#555555] ml-0.5 sm:ml-1">PTS</span>
                        </div>
                      </div>
                    );
                  })
                : constructors.map((c) => {
                    return (
                      <div
                        key={c.team_name}
                        className="px-4 sm:px-8 py-3 sm:py-4 grid grid-cols-[28px_1fr_68px_48px] sm:grid-cols-[40px_1fr_120px_60px] gap-2 sm:gap-4 items-center group transition-colors duration-150 hover:bg-white/[0.03]"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {/* Position */}
                        <div
                          className="font-display font-black text-sm sm:text-base"
                          style={{
                            letterSpacing: "-0.03em",
                            color: c.position === 1 ? "#00FF66" : "rgba(240,240,236,0.3)",
                          }}
                        >
                          P{c.position}
                        </div>

                        {/* Team + Logo */}
                        <div className="min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 sm:gap-2.5">
                            <ConstructorLogo teamName={c.team_name} size={16} />
                            <div
                              className="font-display font-bold text-[#F0F0EC] uppercase text-xs sm:text-[0.95rem] truncate"
                              style={{ letterSpacing: "-0.015em" }}
                            >
                              {c.team_name}
                            </div>
                          </div>
                        </div>

                        {/* Lineup */}
                        <div className="font-mono text-[8.5px] sm:text-[10px] text-[#666666] uppercase tracking-wider whitespace-nowrap">
                          {c.driver_codes && c.driver_codes.length > 0
                            ? c.driver_codes.join(" · ")
                            : "--"}
                        </div>

                        {/* Points */}
                        <div className="text-right whitespace-nowrap">
                          <span
                            className="font-display font-black text-[#F0F0EC] text-xs sm:text-base"
                            style={{ letterSpacing: "-0.02em" }}
                          >
                            {c.points}
                          </span>
                          <span className="font-mono text-[7px] sm:text-[8px] text-[#555555] ml-0.5 sm:ml-1">PTS</span>
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* Footer */}
            <div
              className="px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="font-mono text-[7.5px] sm:text-[8px] tracking-[0.2em] text-[#444444] uppercase">
                DATA · FASTF1 API · FIA VERIFIED
              </div>
              <div
                className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
