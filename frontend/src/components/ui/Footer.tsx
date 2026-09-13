"use client";

import React from "react";

export function Footer() {
  return (
    <footer
      className="w-full px-6 md:px-10 py-8 flex items-center justify-between"
      style={{
        backgroundColor: "#0D0D0F",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div>
        <div className="font-display font-black text-[#F0F0EC] text-sm tracking-tight uppercase">
          APEX<span className="text-accent">GRID</span>
        </div>
        <div className="font-mono text-[8px] tracking-[0.25em] text-[#444444] uppercase mt-0.5">
          F1 CHAMPIONSHIP · 2026 SEASON
        </div>
      </div>

      <div className="font-mono text-[8px] tracking-[0.2em] text-[#444444] uppercase text-right">
        <div>DATA POWERED BY FASTF1 API</div>
        <div className="mt-0.5 text-[#333333]">FIA OFFICIAL RACE DATA</div>
      </div>
    </footer>
  );
}
