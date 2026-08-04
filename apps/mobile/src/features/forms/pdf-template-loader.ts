/**
 * PDF Template Loader
 * Loads blank PDF templates directly from embedded base64 (guaranteed to work offline).
 */

import { setCaapFplTemplate, setManifestTemplate } from "./pdf-filler";
import { CAAP_FPL_PDF_BASE64 } from "./caap-fpl-base64";

let loaded = false;

/**
 * Load PDF templates from embedded base64 strings.
 */
export async function loadPdfTemplates(): Promise<void> {
  if (loaded) return;

  try {
    // CAAP Flight Plan — embedded directly
    if (CAAP_FPL_PDF_BASE64) {
      setCaapFplTemplate(CAAP_FPL_PDF_BASE64);
    }

    loaded = true;
  } catch (e) {
    if (__DEV__) console.log("[PDF Templates] Load error:", e);
  }
}

/**
 * Clear loaded state (force reload)
 */
export async function clearTemplateCache(): Promise<void> {
  loaded = false;
}
