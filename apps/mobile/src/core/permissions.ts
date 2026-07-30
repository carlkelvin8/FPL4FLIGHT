/**
 * Role-Based Access Control (RBAC)
 * 
 * Defines roles, permissions, and feature gates for the app.
 * Roles: pilot (free), pro (paid), admin (full access)
 */

export type UserRole = "pilot" | "pro" | "admin";

export type Feature =
  | "forms_create"
  | "forms_export_pdf"
  | "forms_email"
  | "forms_unlimited"
  | "form_builder"
  | "aircraft_unlimited"
  | "flights_unlimited"
  | "logbook"
  | "e6b"
  | "weight_balance"
  | "notams"
  | "navlog"
  | "flight_planning"
  | "aip"
  | "weather"
  | "duty_tracker"
  | "live_tracking"
  | "chat"
  | "chat_channels_create"
  | "chat_file_upload"
  | "chat_voice"
  | "offline_sync"
  | "data_export"
  | "signature"
  | "qr_share"
  | "admin_panel"
  | "admin_view_all_users"
  | "admin_manage_templates"
  | "admin_delete_any_message";

/** Permission matrix — which roles can access which features */
const PERMISSIONS: Record<UserRole, Feature[]> = {
  pilot: [
    "forms_create",
    "forms_export_pdf",
    "logbook",
    "e6b",
    "weight_balance",
    "chat",
    "weather",
    "aip",
    "notams",
  ],
  pro: [
    // Everything in pilot +
    "forms_create",
    "forms_export_pdf",
    "forms_email",
    "forms_unlimited",
    "form_builder",
    "aircraft_unlimited",
    "flights_unlimited",
    "logbook",
    "e6b",
    "weight_balance",
    "notams",
    "navlog",
    "flight_planning",
    "aip",
    "weather",
    "duty_tracker",
    "live_tracking",
    "chat",
    "chat_channels_create",
    "chat_file_upload",
    "chat_voice",
    "offline_sync",
    "data_export",
    "signature",
    "qr_share",
  ],
  admin: [
    // Everything in pro +
    "forms_create",
    "forms_export_pdf",
    "forms_email",
    "forms_unlimited",
    "form_builder",
    "aircraft_unlimited",
    "flights_unlimited",
    "logbook",
    "e6b",
    "weight_balance",
    "notams",
    "navlog",
    "flight_planning",
    "aip",
    "weather",
    "duty_tracker",
    "live_tracking",
    "chat",
    "chat_channels_create",
    "chat_file_upload",
    "chat_voice",
    "offline_sync",
    "data_export",
    "signature",
    "qr_share",
    "admin_panel",
    "admin_view_all_users",
    "admin_manage_templates",
    "admin_delete_any_message",
  ],
};

/** Limits per role */
export const ROLE_LIMITS: Record<UserRole, { maxForms: number; maxAircraft: number; maxFlights: number }> = {
  pilot: { maxForms: 5, maxAircraft: 2, maxFlights: 5 },
  pro: { maxForms: 999, maxAircraft: 999, maxFlights: 999 },
  admin: { maxForms: 999, maxAircraft: 999, maxFlights: 999 },
};

/** Check if a role has access to a feature */
export function hasPermission(role: UserRole, feature: Feature): boolean {
  return PERMISSIONS[role]?.includes(feature) ?? false;
}

/** Get all features for a role */
export function getPermissions(role: UserRole): Feature[] {
  return PERMISSIONS[role] ?? [];
}

/** Check if role is admin */
export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

/** Get the display label for a role */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "pilot": return "Starter (Free)";
    case "pro": return "Pro";
    case "admin": return "Admin";
    default: return "Unknown";
  }
}
