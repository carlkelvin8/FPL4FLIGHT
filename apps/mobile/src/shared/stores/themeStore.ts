/**
 * Theme Store — manages dark/light/system mode with persistence.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";

import { THEME_MODE_KEY } from "@shared/constants";

export type ThemeMode = "light" | "dark" | "system";

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "system") return Appearance.getColorScheme() === "dark";
  return mode === "dark";
}

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",
  isDark: false,

  setMode: (mode) => {
    const isDark = resolveIsDark(mode);
    set({ mode, isDark });
    SecureStore.setItemAsync(THEME_MODE_KEY, mode).catch(() => {});
  },

  loadSavedTheme: async () => {
    try {
      const saved = await SecureStore.getItemAsync(THEME_MODE_KEY);
      if (saved === "dark" || saved === "light" || saved === "system") {
        const mode = saved as ThemeMode;
        set({ mode, isDark: resolveIsDark(mode) });
      }
    } catch {
      // Use defaults
    }
  },
}));

// Keep "system" mode in sync with the OS appearance while the app is running.
Appearance.addChangeListener(() => {
  const { mode } = useThemeStore.getState();
  if (mode === "system") {
    useThemeStore.setState({ isDark: Appearance.getColorScheme() === "dark" });
  }
});
