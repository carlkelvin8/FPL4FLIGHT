import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { notamRepository } from "../repositories/NotamRepository";
import type { Notam } from "../types";

const DEFAULT_AIRPORTS = ["RPLL", "RPVM", "RPUB", "RPLC", "RPVP"];

export function useNotams() {
  const [icao, setIcao] = useState("");
  const [activeAirport, setActiveAirport] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_AIRPORTS);

  const query = useQuery({
    queryKey: ["notams", activeAirport],
    queryFn: async (): Promise<Notam[]> => {
      if (!activeAirport) return [];
      const result = await notamRepository.fetchForAirport(activeAirport);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!activeAirport,
    staleTime: 1000 * 60 * 10,
  });

  const search = useCallback((code: string) => {
    const airport = code.trim().toUpperCase();
    if (airport.length !== 4) return;
    setActiveAirport(airport);
    setRecentSearches((prev) => [airport, ...prev.filter((s) => s !== airport)].slice(0, 6));
  }, []);

  const refresh = useCallback(() => {
    if (activeAirport) {
      query.refetch();
    }
  }, [activeAirport, query]);

  return {
    icao,
    setIcao,
    activeAirport,
    notams: query.data ?? [],
    isLoading: query.isLoading || query.isFetching,
    error: query.error?.message ?? null,
    recentSearches,
    search,
    refresh,
  };
}
