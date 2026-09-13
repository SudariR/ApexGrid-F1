"use client";

import useSWR from "swr";
import { fetchTeammateDuels } from "@/lib/api";
import type { HeadToHeadResponse } from "@/types/analytics";

/**
 * Auto-fetches head-to-head teammate data on mount.
 * Cached by SWR — one request per season per session.
 */
export function useHeadToHead(season?: number) {
  const key = `headtohead-${season ?? "latest"}`;
  const { data, error, isLoading, mutate } = useSWR<HeadToHeadResponse>(
    key,
    () => fetchTeammateDuels(season),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    error: error as Error | null,
    refresh: mutate,
  };
}
