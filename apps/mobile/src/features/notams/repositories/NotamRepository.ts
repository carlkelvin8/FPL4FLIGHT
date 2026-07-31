import { ok, err, type Result } from "@pilotforms/shared";

import type { Notam } from "../types";

interface RawNotam {
  notamId?: string;
  notamNumber?: string;
  traditionalMessage?: string;
  text?: string;
  raw?: string;
  classification?: string;
  type?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  endDate?: string;
  icaoLocation?: string;
}

const NOTAM_MAX_RESULTS = 50;

/**
 * NotamRepository fetches active NOTAMs for an ICAO airport from the free
 * NOAA aviationweather.gov endpoint (no API key required).
 */
export class NotamRepository {
  async fetchForAirport(icao: string): Promise<Result<Notam[]>> {
    try {
      const airport = icao.trim().toUpperCase();
      if (!/^[A-Z]{4}$/.test(airport)) {
        return err("VALIDATION", "Invalid ICAO code. Must be exactly 4 letters (e.g. RPLL).");
      }

      const url = `https://aviationweather.gov/api/data/notam?icao=${airport}&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        return err("NETWORK_ERROR", `Failed to fetch NOTAMs (HTTP ${response.status}).`);
      }

      const data = (await response.json()) as RawNotam[];
      if (!Array.isArray(data) || data.length === 0) {
        return err("NOT_FOUND", `No active NOTAMs for ${airport}.`);
      }

      return ok(
        data.slice(0, NOTAM_MAX_RESULTS).map((n, i) => ({
          id: n.notamId ?? String(i),
          number: n.notamNumber ?? n.notamId ?? `${airport}/${i + 1}`,
          text: n.traditionalMessage ?? n.text ?? n.raw ?? "No details",
          type: n.classification ?? n.type ?? "NOTAM",
          effectiveStart: n.effectiveStart ?? "",
          effectiveEnd: n.effectiveEnd ?? n.endDate ?? "PERM",
          location: n.icaoLocation ?? airport,
        })),
      );
    } catch {
      return err("NETWORK_ERROR", "Network error while fetching NOTAMs.");
    }
  }
}

export const notamRepository = new NotamRepository();
