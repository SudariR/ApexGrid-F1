"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "div";
}

export function GlitchText({ text, className, as: Component = "span" }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  return (
    <Component
      onMouseEnter={() => setIsGlitching(true)}
      onMouseLeave={() => setIsGlitching(false)}
      className={cn("relative inline-block cursor-default select-none", className)}
    >
      <span className="relative z-10">{text}</span>
      {isGlitching && (
        <>
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 -translate-x-[2px] translate-y-[1px] text-[#00F0FF] opacity-80 z-0 pointer-events-none select-none mix-blend-screen animate-pulse"
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 translate-x-[2px] -translate-y-[1px] text-[#FF1801] opacity-80 z-0 pointer-events-none select-none mix-blend-screen animate-pulse"
          >
            {text}
          </span>
        </>
      )}
    </Component>
  );
}
