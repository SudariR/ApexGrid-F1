import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "ApexGrid F1 | Next-Gen Championship & Race Experience",
  description: "An immersive Formula 1 editorial experience — championship standings, race telemetry and motor racing engineering visualization.",
  keywords: ["Formula 1", "F1 2026", "Lando Norris", "McLaren", "ApexGrid", "Championship"],
  authors: [{ name: "ApexGrid Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink antialiased overflow-x-hidden selection:bg-accent selection:text-ink">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
