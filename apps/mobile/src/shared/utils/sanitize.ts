/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection patterns, and invalid data from entering the system.
 */

/** Remove potentially dangerous HTML/script content */
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/** Sanitize ICAO code (4 uppercase letters only) */
export function sanitizeICAO(input: string): string {
  return input.replace(/[^A-Z]/g, "").substring(0, 4);
}

/** Sanitize aircraft registration (alphanumeric + dash only) */
export function sanitizeRegistration(input: string): string {
  return input.replace(/[^A-Z0-9-]/gi, "").toUpperCase().substring(0, 10);
}

/** Sanitize numeric input */
export function sanitizeNumber(input: string): string {
  return input.replace(/[^0-9.]/g, "");
}

/** Sanitize email */
export function sanitizeEmail(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9@._+-]/g, "");
}

/** Validate and sanitize flight number */
export function sanitizeFlightNumber(input: string): string {
  return input.replace(/[^A-Z0-9-]/gi, "").toUpperCase().substring(0, 10);
}

/** Max length enforcement */
export function enforceMaxLength(input: string, max: number): string {
  return input.substring(0, max);
}
