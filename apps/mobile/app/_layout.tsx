import { useEffect, useState, useCallback, useRef } from "react";
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, useSegments, useRouter, useRootNavigationState } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../src/features/auth/stores/authStore";
import { secureStorage, SESSION_KEY, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../src/core/storage";
import { supabase } from "../src/core/network";
import { colors, lightTheme, darkTheme } from "../src/shared/theme";
import { APP_NAME } from "../src/shared/constants";
import { useThemeStore } from "../src/shared/stores/themeStore";
import { ErrorBoundary as ErrorBoundaryClass } from "../src/shared/components/ErrorBoundary";
import { startSyncManager } from "../src/core/sync-manager";
import { isBiometricLockEnabled, authenticateWithBiometrics } from "../src/core/biometrics";
import { registerForPushNotifications, addNotificationListener } from "../src/core/push-notifications";
const ErrorBoundary = ErrorBoundaryClass as React.ComponentType<{ children: React.ReactNode }>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { session, isLoading } = useAuthStore();

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    const timer = setTimeout(() => {
      if (!session && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (session && inAuthGroup) {
        router.replace("/(app)/forms");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [session, isLoading, segments, navigationState?.key]);
}

function AuthSessionRestorer() {
  const { setSession, setUser, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      setLoading(true);
      try {
        let currentSession = null;
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000));
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          currentSession = result?.data?.session ?? null;
        } catch (e) {
          // Network timeout or JWT error — user will see login screen
          if (__DEV__) console.log("[Auth] Session restore failed:", e instanceof Error ? e.message : "unknown");
        }

        if (currentSession && currentSession.user && mounted) {
          const su = currentSession.user;
          setSession({
            userId: su.id,
            accessToken: currentSession.access_token,
            refreshToken: currentSession.refresh_token,
            expiresAt: new Date(currentSession.expires_at! * 1000),
            role: (su.user_metadata?.role as "pilot" | "admin") ?? "pilot",
          });
          setUser({ id: su.id, email: su.email ?? "", role: "pilot" });
        } else {
          // No session — clear tokens and go to login
          await secureStorage.delete(SESSION_KEY).catch(() => {});
          await secureStorage.delete(AUTH_TOKEN_KEY).catch(() => {});
          await secureStorage.delete(REFRESH_TOKEN_KEY).catch(() => {});
          if (mounted) reset();
        }
      } catch {
        if (mounted) reset();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    restoreSession();
    
    // Hard failsafe — never stay loading more than 5 seconds (allows slow networks)
    const failsafe = setTimeout(() => { if (mounted) { setLoading(false); } }, 5000);
    
    return () => { mounted = false; clearTimeout(failsafe); };
  }, []);

  return null;
}

function LoadingOverlay() {
  const { isLoading } = useAuthStore();
  const isDark = useThemeStore((s) => s.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  if (!isLoading) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={[styles.splash, { backgroundColor: theme.background }]}>
      <Text style={styles.splashIcon}>▲</Text>
      <Text style={[styles.splashText, { color: theme.textPrimary }]}>{APP_NAME}</Text>
      <ActivityIndicator size="small" color={colors.brand[400]} style={{ marginTop: 16 }} />
    </Animated.View>
  );
}

function BiometricLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const handleAuthenticate = useCallback(async () => {
    const success = await authenticateWithBiometrics();
    if (success) onUnlock();
  }, [onUnlock]);

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={styles.lockScreen}>
      <Ionicons name="lock-closed" size={48} color={colors.brand[600]} />
      <Text style={styles.lockTitle}>App Locked</Text>
      <Text style={styles.lockSubtitle}>Authenticate to continue</Text>
      <TouchableOpacity
        style={styles.unlockButton}
        onPress={handleAuthenticate}
        activeOpacity={0.7}
        accessibilityLabel="Unlock with biometrics"
      >
        <Ionicons name="finger-print" size={24} color="#fff" />
        <Text style={styles.unlockButtonText}>Unlock</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RootLayout() {
  useProtectedRoute();
  const router = useRouter();
  const { session, isLoading } = useAuthStore();
  const [biometricLocked, setBiometricLocked] = useState(false);

  const isDark = useThemeStore((s) => s.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  // Restore persisted theme preference before first paint
  useEffect(() => {
    useThemeStore.getState().loadSavedTheme();
  }, []);

  // Start sync manager for offline support
  useEffect(() => {
    const cleanup = startSyncManager();
    return cleanup;
  }, []);

  // Biometric lock enforcement on app launch
  useEffect(() => {
    if (isLoading || !session) return;

    let cancelled = false;
    (async () => {
      const enabled = await isBiometricLockEnabled();
      if (!enabled || cancelled) return;

      setBiometricLocked(true);
      const success = await authenticateWithBiometrics();
      if (!cancelled && success) setBiometricLocked(false);
    })();

    return () => { cancelled = true; };
  }, [isLoading, session?.userId]);

  const handleUnlock = useCallback(() => setBiometricLocked(false), []);

  // Push notification registration + listeners
  const notificationCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (isLoading || !session) return;

    // Register for push notifications (stores token in DB)
    registerForPushNotifications();

    // Listen for foreground notifications and tap responses
    const cleanup = addNotificationListener(
      (notification) => {
        // Notification received while app is in foreground
        if (__DEV__) console.log("[Push] Received:", notification.request.content.title);
      },
      (response) => {
        // User tapped a notification — navigate based on data
        const data = response.notification.request.content.data;
        if (data?.type === "chat") {
          router.push("/(app)/chat");
        } else if (data?.type === "flight_reminder") {
          router.push("/(app)/schedule");
        } else if (data?.type === "form") {
          router.push("/(app)/forms");
        }
      },
    );
    notificationCleanupRef.current = cleanup;

    return () => { cleanup(); };
  }, [isLoading, session?.userId]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <AuthSessionRestorer />
          <LoadingOverlay />
          {biometricLocked && <BiometricLockScreen onUnlock={handleUnlock} />}
          <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
              <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
              <Stack.Screen name="(app)" options={{ animation: "fade" }} />
            </Stack>
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  splashIcon: {
    fontSize: 40,
    color: colors.brand[600],
    marginBottom: 8,
  },
  splashText: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  lockScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.runway[50],
    zIndex: 110,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.runway[900],
    marginTop: 16,
  },
  lockSubtitle: {
    fontSize: 14,
    color: colors.runway[500],
    marginTop: 4,
    marginBottom: 32,
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brand[600],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
