"use client";

import useSWR from "swr";
import { fetchHeroData } from "@/lib/api";
import { HeroResponse } from "@/types/f1";
import { MOCK_HERO_DATA } from "@/lib/mockData";

export function useHeroData(season?: number, round?: number) {
  const key = `hero-latest-${season ?? "latest"}-${round ?? "latest"}`;
  const { data, error, isLoading, mutate } = useSWR<HeroResponse & { _isLive?: boolean }>(
    key,
    () => fetchHeroData(season, round),
    {
      fallbackData: { ...MOCK_HERO_DATA, _isLive: false },
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const hero = data || MOCK_HERO_DATA;
  const isLive = Boolean(data?._isLive);

  return {
    hero,
    isLoading,
    isLive,
    isError: !!error,
    refresh: mutate,
  };
}
