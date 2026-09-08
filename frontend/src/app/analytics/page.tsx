import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";

export const metadata: Metadata = {
  title: "Analytics | ApexGrid F1",
  description:
    "Advanced F1 performance intelligence — race pace consistency, tyre degradation, teammate qualifying Elo, and Monte Carlo championship simulation.",
  keywords: [
    "F1 analytics",
    "Formula 1 pace",
    "tyre degradation",
    "championship predictor",
    "Monte Carlo simulation",
    "ApexGrid",
  ],
};

export default function AnalyticsRoute() {
  return (
    <main className="relative bg-bg text-ink overflow-x-hidden selection:bg-accent selection:text-ink">
      <Navbar />
      <AnalyticsPage />
      <Footer />
    </main>
  );
}
