/**
 * PDF Form Filler — uses pdf-lib to overlay data onto original blank PDF templates.
 * This produces pixel-perfect output since we write directly on the government form.
 *
 * SETUP:
 * 1. Place the blank PDF as base64 in ./templates/caap-fpl-blank.ts and ./templates/manifest-blank.ts
 * 2. The coordinates below map form field IDs to exact (x, y) positions on the PDF page.
 * 3. Coordinates are in PDF points (1 point = 1/72 inch), measured from BOTTOM-LEFT corner.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system/next";

// ─── Types ──────────────────────────────────────────────────────
interface FieldPosition {
  key: string;         // form data key
  x: number;           // X from left (points)
  y: number;           // Y from bottom (points)
  size?: number;       // font size (default 10)
  maxWidth?: number;   // max width before wrapping/truncating
  transform?: (val: string) => string; // optional value transform
}

interface PDFTemplate {
  base64: string;
  fields: FieldPosition[];
  pageIndex?: number; // default 0
}

// ─── CAAP Flight Plan Field Positions ───────────────────────────
// Calibrated against the official CAAP ATS 2019-1 blank form (A4: 595.28 x 841.89 pt)
// PDF coordinate system: (0,0) is BOTTOM-LEFT of the page.
// Y increases upward. X increases to the right.
const CAAP_FPL_FIELDS: FieldPosition[] = [
  // ADDRESSEE(S) - inside the second long box (y~708)
  { key: "addressees", x: 168, y: 708, size: 9 },

  // DATE OF FILING / ORIGINATOR - inside the character boxes (y~665)
  { key: "date_of_filing", x: 55, y: 664, size: 9 },
  { key: "originator", x: 255, y: 664, size: 9 },

  // SPECIFIC IDENTIFICATION (y~643)
  { key: "specific_id", x: 50, y: 643, size: 7 },

  // Box 3/7/8: MESSAGE TYPE / AIRCRAFT ID / FLIGHT RULES / TYPE (y~612)
  { key: "message_type", x: 95, y: 612, size: 9 },
  { key: "aircraft_id", x: 255, y: 612, size: 9 },
  { key: "flight_rules", x: 435, y: 612, size: 10 },
  { key: "type_of_flight", x: 535, y: 612, size: 10 },

  // Box 9: NUMBER / TYPE / WAKE / 10: EQUIPMENT (y~582)
  { key: "number_aircraft", x: 58, y: 582, size: 9 },
  { key: "type_of_aircraft", x: 148, y: 582, size: 9 },
  { key: "wake_turbulence", x: 300, y: 582, size: 10 },
  { key: "equipment", x: 435, y: 582, size: 8 },
  { key: "surveillance", x: 500, y: 582, size: 8 },

  // Box 13: DEPARTURE AERODROME / TIME (y~550)
  { key: "departure_aerodrome", x: 58, y: 550, size: 9 },
  { key: "departure_time", x: 315, y: 550, size: 9 },

  // Box 15: CRUISING SPEED / LEVEL / ROUTE (y~518)
  { key: "cruising_speed", x: 58, y: 518, size: 9 },
  { key: "level", x: 183, y: 518, size: 9 },
  { key: "route", x: 278, y: 518, size: 8, maxWidth: 275 },

  // Box 16: DESTINATION / TOTAL EET / ALTN / 2ND ALTN (y~458)
  { key: "destination_aerodrome", x: 58, y: 458, size: 9 },
  { key: "total_eet", x: 223, y: 458, size: 9 },
  { key: "altn_aerodrome", x: 353, y: 458, size: 9 },
  { key: "altn_aerodrome_2", x: 478, y: 458, size: 9 },

  // Box 18: OTHER INFORMATION (y~418)
  { key: "other_info", x: 55, y: 418, size: 7, maxWidth: 490 },

  // Box 19: ENDURANCE / PERSONS ON BOARD (y~352)
  { key: "endurance_hr", x: 90, y: 352, size: 9 },
  { key: "endurance_min", x: 133, y: 352, size: 9 },
  { key: "persons_on_board", x: 278, y: 352, size: 9 },

  // DINGHIES (y~295)
  { key: "dinghies_number", x: 63, y: 295, size: 8 },
  { key: "dinghies_capacity", x: 168, y: 295, size: 8 },
  { key: "dinghies_colour", x: 358, y: 295, size: 8 },

  // A/ AIRCRAFT COLOUR (y~248 — confirmed correct from grid)
  { key: "aircraft_colour", x: 78, y: 248, size: 9, maxWidth: 445 },

  // N/ REMARKS (y~230)
  { key: "remarks", x: 65, y: 230, size: 9, maxWidth: 455 },

  // C/ PILOT-IN-COMMAND (y~212)
  { key: "pilot_in_command", x: 68, y: 212, size: 9 },

  // FILED BY (y~195)
  { key: "filed_by", x: 63, y: 195, size: 8 },

  // PILOT NAME & LICENSE (y~138 — at signature line)
  { key: "pilot_name_signature", x: 50, y: 138, size: 9 },
  { key: "license_no", x: 250, y: 138, size: 9 },
];

// ─── Passenger Manifest Field Positions ─────────────────────────
const MANIFEST_FIELDS: FieldPosition[] = [
  { key: "aircraft_id", x: 60, y: 710, size: 11 },
  { key: "aircraft_identification", x: 60, y: 710, size: 11 }, // alias
  { key: "type_of_aircraft", x: 230, y: 710, size: 11 },
  { key: "aircraft_type", x: 230, y: 710, size: 11 }, // alias
  { key: "date_of_flight", x: 420, y: 710, size: 10 },
  { key: "flight_date", x: 420, y: 710, size: 10 }, // alias
  { key: "home_base", x: 60, y: 683, size: 10 },
  { key: "base_hangar", x: 60, y: 683, size: 10 },
  { key: "owner_phone", x: 230, y: 683, size: 9 },
  { key: "owner_name", x: 230, y: 683, size: 9 },
  { key: "coa_expiry", x: 420, y: 683, size: 10 },
  { key: "expiry_date", x: 420, y: 683, size: 10 },
  { key: "type_of_cargo", x: 60, y: 656, size: 10 },
  { key: "quality_of_cargo", x: 230, y: 656, size: 10 },
  { key: "total_weight_cargo", x: 420, y: 656, size: 10 },
  // Passengers (1-25) — each row is ~18 points apart, starting at y=618
  ...Array.from({ length: 25 }, (_, i) => ({
    key: `passenger_${i + 1}_name`,
    x: 42,
    y: 618 - i * 17.5,
    size: 9,
  })),
  ...Array.from({ length: 25 }, (_, i) => ({
    key: `passenger_${i + 1}_nationality`,
    x: 430,
    y: 618 - i * 17.5,
    size: 9,
  })),
  // Signature
  { key: "pilot_name", x: 100, y: 120, size: 11 },
  { key: "pilot_in_command", x: 100, y: 120, size: 11 },
  { key: "license_no", x: 380, y: 120, size: 10 },
  { key: "pilot_license", x: 380, y: 120, size: 10 },
];

// ─── Template Storage ───────────────────────────────────────────
// These will hold base64-encoded blank PDFs.
// To generate: convert PDF to base64 and paste here, or load from Supabase storage at runtime.
let CAAP_FPL_PDF_BASE64: string | null = null;
let MANIFEST_PDF_BASE64: string | null = null;

/**
 * Set the blank CAAP Flight Plan PDF template (base64 encoded)
 */
export function setCaapFplTemplate(base64: string) {
  CAAP_FPL_PDF_BASE64 = base64;
}

/**
 * Set the blank Passenger Manifest PDF template (base64 encoded)
 */
export function setManifestTemplate(base64: string) {
  MANIFEST_PDF_BASE64 = base64;
}

// ─── Core Fill Function ─────────────────────────────────────────
async function fillPdf(
  templateBase64: string,
  fields: FieldPosition[],
  data: Record<string, unknown>,
  pageIndex: number = 0
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBase64, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  if (!page) throw new Error("PDF page not found");

  for (const field of fields) {
    const rawValue = data[field.key];
    if (!rawValue) continue;

    let value = String(rawValue);
    if (field.transform) value = field.transform(value);
    if (!value) continue;

    const fontSize = field.size || 10;

    // Truncate if maxWidth specified
    if (field.maxWidth) {
      const charWidth = fontSize * 0.6; // approximate for Courier
      const maxChars = Math.floor(field.maxWidth / charWidth);
      if (value.length > maxChars) value = value.slice(0, maxChars);
    }

    page.drawText(value, {
      x: field.x,
      y: field.y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return pdfDoc.save();
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Check if pdf-lib templates are available
 */
export function hasPdfTemplates(): { caap: boolean; manifest: boolean } {
  return {
    caap: CAAP_FPL_PDF_BASE64 !== null,
    manifest: MANIFEST_PDF_BASE64 !== null,
  };
}

/**
 * Fill CAAP Flight Plan PDF with data and share
 */
export async function fillCaapFlightPlan(data: Record<string, unknown>): Promise<string | null> {
  if (!CAAP_FPL_PDF_BASE64) return null;

  const pdfDoc = await PDFDocument.load(CAAP_FPL_PDF_BASE64, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  // Fill each form field by name
  const fieldMap: Record<string, string> = {
    addressees: String(data.addressees || ""),
    date_of_filing: String(data.date_of_filing || ""),
    originator: String(data.originator || ""),
    message_type: String(data.message_type || "FPL"),
    aircraft_id: String(data.aircraft_id || ""),
    flight_rules: String(data.flight_rules || ""),
    type_of_flight: String(data.type_of_flight || ""),
    number_aircraft: String(data.number_aircraft || ""),
    type_of_aircraft: String(data.type_of_aircraft || ""),
    wake_turbulence: String(data.wake_turbulence || ""),
    equipment: String(data.equipment || "") + (data.surveillance ? " / " + String(data.surveillance) : ""),
    departure_aerodrome: String(data.departure_aerodrome || ""),
    departure_time: String(data.departure_time || ""),
    cruising_speed: String(data.cruising_speed || ""),
    level: String(data.level || ""),
    route: String(data.route || ""),
    destination_aerodrome: String(data.destination_aerodrome || ""),
    total_eet: String(data.total_eet || ""),
    altn_aerodrome: String(data.altn_aerodrome || ""),
    altn_aerodrome_2: String(data.altn_aerodrome_2 || ""),
    other_info: String(data.other_info || ""),
    endurance_hr: String(data.endurance_hr || ""),
    endurance_min: String(data.endurance_min || ""),
    persons_on_board: String(data.persons_on_board || ""),
    dinghies_number: String(data.dinghies_number || ""),
    dinghies_capacity: String(data.dinghies_capacity || ""),
    dinghies_colour: String(data.dinghies_colour || ""),
    aircraft_colour: String(data.aircraft_colour || ""),
    remarks: String(data.remarks || ""),
    pilot_in_command: String(data.pilot_in_command || ""),
    filed_by: String(data.filed_by || ""),
    pilot_name_signature: String(data.pilot_name_signature || ""),
    license_no: String(data.license_no || ""),
  };

  for (const [fieldName, value] of Object.entries(fieldMap)) {
    if (!value) continue;
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch {
      // Field doesn't exist or is wrong type — try signature field
      try {
        // Some fields might be signature type — skip them gracefully
      } catch {}
    }
  }

  // Handle pilot_name_signature specially (it's a PDFSignature in Sejda)
  // We'll just skip it if it's not a text field
  const pilotName = String(data.pilot_name_signature || data.pilot_in_command || "");
  if (pilotName) {
    try { form.getTextField("pilot_name_signature").setText(pilotName); } catch { /* field may not exist in template */ }
  }

  // Flatten text fields only (skip signature fields)
  const fields = form.getFields();
  for (const field of fields) {
    try {
      if (field.constructor.name === 'PDFTextField') {
        (field as any).enableReadOnly();
      }
    } catch (e) {
      if (__DEV__) console.log("[PDF] Could not set readOnly on field:", e instanceof Error ? e.message : e);
    }
  }
  // Don't call form.flatten() — it crashes on signature fields

  const pdfBytes = await pdfDoc.save();
  const base64Pdf = uint8ToBase64(pdfBytes);
  const file = new File(Paths.cache, "caap-flight-plan-filled.pdf");
  if (file.exists) file.delete();
  file.create();
  file.write(base64Pdf, { encoding: "base64" });
  return file.uri;
}

/**
 * Fill Passenger Manifest PDF with data and share
 */
export async function fillManifestPdf(data: Record<string, unknown>): Promise<string | null> {
  if (!MANIFEST_PDF_BASE64) return null;

  try {
    const pdfBytes = await fillPdf(MANIFEST_PDF_BASE64, MANIFEST_FIELDS, data);
    const base64Pdf = uint8ToBase64(pdfBytes);
    const file = new File(Paths.cache, "passenger-manifest-filled.pdf");
    file.create();
    file.write(base64Pdf, { encoding: "base64" });
    return file.uri;
  } catch (e) {
    if (__DEV__) console.log("[PDF] Fill Manifest error:", e);
    return null;
  }
}

/**
 * Fill any PDF template and return file URI
 */
export async function fillPdfTemplate(
  templateBase64: string,
  fields: FieldPosition[],
  data: Record<string, unknown>
): Promise<string | null> {
  try {
    const pdfBytes = await fillPdf(templateBase64, fields, data);
    const base64Pdf = uint8ToBase64(pdfBytes);
    const file = new File(Paths.cache, `form-filled-${Date.now()}.pdf`);
    file.create();
    file.write(base64Pdf, { encoding: "base64" });
    return file.uri;
  } catch (e) {
    if (__DEV__) console.log("[PDF] Fill error:", e);
    return null;
  }
}

/**
 * Share a filled PDF
 */
export async function sharePdf(fileUri: string, title: string = "Form") {
  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    dialogTitle: `${title} - FPL4FLIGHT`,
  });
}

// ─── Helpers ────────────────────────────────────────────────────
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

// Re-export field position types for calibration
export type { FieldPosition };
export { CAAP_FPL_FIELDS, MANIFEST_FIELDS };
