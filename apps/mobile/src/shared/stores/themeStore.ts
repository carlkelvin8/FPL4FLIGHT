/**
 * Theme Store — manages dark/light mode with persistence.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "fpl4flight_theme_mode";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "light",
  isDark: false,

  setMode: (mode) => {
    const isDark = mode === "dark";
    set({ mode, isDark });
    SecureStore.setItemAsync(THEME_KEY, mode).catch(() => {});
  },

  loadSavedTheme: async () => {
    try {
      const saved = await SecureStore.getItemAsync(THEME_KEY);
      if (saved === "dark" || saved === "light" || saved === "system") {
        set({ mode: saved as ThemeMode, isDark: saved === "dark" });
      }
    } catch {
      // Use default
    }
  },
}));

/** Dark mode colors (inverted runway palette) */
export const darkColors = {
  background: "#0f172a",
  surface: "#1e293b",
  surfaceElevated: "#334155",
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  border: "#334155",
  borderLight: "#1e293b",
} as const;
