"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import type {
  PaceResponse,
  TireDegradationResponse,
  PredictResponse,
  SessionType,
  DriverOverride,
} from "@/types/analytics";
import {
  fetchPaceAnalytics,
  fetchTireDegradation,
  runSimulation,
} from "@/lib/api";
import { useHeadToHead } from "@/lib/hooks/useAnalytics";
import { useDriverStandings } from "@/lib/hooks/useStandings";

import { AnalyticsControls } from "./AnalyticsControls";
import { PaceConsistencyChart } from "./PaceConsistencyChart";
import { TireDegradationChart } from "./TireDegradationChart";
import { TeammateEloGrid } from "./TeammateEloGrid";
import { SectionHeader } from "./analyticsUtils";
import { ScenarioControls } from "@/components/predictor/ScenarioControls";
import { SimulationDashboard } from "@/components/predictor/SimulationDashboard";

type Preset = "current" | "reliability-nightmare" | "challenger-surge";

function buildInitialOverrides(drivers: { driver_code: string; full_name: string; team_name: string }[]): DriverOverride[] {
  return drivers.map((d) => ({
    code: d.driver_code,
    full_name: d.full_name,
    team_name: d.team_name,
    rating: 1.0,
    dnf_probability: 0.05,
  }));
}

export function AnalyticsPage() {
  // ── Race/session selection state ──────────────────────────────────
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [compareDriver, setCompareDriver] = useState<string | null>(null);
  const [session, setSession] = useState<SessionType>("R");

  // ── Pace analytics state ──────────────────────────────────────────
  const [paceData, setPaceData] = useState<PaceResponse | null>(null);
  const [compareData, setCompareData] = useState<PaceResponse | null>(null);
  const [paceLoading, setPaceLoading] = useState(false);
  const [paceError, setPaceError] = useState<string | null>(null);

  // ── Tire degradation state ────────────────────────────────────────
  const [tireData, setTireData] = useState<TireDegradationResponse | null>(null);
  const [tireLoading, setTireLoading] = useState(false);
  const [tireError, setTireError] = useState<string | null>(null);

  // ── Head-to-head (auto-loaded) ───────────────────────────────────
  const {
    data: h2hData,
    isLoading: h2hLoading,
    isError: h2hError,
    error: h2hErrMsg,
  } = useHeadToHead();

  // ── Predictor state ───────────────────────────────────────────────
  const { drivers: driverList } = useDriverStandings();
  const [overrides, setOverrides] = useState<DriverOverride[]>([]);
  const [nSimulations, setNSimulations] = useState(10000);
  const [remainingRaces, setRemainingRaces] = useState(12);
  const [baselineResult, setBaselineResult] = useState<PredictResponse | null>(null);
  const [scenarioResult, setScenarioResult] = useState<PredictResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  // Initialize overrides when driver list loads
  React.useEffect(() => {
    if (driverList.length > 0 && overrides.length === 0) {
      setOverrides(buildInitialOverrides(driverList));
    }
  }, [driverList, overrides.length]);

  // ── Analyze handler ───────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!selectedRound || !selectedDriver) return;
    setPaceLoading(true);
    setTireLoading(true);
    setPaceError(null);
    setTireError(null);
    setPaceData(null);
    setTireData(null);
    setCompareData(null);

    // Fetch pace + tire in parallel for primary driver
    const [paceRes, tireRes] = await Promise.allSettled([
      fetchPaceAnalytics(selectedDriver, selectedRound, undefined, session),
      fetchTireDegradation(selectedDriver, selectedRound, undefined, session),
    ]);

    if (paceRes.status === "fulfilled") {
      setPaceData(paceRes.value);
    } else {
      setPaceError((paceRes.reason as Error)?.message ?? "Pace data unavailable.");
    }
    setPaceLoading(false);

    if (tireRes.status === "fulfilled") {
      setTireData(tireRes.value);
    } else {
      setTireError((tireRes.reason as Error)?.message ?? "Tire data unavailable.");
    }
    setTireLoading(false);

    // Optional compare driver
    if (compareDriver) {
      try {
        const cmpPace = await fetchPaceAnalytics(compareDriver, selectedRound, undefined, session);
        setCompareData(cmpPace);
      } catch {
        // Compare failure is non-fatal — just hide it
        setCompareData(null);
      }
    }
  }, [selectedRound, selectedDriver, compareDriver, session]);

  // ── Preset handler ────────────────────────────────────────────────
  const handleApplyPreset = useCallback(
    (preset: Preset) => {
      setOverrides((prev) =>
        prev.map((ov) => {
          if (preset === "current") {
            return { ...ov, rating: 1.0, dnf_probability: 0.05 };
          } else if (preset === "reliability-nightmare") {
            return { ...ov, dnf_probability: 0.15 };
          } else if (preset === "challenger-surge") {
            // Determine if "midfield" by rough position in driver list
            const pos = driverList.findIndex((d) => d.driver_code === ov.code);
            const isMidfield = pos >= 5;
            return { ...ov, rating: isMidfield ? Math.min(4.0, (ov.rating ?? 1.0) + 0.5) : ov.rating };
          }
          return ov;
        })
      );
    },
    [driverList]
  );

  // ── Simulation handler ────────────────────────────────────────────
  const handleRunSimulation = useCallback(async () => {
    setSimLoading(true);
    setSimError(null);

    const request = {
      n_simulations: nSimulations,
      remaining_races: remainingRaces,
      overrides: overrides
        .filter((ov) => ov.rating !== 1.0 || ov.dnf_probability !== 0.05)
        .map((ov) => ({
          code: ov.code,
          rating: ov.rating,
          dnf_probability: ov.dnf_probability,
        })),
    };

    try {
      // Run baseline (no overrides) only if not yet done
      let baseline = baselineResult;
      if (!baseline) {
        baseline = await runSimulation({
          n_simulations: nSimulations,
          remaining_races: remainingRaces,
          overrides: [],
        });
        setBaselineResult(baseline);
      }

      // Run scenario
      const result = await runSimulation(request);
      setScenarioResult(result);
    } catch (err) {
      setSimError((err as Error)?.message ?? "Simulation failed.");
    } finally {
      setSimLoading(false);
    }
  }, [nSimulations, remainingRaces, overrides, baselineResult]);

  const buildRequest = useCallback(
    () => ({
      n_simulations: nSimulations,
      remaining_races: remainingRaces,
      overrides: overrides.map((ov) => ({
        code: ov.code,
        rating: ov.rating,
        dnf_probability: ov.dnf_probability,
      })),
    }),
    [nSimulations, remainingRaces, overrides]
  );

  const handleRatingChange = useCallback((code: string, value: number) => {
    setOverrides((prev) =>
      prev.map((ov) => (ov.code === code ? { ...ov, rating: value } : ov))
    );
  }, []);

  const handleDnfChange = useCallback((code: string, value: number) => {
    setOverrides((prev) =>
      prev.map((ov) => (ov.code === code ? { ...ov, dnf_probability: value } : ov))
    );
  }, []);

  const isAnalyzing = paceLoading || tireLoading;

  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="relative pt-28 pb-12 px-6 md:px-10 bg-engineering-grid border-b border-[rgba(13,13,15,0.08)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[9px] tracking-[0.25em] text-ink-light uppercase">
              05 · INTELLIGENCE
            </span>
            <div className="h-px w-8 bg-accent" />
          </div>
          <h1
            className="font-display text-5xl md:text-7xl font-black tracking-tight uppercase leading-none text-ink mb-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            ANALYTICS
          </h1>
          <p className="font-mono text-[11px] text-ink-mid tracking-wide max-w-xl">
            Advanced F1 performance intelligence — race pace, tyre compounds,
            teammate qualifying battles and Monte Carlo championship simulation.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col gap-14">

        {/* ── SECTION 1: Race / Driver Controls ─────────────────────── */}
        <section>
          <SectionHeader
            index="01"
            title="RACE · DRIVER · SESSION"
            subtitle="Select a completed race and driver to load pace consistency and tyre degradation data."
          />
          <AnalyticsControls
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
            selectedDriver={selectedDriver}
            onDriverChange={setSelectedDriver}
            compareDriver={compareDriver}
            onCompareDriverChange={setCompareDriver}
            selectedSession={session}
            onSessionChange={setSession}
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
          />
        </section>

        {/* ── SECTION 2: Pace Consistency ───────────────────────────── */}
        <section>
          <SectionHeader
            index="02"
            title="PACE CONSISTENCY"
            subtitle="Kernel density estimate of clean lap times. Lower CV = more consistent driver."
          />
          <PaceConsistencyChart
            primary={paceData}
            compare={compareData}
            isLoading={paceLoading}
            isError={!!paceError}
            errorMsg={paceError ?? undefined}
            onRetry={handleAnalyze}
          />
        </section>

        {/* ── SECTION 3: Tyre Degradation ──────────────────────────── */}
        <section>
          <SectionHeader
            index="03"
            title="TYRE DEGRADATION"
            subtitle="Linear regression of lap time vs tyre age per stint. Slope = seconds lost per additional lap."
          />
          <TireDegradationChart
            data={tireData}
            isLoading={tireLoading}
            isError={!!tireError}
            errorMsg={tireError ?? undefined}
            onRetry={handleAnalyze}
          />
        </section>

        {/* ── SECTION 4: Teammate Head-to-Head / Elo ───────────────── */}
        <section>
          <SectionHeader
            index="04"
            title="TEAMMATE ELO · HEAD-TO-HEAD"
            subtitle="Season-long qualifying battles. Elo ratings reflect cumulative head-to-head qualifying performance."
          />
          <TeammateEloGrid
            data={h2hData ?? null}
            isLoading={h2hLoading}
            isError={h2hError}
            errorMsg={h2hErrMsg?.message ?? undefined}
          />
        </section>

        {/* ── SECTION 5: Monte Carlo Predictor ─────────────────────── */}
        <section>
          <SectionHeader
            index="05"
            title="CHAMPIONSHIP PREDICTOR"
            subtitle="Monte Carlo simulation of remaining season. Configure what-if scenarios and compare to baseline."
            badge={
              <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-1 border border-[rgba(13,13,15,0.12)] text-ink-light">
                MONTE CARLO
              </span>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: scenario controls */}
            <div>
              <ScenarioControls
                overrides={overrides}
                onRatingChange={handleRatingChange}
                onDnfChange={handleDnfChange}
                onApplyPreset={handleApplyPreset}
                nSimulations={nSimulations}
                onNSimChange={setNSimulations}
                remainingRaces={remainingRaces}
                onRemainingRacesChange={(n) => {
                  setRemainingRaces(n);
                  // Clear baseline so it re-runs with new remaining races
                  setBaselineResult(null);
                }}
                onRun={handleRunSimulation}
                isRunning={simLoading}
                buildRequest={buildRequest}
              />
            </div>
            {/* Right: results */}
            <div>
              <SimulationDashboard
                baseline={baselineResult}
                scenario={scenarioResult}
                isLoading={simLoading}
                isError={!!simError}
                errorMsg={simError ?? undefined}
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
