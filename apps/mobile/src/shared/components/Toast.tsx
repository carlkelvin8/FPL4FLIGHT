/**
 * Toast Notification Component
 * Shows non-intrusive messages at the top of the screen.
 */
import { useEffect, useState, useCallback } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, runOnJS } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; color: string }> = {
  success: { icon: "checkmark-circle", bg: colors.green[50], color: colors.green[600] },
  error: { icon: "alert-circle", bg: colors.red[50], color: colors.red[600] },
  info: { icon: "information-circle", bg: colors.brand[50], color: colors.brand[600] },
  warning: { icon: "warning", bg: colors.amber[50], color: colors.amber[600] },
};

let toastId = 0;
let showToastFn: ((text: string, type?: ToastType) => void) | null = null;

/** Show a toast from anywhere in the app */
export function showToast(text: string, type: ToastType = "info"): void {
  showToastFn?.(text, type);
}

/** Toast Provider — place at root of app */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const show = useCallback((text: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToast({ id, text, type });
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto-hide after 3s
    translateY.value = withDelay(3000, withTiming(-100, { duration: 300 }));
    opacity.value = withDelay(3000, withTiming(0, { duration: 200 }, () => {
      runOnJS(setToast)(null);
    }));
  }, [translateY, opacity]);

  useEffect(() => {
    showToastFn = show;
    return () => { showToastFn = null; };
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const config = toast ? TOAST_CONFIG[toast.type] : TOAST_CONFIG.info;

  return (
    <>
      {children}
      {toast && (
        <Animated.View style={[styles.toast, { top: insets.top + spacing.sm, backgroundColor: config.bg }, animatedStyle]}>
          <Ionicons name={config.icon as any} size={18} color={config.color} />
          <Text style={[styles.toastText, { color: config.color }]}>{toast.text}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  toastText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
