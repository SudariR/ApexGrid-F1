"use client";

import useSWR from "swr";
import { fetchStandings } from "@/lib/api";
import { StandingsResponse, DriverStanding, ConstructorStanding } from "@/types/f1";
import { MOCK_DRIVERS_STANDINGS, MOCK_CONSTRUCTORS_STANDINGS } from "@/lib/mockData";

export function useStandings(season?: number) {
  const key = `standings-${season || "latest"}`;
  const { data, error, isLoading, mutate } = useSWR<StandingsResponse & { _isLive?: boolean }>(
    key,
    () => fetchStandings(season),
    {
      fallbackData: {
        season: 2026,
        round: 12,
        drivers: MOCK_DRIVERS_STANDINGS,
        constructors: MOCK_CONSTRUCTORS_STANDINGS,
        _isLive: false,
      },
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const standings = data || {
    season: 2026,
    round: 12,
    drivers: MOCK_DRIVERS_STANDINGS,
    constructors: MOCK_CONSTRUCTORS_STANDINGS,
  };

  return {
    season: standings.season,
    round: standings.round,
    drivers: standings.drivers,
    constructors: standings.constructors,
    isLive: Boolean(data?._isLive),
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useDriverStandings(season?: number) {
  const { drivers, season: s, round: r, isLive, isLoading, isError, refresh } = useStandings(season);
  return {
    drivers,
    season: s,
    round: r,
    isLive,
    isLoading,
    isError,
    refresh,
  };
}

export function useConstructorStandings(season?: number) {
  const { constructors, season: s, round: r, isLive, isLoading, isError, refresh } = useStandings(season);
  return {
    constructors,
    season: s,
    round: r,
    isLive,
    isLoading,
    isError,
    refresh,
  };
}
