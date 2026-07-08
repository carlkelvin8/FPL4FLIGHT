import { ok, err, type Result } from "@pilotforms/shared";

import { supabase } from "@core/network";

export interface FlightRow {
  id: string;
  user_id: string;
  flight_number: string;
  departure_code: string;
  departure_city: string;
  departure_country: string;
  departure_time: string;
  arrival_code: string;
  arrival_city: string;
  arrival_country: string;
  arrival_time: string;
  date: string;
  aircraft: string;
  status: string;
  gate: string | null;
  pilot_in_command: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlightData {
  id: string;
  flightNumber: string;
  departure: { code: string; city: string; country: string; time: string };
  arrival: { code: string; city: string; country: string; time: string };
  date: string;
  aircraft: string;
  status: string;
  gate?: string | undefined;
  pilotInCommand?: string | undefined;
  remarks?: string | undefined;
}

export interface CreateFlightDto {
  flightNumber: string;
  depCode: string;
  depCity: string;
  depCountry: string;
  depTime: string;
  arrCode: string;
  arrCity: string;
  arrCountry: string;
  arrTime: string;
  date: string;
  aircraft: string;
  gate: string;
  pilotInCommand: string;
  remarks: string;
}

function rowToFlight(row: FlightRow): FlightData {
  return {
    id: row.id,
    flightNumber: row.flight_number,
    departure: { code: row.departure_code, city: row.departure_city, country: row.departure_country, time: row.departure_time },
    arrival: { code: row.arrival_code, city: row.arrival_city, country: row.arrival_country, time: row.arrival_time },
    date: row.date,
    aircraft: row.aircraft,
    status: row.status,
    gate: row.gate || undefined,
    pilotInCommand: row.pilot_in_command || undefined,
    remarks: row.remarks || undefined,
  };
}

export class FlightRepository {
  async findAll(): Promise<Result<FlightData[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      const response = await supabase
        .from("flights")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (response.error) return err("DB_ERROR", response.error.message, response.error);
      return ok((response.data ?? []).map(rowToFlight));
    } catch (e: unknown) {
      return err("NETWORK_ERROR", e instanceof Error ? e.message : "Network error fetching flights.");
    }
  }

  async create(dto: CreateFlightDto): Promise<Result<FlightData>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      const response = await supabase
        .from("flights")
        .insert({
          user_id: user.id,
          flight_number: dto.flightNumber,
          departure_code: dto.depCode,
          departure_city: dto.depCity,
          departure_country: dto.depCountry,
          departure_time: dto.depTime,
          arrival_code: dto.arrCode,
          arrival_city: dto.arrCity,
          arrival_country: dto.arrCountry,
          arrival_time: dto.arrTime,
          date: dto.date,
          aircraft: dto.aircraft,
          status: "scheduled",
          gate: dto.gate || null,
          pilot_in_command: dto.pilotInCommand || null,
          remarks: dto.remarks || null,
        })
        .select()
        .single();

      if (response.error) return err("DB_ERROR", response.error.message, response.error);
      return ok(rowToFlight(response.data as FlightRow));
    } catch (e: unknown) {
      return err("NETWORK_ERROR", e instanceof Error ? e.message : "Network error creating flight.");
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const response = await supabase.from("flights").delete().eq("id", id);
      if (response.error) return err("DB_ERROR", response.error.message, response.error);
      return ok(undefined);
    } catch (e: unknown) {
      return err("NETWORK_ERROR", e instanceof Error ? e.message : "Network error deleting flight.");
    }
  }
}

export const flightRepository = new FlightRepository();
