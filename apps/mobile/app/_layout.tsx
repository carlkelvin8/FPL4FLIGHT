import { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Stack, useSegments, useRouter, useRootNavigationState } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAuthStore } from "../src/features/auth/stores/authStore";
import { secureStorage, SESSION_KEY, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../src/core/storage";
import { supabase } from "../src/core/network";
import { colors } from "../src/shared/theme";
import { ErrorBoundary as ErrorBoundaryClass } from "../src/shared/components/ErrorBoundary";
import { startSyncManager } from "../src/core/sync-manager";
const ErrorBoundary = ErrorBoundaryClass as any;

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
        } catch {
          // Network failed, timeout, or JWT error — just go to login
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
    
    // Hard failsafe — never stay loading more than 2 seconds
    const failsafe = setTimeout(() => { if (mounted) { setLoading(false); reset(); } }, 2000);
    
    return () => { mounted = false; clearTimeout(failsafe); };
  }, []);

  return null;
}

function LoadingOverlay() {
  const { isLoading } = useAuthStore();

  if (!isLoading) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={styles.splash}>
      <Text style={styles.splashIcon}>▲</Text>
      <Text style={styles.splashText}>FPL4FLIGHT</Text>
      <ActivityIndicator size="small" color={colors.brand[400]} style={{ marginTop: 16 }} />
    </Animated.View>
  );
}

export default function RootLayout() {
  useProtectedRoute();

  // Start sync manager for offline support
  useEffect(() => {
    const cleanup = startSyncManager();
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthSessionRestorer />
          <LoadingOverlay />
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
    backgroundColor: colors.runway[50],
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
    color: colors.runway[900],
    letterSpacing: -0.5,
  },
});
