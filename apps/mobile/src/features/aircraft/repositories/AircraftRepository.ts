import { ok, err, type Result } from "@pilotforms/shared";

import { supabase } from "@core/network";

export interface AircraftRow {
  id: string;
  user_id: string;
  aircraft_id: string;
  type_of_aircraft: string;
  wake_turbulence_category: string;
  equipment: string;
  surveillance: string;
  emergency_radio: { uhf: boolean; vhf: boolean; elt: boolean };
  survival_equipment: { polar: boolean; maritime: boolean; desert: boolean; jungle: boolean };
  jackets: { light: boolean; fluores: boolean; uhf: boolean; vhf: boolean };
  dinghies: { dinghies: boolean; cover: boolean };
  created_at: string;
  updated_at: string;
}

export interface AircraftData {
  id: string;
  userId: string;
  aircraftId: string;
  typeOfAircraft: string;
  wakeTurbulenceCategory: string;
  equipment: string;
  surveillance: string;
  emergencyRadio: { uhf: boolean; vhf: boolean; elt: boolean };
  survivalEquipment: { polar: boolean; maritime: boolean; desert: boolean; jungle: boolean };
  jackets: { light: boolean; fluores: boolean; uhf: boolean; vhf: boolean };
  dinghies: { dinghies: boolean; cover: boolean };
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAircraftDto = Omit<AircraftData, "id" | "userId" | "createdAt" | "updatedAt">;

function rowToAircraft(row: AircraftRow): AircraftData {
  return {
    id: row.id,
    userId: row.user_id,
    aircraftId: row.aircraft_id,
    typeOfAircraft: row.type_of_aircraft,
    wakeTurbulenceCategory: row.wake_turbulence_category,
    equipment: row.equipment,
    surveillance: row.surveillance,
    emergencyRadio: row.emergency_radio,
    survivalEquipment: row.survival_equipment,
    jackets: row.jackets,
    dinghies: row.dinghies,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class AircraftRepository {
  async findAll(): Promise<Result<AircraftData[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      const response = await supabase
        .from("aircraft")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (response.error) return err("DB_ERROR", response.error.message, response.error);
      return ok((response.data ?? []).map(rowToAircraft));
    } catch (e: unknown) {
      return err("NETWORK_ERROR", e instanceof Error ? e.message : "Network error fetching aircraft.");
    }
  }

  async create(dto: CreateAircraftDto): Promise<Result<AircraftData>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      const response = await supabase
        .from("aircraft")
        .insert({
          user_id: user.id,
          aircraft_id: dto.aircraftId,
          type_of_aircraft: dto.typeOfAircraft,
          wake_turbulence_category: dto.wakeTurbulenceCategory,
          equipment: dto.equipment,
          surveillance: dto.surveillance,
          emergency_radio: dto.emergencyRadio,
          survival_equipment: dto.survivalEquipment,
          jackets: dto.jackets,
          dinghies: dto.dinghies,
        })
        .select()
        .single();

      if (response.error) return err("DB_ERROR", response.error.message, response.error);
      return ok(rowToAircraft(response.data as AircraftRow));
    } catch (e: unknown) {
      return err("NETWORK_ERROR", e instanceof Error ? e.message : "Network error creating aircraft.");
    }
  }

  async update(id: string, dto: Partial<CreateAircraftDto>): Promise<Result<AircraftData>> {
    try {
      const payload: Record<string, unknown> = {};
      if (dto.aircraftId !== undefined) payload.aircraft_id = dto.aircraftId;
      if (dto.typeOfAircraft !== undefined) payload.type_of_aircraft = dto.typeOfAircraft;
      if (dto.wakeTurbulenceCategory !== undefined) payload.wake_turbulence_category = dto.wakeTurbulenceCategory;
      if (dto.equipment !== undefined) payload.equipment = dto.equipment;
      if (dto.surveillance !== undefined) payload.surveillance = dto.surveillance;
      if (dto.emergencyRadio !== undefined) payload.emergency_radio = dto.emergencyRadio;
      if (dto.survivalEquipment !== undefined) payload.survival_equipment = dto.survivalEquipment;
      if (dto.jackets !== undefined) payload.jackets = dto.jackets;
      if (dto.dinghies !== undefined) payload.dinghies = dto.dinghies;

      const response = await supabase
        .from("aircraft")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (response.error) return err("DB_ERROR", response.error.message, response.error);
      return ok(rowToAircraft(response.data as AircraftRow));
    } catch (e: unknown) {
      return err("NETWORK_ERROR", e instanceof Error ? e.message : "Network error updating aircraft.");
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const response = await supabase.from("aircraft").delete().eq("id", id);
      if (response.error) return err("DB_ERROR", response.error.message, response.error);
      return ok(undefined);
    } catch (e: unknown) {
      return err("NETWORK_ERROR", e instanceof Error ? e.message : "Network error deleting aircraft.");
    }
  }
}

export const aircraftRepository = new AircraftRepository();
