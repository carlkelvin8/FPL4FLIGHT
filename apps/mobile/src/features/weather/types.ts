export interface MetarData {
  /** ICAO airport code */
  station: string;
  /** Raw METAR string */
  raw: string;
  /** Observation time */
  observedAt: Date;
  /** Temperature in Celsius */
  temperature: number | null;
  /** Dewpoint in Celsius */
  dewpoint: number | null;
  /** Wind direction in degrees */
  windDirection: number | null;
  /** Wind speed in knots */
  windSpeed: number | null;
  /** Wind gust in knots */
  windGust: number | null;
  /** Visibility in statute miles */
  visibility: number | null;
  /** Altimeter setting in inHg */
  altimeter: number | null;
  /** Flight category */
  flightCategory: "VFR" | "MVFR" | "IFR" | "LIFR";
  /** Cloud layers */
  clouds: CloudLayer[];
  /** Weather phenomena (e.g. RA, SN, FG) */
  weather: string[];
}

export interface CloudLayer {
  coverage: "FEW" | "SCT" | "BKN" | "OVC" | "CLR" | "SKC";
  altitude: number | null; // in hundreds of feet AGL
}

export interface TafData {
  station: string;
  raw: string;
  issuedAt: Date;
  validFrom: Date;
  validTo: Date;
}

export interface WeatherStation {
  icao: string;
  name: string;
  isFavorite: boolean;
}
