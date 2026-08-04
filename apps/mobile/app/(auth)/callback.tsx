/**
 * OAuth Callback Route
 * 
 * Handles the redirect from external OAuth providers (Google).
 * Extracts tokens from the URL fragment and sets the Supabase session.
 * Then redirects to the main app.
 */

import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@core/network";
import { colors, fontSize } from "@shared/theme";

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the current URL that triggered this route
        const url = await Linking.getInitialURL();
        if (!url) {
          router.replace("/(auth)/login");
          return;
        }

        // Extract tokens from URL hash fragment
        const parsedUrl = new URL(url);
        const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken) {
          // Set the session in Supabase
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? "",
          });
          // Navigate to main app
          router.replace("/(app)/forms");
        } else {
          // No tokens — go back to login
          router.replace("/(auth)/login");
        }
      } catch {
        router.replace("/(auth)/login");
      }
    }

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  text: {
    marginTop: 16,
    fontSize: fontSize.sm,
    color: colors.runway[500],
  },
});
