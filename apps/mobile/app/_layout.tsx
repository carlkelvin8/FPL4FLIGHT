import { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Stack, useSegments, useRouter } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/features/auth/stores/authStore";
import { AuthRepository } from "../src/features/auth/repositories/AuthRepository";
import { RefreshTokenUseCase } from "../src/features/auth/usecases/RefreshTokenUseCase";
import { secureStorage, SESSION_KEY } from "../src/core/storage";
import { colors } from "../src/shared/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

const repo = new AuthRepository();
const refreshTokenUseCase = new RefreshTokenUseCase(repo);

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { session, isLoading, setSession, setUser, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      setLoading(true);
      try {
        const raw = await secureStorage.get(SESSION_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as {
            userId: string;
            accessToken: string;
            refreshToken: string;
            expiresAt: string;
            role: "pilot" | "admin";
          };

          const expiresAt = new Date(stored.expiresAt);
          const now = new Date();

          if (expiresAt > now) {
            if (!mounted) return;
            setSession({ ...stored, expiresAt });
            setUser({ id: stored.userId, email: "", role: stored.role });
          } else {
            const result = await refreshTokenUseCase.execute();
            if (result.success && mounted) {
              setSession(result.data);
              setUser({ id: result.data.userId, email: "", role: result.data.role });
            } else {
              if (mounted) reset();
            }
          }
        }
      } catch {
        if (mounted) reset();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    restoreSession();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/forms");
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>▲</Text>
        <Text style={styles.splashText}>PilotForms</Text>
        <ActivityIndicator size="small" color={colors.brand[400]} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.runway[50],
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
