/**
 * Shared utility helpers for the Admin Dashboard.
 */

/**
 * Merges CSS class names, filtering out falsy values.
 * A lightweight alternative to clsx/classnames — no extra dependency needed.
 *
 * @example
 * cn("px-4", isActive && "bg-brand-600", undefined)
 * // → "px-4 bg-brand-600"
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
