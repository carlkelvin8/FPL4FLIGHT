import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/features/auth/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize, shadows } from "../../src/shared/theme";
import { PressableScale } from "../../src/shared/components/PressableScale";

export default function LoginScreen() {
  const { signIn, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSignIn() {
    setLocalError(null);
    if (!email.trim()) { setLocalError("Please enter your email address."); return; }
    if (!password) { setLocalError("Please enter your password."); return; }
    await signIn({ email: email.trim(), password });
  }

  const displayError = localError ?? error?.message ?? null;

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1e1b4b", "#312e81", "#4f46e5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing["2xl"] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <View style={styles.logoPill}>
              <Text style={styles.logoIcon}>▲</Text>
              <Text style={styles.logoText}>PilotForms</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSub}>Sign in to continue flying</Text>
          </View>

          <View style={[styles.card, shadows.lg]}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor={colors.runway[400]}
                value={email}
                onChangeText={(v) => { setEmail(v); setLocalError(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                editable={!isLoading}
                accessibilityLabel="Email address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.runway[400]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setLocalError(null); }}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="current-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  editable={!isLoading}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityLabel={showPassword ? "Hide" : "Show"}
                >
                  <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {displayError && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorIcon}>!</Text>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            <PressableScale style={styles.button} onPress={handleSignIn} disabled={isLoading} haptic>
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </PressableScale>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Create one</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { StatusBar } from "expo-status-bar";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing["2xl"] },
  topSection: { alignItems: "center", marginBottom: spacing["2xl"] },
  logoPill: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full, marginBottom: spacing.lg,
  },
  logoIcon: { fontSize: 18, color: colors.white },
  logoText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.white, letterSpacing: -0.3 },
  welcomeTitle: { fontSize: fontSize["4xl"], fontWeight: "700", color: colors.white, letterSpacing: -1 },
  welcomeSub: { fontSize: fontSize.base, color: "rgba(255,255,255,0.6)", marginTop: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[700], marginBottom: spacing.xs + 2 },
  input: {
    backgroundColor: colors.runway[50],
    borderWidth: 1, borderColor: colors.runway[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    fontSize: fontSize.base, color: colors.runway[900],
  },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: spacing.md, top: 0, bottom: 0, justifyContent: "center" },
  eyeText: { fontSize: 20 },
  forgotRow: { alignItems: "flex-end", marginBottom: spacing.md },
  forgotText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600] },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.red[50], borderWidth: 1, borderColor: colors.red[100],
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  errorIcon: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.red[500],
    color: colors.white, textAlign: "center", lineHeight: 22, fontSize: fontSize.xs, fontWeight: "700", overflow: "hidden",
  },
  errorText: { flex: 1, fontSize: fontSize.sm, color: colors.red[700] },
  button: {
    backgroundColor: colors.brand[600], borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 6, alignItems: "center",
  },
  buttonText: { color: colors.white, fontSize: fontSize.base, fontWeight: "700", letterSpacing: 0.3 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
  footerText: { fontSize: fontSize.sm, color: colors.runway[500] },
  footerLink: { fontSize: fontSize.sm, color: colors.brand[600], fontWeight: "700" },
});
