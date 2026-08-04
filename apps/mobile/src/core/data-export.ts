/**
 * Data Export Module
 * Exports all user data as a JSON backup that can be shared.
 */

import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system/next";
import { supabase } from "@core/network";

interface ExportData {
  exportedAt: string;
  version: "1.0";
  forms: unknown[];
  flights: unknown[];
  aircraft: unknown[];
  logbook: unknown[];
  dutyTracker: unknown[];
}

/** Export all user data as a JSON file */
export async function exportAllData(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Fetch all user data in parallel
    const [forms, flights, aircraft, logbook, duty] = await Promise.all([
      supabase.from("form_instances").select("*").eq("user_id", user.id),
      supabase.from("flights").select("*").eq("user_id", user.id),
      supabase.from("aircraft").select("*").eq("user_id", user.id),
      supabase.from("pilot_logbook").select("*").eq("user_id", user.id),
      supabase.from("duty_tracker").select("*").eq("user_id", user.id),
    ]);

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      forms: forms.data ?? [],
      flights: flights.data ?? [],
      aircraft: aircraft.data ?? [],
      logbook: logbook.data ?? [],
      dutyTracker: duty.data ?? [],
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    if (__DEV__) console.log(`[Export] ${jsonStr.length} bytes prepared for export`);

    // Write to a temp file and share it
    const fileName = `fpl4flight_backup_${new Date().toISOString().split("T")[0]}.json`;
    const filePath = `${Paths.cache}/${fileName}`;

    // Remove existing file if present
    const outputFile = new File(filePath);
    if (outputFile.exists) outputFile.delete();

    // Write JSON content
    const newFile = new File(filePath);
    newFile.create();
    newFile.write(jsonStr);

    // Share the file
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: "Export FPL4FLIGHT Backup",
      });
    }

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Export failed" };
  }
}

/** Get export data size estimate */
export async function getDataStats(): Promise<{ forms: number; flights: number; aircraft: number; logbook: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { forms: 0, flights: 0, aircraft: 0, logbook: 0 };

    const [f, fl, a, l] = await Promise.all([
      supabase.from("form_instances").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("flights").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("aircraft").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("pilot_logbook").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    return { forms: f.count ?? 0, flights: fl.count ?? 0, aircraft: a.count ?? 0, logbook: l.count ?? 0 };
  } catch {
    return { forms: 0, flights: 0, aircraft: 0, logbook: 0 };
  }
}
