"use client";

import useSWR from "swr";
import { fetchSchedule } from "@/lib/api";
import { F1_2026_CALENDAR } from "@/lib/calendarData";
import { RaceEvent, BackendScheduleResponse } from "@/types/calendar";

export function useTimelineData(season?: number) {
  const key = `schedule-${season || "latest"}`;
  const { data, error, isLoading, mutate } = useSWR<
    BackendScheduleResponse & { _isLive?: boolean }
  >(key, () => fetchSchedule(season), {
    revalidateOnFocus: true,
    dedupingInterval: 15000,
  });

  const isLive = Boolean(data?._isLive);
  const backendEvents = data?.events || [];

  // Determine current round strictly
  const currentRound =
    data?.current_round ||
    backendEvents.find((e) => e.status === "current")?.round ||
    13;

  // Merge backend schedule data into the rich local calendar (which contains SVG paths & coordinates)
  const events: RaceEvent[] = F1_2026_CALENDAR.map((calEvent) => {
    const backendMatch = backendEvents.find(
      (be) =>
        be.round === calEvent.round ||
        be.event_name.toLowerCase().includes(calEvent.event_name.toLowerCase()) ||
        calEvent.event_name.toLowerCase().includes(be.event_name.toLowerCase()) ||
        be.location.toLowerCase().includes(calEvent.location.toLowerCase()) ||
        calEvent.location.toLowerCase().includes(be.location.toLowerCase())
    );

    // Authoritative status based strictly on currentRound
    const status: "completed" | "current" | "upcoming" =
      calEvent.round === currentRound
        ? "current"
        : calEvent.round < currentRound
        ? "completed"
        : "upcoming";

    if (!backendMatch) {
      return {
        ...calEvent,
        status,
      };
    }

    return {
      ...calEvent,
      status,
      winner: (backendMatch.winner as any) || calEvent.winner,
      race_date: backendMatch.race_date || calEvent.race_date,
      event_name: backendMatch.event_name || calEvent.event_name,
      country: backendMatch.country || calEvent.country,
      location: backendMatch.location || calEvent.location,
    };
  });

  return {
    events,
    season: data?.season || season || 2026,
    totalRounds: data?.total_rounds || events.length,
    currentRound,
    isLive,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
