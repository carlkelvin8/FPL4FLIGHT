import { useThemeStore, type ThemeMode } from "@shared/stores/themeStore";
import { darkTheme, lightTheme, type ThemeColors } from "@shared/theme";

/**
 * Semantic color hook. Returns the active palette plus theme metadata.
 * Prefer `theme.surface` / `theme.textPrimary` over hardcoded hex values
 * so screens adapt to both light and dark mode.
 */
export function useAppTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
} {
  const isDark = useThemeStore((s) => s.isDark);
  const mode = useThemeStore((s) => s.mode);
  return { colors: isDark ? darkTheme : lightTheme, isDark, mode };
}

export { useThemeStore } from "@shared/stores/themeStore";
export type { ThemeMode } from "@shared/stores/themeStore";
