/**
 * Result<T> — A discriminated union that replaces thrown exceptions.
 *
 * All repository methods and use cases return Result<T> so callers are
 * forced to handle both success and failure paths at compile time.
 *
 * @example
 * const result = await formRepo.findById(id);
 * if (result.success) {
 *   console.log(result.data.name);
 * } else {
 *   console.error(result.error.message);
 * }
 */

export interface AppError {
  /** Machine-readable error code (e.g. "NOT_FOUND", "UNAUTHENTICATED") */
  code: string;
  /** Human-readable description */
  message: string;
  /** Optional extra context for debugging */
  details?: unknown;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

/** Convenience constructor for a successful result */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/** Convenience constructor for a failed result */
export function err(code: string, message: string, details?: unknown): Result<never> {
  return { success: false, error: { code, message, details } };
}

/** Type guard — narrows to the success branch */
export function isOk<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success;
}

/** Type guard — narrows to the failure branch */
export function isErr<T>(result: Result<T>): result is { success: false; error: AppError } {
  return !result.success;
}
