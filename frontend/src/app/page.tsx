import { Navbar } from "@/components/ui/Navbar";
import { HeroSection } from "@/components/hero/HeroSection";
import { DriversStandings } from "@/components/standings/DriversStandings";
import { ConstructorsStandings } from "@/components/standings/ConstructorsStandings";
import { SeasonTimeline } from "@/components/timeline/SeasonTimeline";
import { Footer } from "@/components/ui/Footer";

export default function Home() {
  return (
    <main className="relative bg-bg text-ink overflow-x-hidden selection:bg-accent selection:text-ink">
      <Navbar />
      <HeroSection />
      <DriversStandings />
      <ConstructorsStandings />
      <SeasonTimeline />
      <Footer />
    </main>
  );
}
