/**
 * Error Tracking Module
 * 
 * Centralized error reporting. Currently logs to console.
 * In production, integrate with Sentry:
 *   1. npx expo install @sentry/react-native
 *   2. Initialize with Sentry.init({ dsn: process.env.SENTRY_DSN })
 *   3. Replace captureException/captureMessage with Sentry equivalents
 */

interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

/** Capture an exception with context */
export function captureException(error: unknown, context?: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (__DEV__) {
    console.error(`[ErrorTracking] ${err.message}`, context ?? "");
    console.error(err.stack);
  }

  // In production with Sentry:
  // Sentry.captureException(err, { extra: context });
}

/** Capture a message (non-error event) */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext): void {
  if (__DEV__) {
    const prefix = level === "error" ? "❌" : level === "warning" ? "⚠️" : "ℹ️";
    console.log(`[ErrorTracking] ${prefix} ${message}`, context ?? "");
  }

  // In production with Sentry:
  // Sentry.captureMessage(message, { level, extra: context });
}

/** Set user context for all future error reports */
export function setUser(id: string, email?: string): void {
  if (__DEV__) {
    console.log(`[ErrorTracking] User identified: ${id} (${email ?? "no email"})`);
  }

  // In production with Sentry:
  // Sentry.setUser({ id, email });
}

/** Clear user context (on logout) */
export function clearUser(): void {
  // Sentry.setUser(null);
}

/** Add breadcrumb for debugging trail */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[Breadcrumb] [${category ?? "app"}] ${message}`, data ?? "");
  }

  // In production with Sentry:
  // Sentry.addBreadcrumb({ message, category, data, level: "info" });
}

/** Wrap an async function with error tracking */
export function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: ErrorContext,
): Promise<T | undefined> {
  return fn().catch((error) => {
    captureException(error, context);
    return undefined;
  });
}
