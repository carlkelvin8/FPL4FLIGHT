import type { ViewStyle, TextStyle } from "react-native";

export const colors = {
  brand: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  runway: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  white: "#FFFFFF",
  black: "#000000",
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    500: "#f59e0b",
    600: "#d97706",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

/**
 * Semantic theme tokens — the same slots in light and dark mode.
 * Screens/components that need dark-mode support should consume these
 * through `useAppTheme()` instead of hardcoding `colors.white` / `runway`.
 */
export interface ThemeColors {
  /** Screen background */
  background: string;
  /** Card / surface background */
  surface: string;
  /** Elevated surface (modals, active controls) */
  surfaceElevated: string;
  /** Primary text */
  textPrimary: string;
  /** Secondary text */
  textSecondary: string;
  /** Muted / placeholder text */
  textMuted: string;
  /** Borders */
  border: string;
  /** Subtle borders / dividers */
  borderLight: string;
}

export const lightTheme: ThemeColors = {
  background: colors.runway[50],
  surface: colors.white,
  surfaceElevated: colors.white,
  textPrimary: colors.runway[900],
  textSecondary: colors.runway[700],
  textMuted: colors.runway[500],
  border: colors.runway[200],
  borderLight: colors.runway[100],
};

export const darkTheme: ThemeColors = {
  background: "#0f172a",
  surface: "#1e293b",
  surfaceElevated: "#334155",
  textPrimary: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  border: "#334155",
  borderLight: "#1e293b",
};

/** Avatar background palette (data, not theme-dependent). */
export const avatarPalette = [
  "#1e3a5f",
  "#2d5a3f",
  "#5b2d8e",
  "#8b4513",
  "#1a6b5c",
  "#c4421a",
  "#4a5568",
  "#b8860b",
  "#2c3e50",
  "#3b82f6",
  "#0f172a",
  "#7c3aed",
] as const;

/** Accent colors for the built-in form template types. */
export const formTypeColors: Record<string, { color: string; bg: string }> = {
  "pre-flight": { color: "#1e3a5f", bg: "#e0f2fe" },
  "post-flight": { color: "#166534", bg: "#dcfce7" },
  "weight-balance": { color: "#7c3aed", bg: "#f3e8ff" },
  maintenance: { color: "#b45309", bg: "#fef3c7" },
  operations: { color: "#0369a1", bg: "#e0f2fe" },
  planning: { color: "#be185d", bg: "#fce7f3" },
};

export const shadows: Record<string, ViewStyle> = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize: fontSize["3xl"],
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.runway[900],
  },
  h2: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.runway[900],
  },
  h3: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: colors.runway[900],
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: "400",
    color: colors.runway[700],
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    color: colors.runway[500],
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.runway[500],
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
};
