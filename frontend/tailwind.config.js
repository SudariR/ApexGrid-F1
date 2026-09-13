/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5F5F0",
        "bg-alt": "#EBEBEB",
        ink: "#0D0D0F",
        "ink-mid": "#5C5C60",
        "ink-light": "#999999",
        "ink-faint": "#CBCBC8",
        accent: "#00FF66",
        surface: "#FFFFFF",
        teams: {
          mclaren: "#FF8000",
          ferrari: "#E8002D",
          redbull: "#1E41B0",
          mercedes: "#00D2BE",
          astonmartin: "#006F62",
          alpine: "#FF87BC",
          williams: "#00A0DE",
          vcarb: "#6692FF",
          sauber: "#52E252",
          haas: "#B6BABD",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        monumental: ["clamp(6rem,18vw,20rem)", { lineHeight: "0.88", letterSpacing: "-0.04em" }],
        editorial: ["clamp(3.5rem,8vw,9rem)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "display-xl": ["clamp(2.5rem,5vw,6rem)", { lineHeight: "0.95", letterSpacing: "-0.025em" }],
        classification: ["clamp(1.8rem,3vw,3.5rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      letterSpacing: {
        tightest: "-0.06em",
        widest: "0.2em",
      },
      animation: {
        "draw-track": "drawTrack 2.4s ease-out 0.3s forwards",
        "pulse-accent": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
