import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { weatherRepository } from "../repositories/WeatherRepository";
import type { MetarData, TafData } from "../types";

const RECENT_STATIONS_KEY = "weather_recent_stations";
const DEFAULT_STATIONS = ["KJFK", "KLAX", "EGLL", "LFPG"];

export function useWeather() {
  const [station, setStation] = useState("");
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [recentStations, setRecentStations] = useState<string[]>(DEFAULT_STATIONS);
  const [showTaf, setShowTaf] = useState(false);

  const {
    data: metar,
    isLoading: metarLoading,
    error: metarError,
    refetch: refetchMetar,
  } = useQuery({
    queryKey: ["metar", activeStation],
    queryFn: async () => {
      if (!activeStation) return null;
      const result = await weatherRepository.fetchMetar(activeStation);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!activeStation,
    staleTime: 1000 * 60 * 5, // 5 min
    refetchInterval: 1000 * 60 * 5,
  });

  const {
    data: taf,
    isLoading: tafLoading,
    error: tafError,
  } = useQuery({
    queryKey: ["taf", activeStation],
    queryFn: async () => {
      if (!activeStation) return null;
      const result = await weatherRepository.fetchTaf(activeStation);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!activeStation && showTaf,
    staleTime: 1000 * 60 * 10,
  });

  const searchStation = useCallback((icao: string) => {
    const normalized = icao.trim().toUpperCase();
    if (normalized.length !== 4) return;
    setActiveStation(normalized);
    setRecentStations((prev) => {
      const filtered = prev.filter((s) => s !== normalized);
      return [normalized, ...filtered].slice(0, 8);
    });
  }, []);

  const refresh = useCallback(() => {
    refetchMetar();
  }, [refetchMetar]);

  return {
    station,
    setStation,
    activeStation,
    metar: metar ?? null,
    taf: taf ?? null,
    metarLoading,
    tafLoading,
    metarError: metarError?.message ?? null,
    tafError: tafError?.message ?? null,
    recentStations,
    showTaf,
    setShowTaf,
    searchStation,
    refresh,
  };
}
