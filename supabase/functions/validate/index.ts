// Supabase Edge Function: Server-Side Data Validation
// Deploy with: supabase functions deploy validate
//
// Validates form submissions, flight data, and chat messages
// before they reach the database. Acts as a validation gateway.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

type ValidationType = "flight" | "form_submission" | "chat_message" | "aircraft" | "logbook";

serve(async (req) => {
  try {
    const { type, data } = await req.json() as { type: ValidationType; data: Record<string, unknown> };

    if (!type || !data) {
      return respond(400, { valid: false, errors: ["Missing type or data"] });
    }

    let result: ValidationResult;

    switch (type) {
      case "flight":
        result = validateFlight(data);
        break;
      case "form_submission":
        result = validateFormSubmission(data);
        break;
      case "chat_message":
        result = validateChatMessage(data);
        break;
      case "aircraft":
        result = validateAircraft(data);
        break;
      case "logbook":
        result = validateLogbook(data);
        break;
      default:
        result = { valid: false, errors: [`Unknown validation type: ${type}`] };
    }

    return respond(result.valid ? 200 : 422, result);
  } catch (e) {
    return respond(500, { valid: false, errors: ["Server validation error"] });
  }
});

// ─── Validators ──────────────────────────────────────────────

function validateFlight(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!isNonEmptyString(data.flight_number)) errors.push("Flight number is required");
  if (!isNonEmptyString(data.departure_code)) errors.push("Departure airport code is required");
  if (!isNonEmptyString(data.arrival_code)) errors.push("Arrival airport code is required");
  if (!isNonEmptyString(data.departure_time)) errors.push("Departure time is required");
  if (!isNonEmptyString(data.arrival_time)) errors.push("Arrival time is required");

  // Format validation
  if (data.departure_code && !isValidICAO(String(data.departure_code))) {
    errors.push("Departure code must be 3-4 uppercase letters");
  }
  if (data.arrival_code && !isValidICAO(String(data.arrival_code))) {
    errors.push("Arrival code must be 3-4 uppercase letters");
  }
  if (data.departure_time && !isValidTime(String(data.departure_time))) {
    errors.push("Departure time must be in HH:MM format");
  }
  if (data.arrival_time && !isValidTime(String(data.arrival_time))) {
    errors.push("Arrival time must be in HH:MM format");
  }
  if (data.date && !isValidDate(String(data.date))) {
    errors.push("Date must be in YYYY-MM-DD format");
  }

  // Sanitization checks
  if (data.flight_number && String(data.flight_number).length > 10) {
    errors.push("Flight number too long (max 10 chars)");
  }
  if (data.remarks && String(data.remarks).length > 500) {
    errors.push("Remarks too long (max 500 chars)");
  }

  return { valid: errors.length === 0, errors };
}

function validateChatMessage(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(data.content) && data.message_type === "text") {
    errors.push("Message content is required");
  }
  if (data.content && String(data.content).length > 2000) {
    errors.push("Message too long (max 2000 chars)");
  }
  if (!isNonEmptyString(data.user_id)) {
    errors.push("User ID is required");
  }
  if (!isNonEmptyString(data.channel_id)) {
    errors.push("Channel ID is required");
  }

  // Check for spam patterns
  const content = String(data.content ?? "");
  if (containsSpamPatterns(content)) {
    errors.push("Message contains spam content");
  }

  return { valid: errors.length === 0, errors };
}

function validateAircraft(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(data.aircraft_id)) errors.push("Aircraft ID is required");
  if (!isNonEmptyString(data.type_of_aircraft)) errors.push("Aircraft type is required");

  if (data.aircraft_id && !isValidRegistration(String(data.aircraft_id))) {
    errors.push("Aircraft ID must be alphanumeric with optional dash (e.g. RP-C1234)");
  }
  if (data.wake_turbulence_category && !["L", "M", "H", "J"].includes(String(data.wake_turbulence_category))) {
    errors.push("Wake turbulence category must be L, M, H, or J");
  }

  return { valid: errors.length === 0, errors };
}

function validateFormSubmission(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(data.template_id)) errors.push("Template ID is required");
  if (!isNonEmptyString(data.user_id)) errors.push("User ID is required");
  if (data.status && !["draft", "completed", "synced"].includes(String(data.status))) {
    errors.push("Status must be draft, completed, or synced");
  }

  return { valid: errors.length === 0, errors };
}

function validateLogbook(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(data.date)) errors.push("Date is required");
  if (data.date && !isValidDate(String(data.date))) errors.push("Date must be YYYY-MM-DD");

  if (data.total_hours != null && (Number(data.total_hours) < 0 || Number(data.total_hours) > 24)) {
    errors.push("Total hours must be between 0 and 24");
  }
  if (data.landings != null && (Number(data.landings) < 0 || Number(data.landings) > 100)) {
    errors.push("Landings must be between 0 and 100");
  }
  if (data.pic_hours != null && Number(data.pic_hours) < 0) {
    errors.push("PIC hours cannot be negative");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Helper Functions ────────────────────────────────────────

function isNonEmptyString(val: unknown): boolean {
  return typeof val === "string" && val.trim().length > 0;
}

function isValidICAO(code: string): boolean {
  return /^[A-Z]{3,4}$/.test(code.toUpperCase());
}

function isValidTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidRegistration(reg: string): boolean {
  return /^[A-Z0-9-]{2,10}$/i.test(reg);
}

function containsSpamPatterns(text: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters (aaaaaaaaaa)
    /https?:\/\/[^\s]{50,}/, // Very long URLs
    /(buy|sell|free|click|subscribe|win|prize)/i, // Common spam words in aviation context — keep loose
  ];
  // Only flag if multiple patterns match
  const matches = spamPatterns.filter((p) => p.test(text));
  return matches.length >= 2;
}

function respond(status: number, body: ValidationResult) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
