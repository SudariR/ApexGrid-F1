"use client";

import React from "react";
import { Flag } from "lucide-react";

interface SectionDividerProps {
  index: string;
  title: string;
  nextSectionId?: string;
}

export function SectionDivider({ index, title }: SectionDividerProps) {
  return (
    <div className="relative w-full py-4 z-20 select-none">
      <div className="section-divider-line w-full" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-3.5 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-mono tracking-widest text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
          <span className="font-bold text-black">{index}</span>
          <span className="text-slate-400">//</span>
          <span className="uppercase text-[11px] font-semibold tracking-wider">{title}</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <Flag className="w-3.5 h-3.5 text-[#00FF66]" />
          <span>APEXGRID FIA F1 WORLD CHAMPIONSHIP</span>
        </div>
      </div>
    </div>
  );
}
