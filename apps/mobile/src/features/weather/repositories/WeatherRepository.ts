import { ok, err, type Result } from "@pilotforms/shared";

import type { MetarData, TafData, CloudLayer } from "../types";

const AVWX_BASE = "https://avwx.rest/api";

/**
 * WeatherRepository fetches METAR and TAF data from the AVWX API.
 *
 * Note: In production, proxy through your own backend to avoid exposing API keys.
 * For now, we use the public CheckWX endpoint as a fallback parser.
 */
export class WeatherRepository {
  /**
   * Fetch METAR for a given ICAO station using the public aviationweather.gov text endpoint.
   * This is a free, no-auth endpoint.
   */
  async fetchMetar(station: string): Promise<Result<MetarData>> {
    try {
      const icao = station.trim().toUpperCase();
      if (!/^[A-Z]{4}$/.test(icao)) {
        return err("VALIDATION", "Invalid ICAO code. Must be exactly 4 letters (e.g. KJFK).");
      }

      const url = `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        return err("NETWORK_ERROR", `Failed to fetch METAR (${response.status}).`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return err("NOT_FOUND", `No METAR found for station ${icao}.`);
      }

      const metar = data[0];
      return ok(this.parseAvWeatherMetar(metar, icao));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching METAR.", e);
    }
  }

  /**
   * Fetch TAF for a given ICAO station.
   */
  async fetchTaf(station: string): Promise<Result<TafData>> {
    try {
      const icao = station.trim().toUpperCase();
      if (!/^[A-Z]{4}$/.test(icao)) {
        return err("VALIDATION", "Invalid ICAO code. Must be exactly 4 letters.");
      }

      const url = `https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        return err("NETWORK_ERROR", `Failed to fetch TAF (${response.status}).`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return err("NOT_FOUND", `No TAF found for station ${icao}.`);
      }

      const taf = data[0];
      return ok({
        station: icao,
        raw: taf.rawOb ?? taf.rawTAF ?? taf.raw ?? "",
        issuedAt: new Date(taf.issueTime ?? taf.issue_time ?? Date.now()),
        validFrom: new Date(taf.validTimeFrom ?? taf.valid_time_from ?? Date.now()),
        validTo: new Date(taf.validTimeTo ?? taf.valid_time_to ?? Date.now()),
      });
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching TAF.", e);
    }
  }

  private parseAvWeatherMetar(raw: any, station: string): MetarData {
    const clouds: CloudLayer[] = (raw.clouds ?? []).map((c: any) => ({
      coverage: c.cover ?? "CLR",
      altitude: c.base != null ? Math.round(c.base / 100) : null,
    }));

    const category = this.determineFlightCategory(
      raw.visib,
      clouds,
    );

    return {
      station,
      raw: raw.rawOb ?? raw.rawMETAR ?? raw.raw ?? "",
      observedAt: new Date(raw.obsTime ?? raw.reportTime ?? Date.now()),
      temperature: raw.temp ?? null,
      dewpoint: raw.dewp ?? null,
      windDirection: raw.wdir ?? null,
      windSpeed: raw.wspd ?? null,
      windGust: raw.wgst ?? null,
      visibility: raw.visib ?? null,
      altimeter: raw.altim != null ? +(raw.altim * 0.02953).toFixed(2) : null,
      flightCategory: category,
      clouds,
      weather: raw.wxString ? raw.wxString.split(" ") : [],
    };
  }

  private determineFlightCategory(
    visibility: number | null | undefined,
    clouds: CloudLayer[],
  ): "VFR" | "MVFR" | "IFR" | "LIFR" {
    const vis = visibility ?? 10;
    const ceiling = this.getCeiling(clouds);

    if (vis < 1 || (ceiling !== null && ceiling < 5)) return "LIFR";
    if (vis < 3 || (ceiling !== null && ceiling < 10)) return "IFR";
    if (vis <= 5 || (ceiling !== null && ceiling <= 30)) return "MVFR";
    return "VFR";
  }

  private getCeiling(clouds: CloudLayer[]): number | null {
    for (const layer of clouds) {
      if ((layer.coverage === "BKN" || layer.coverage === "OVC") && layer.altitude !== null) {
        return layer.altitude;
      }
    }
    return null;
  }
}

export const weatherRepository = new WeatherRepository();
