import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../src/features/auth/hooks/useAuth";
import { getPasswordStrength } from "../../src/shared/utils/validationUtils";
import { colors, spacing, borderRadius, fontSize, shadows } from "../../src/shared/theme";
import { PressableScale } from "../../src/shared/components/PressableScale";

const STRENGTH = ["Weak", "Fair", "Good", "Strong"] as const;
const STRENGTH_COLORS = [colors.red[500], colors.amber[500], colors.brand[500], colors.green[500]] as const;

export default function RegisterScreen() {
  const { register, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Invalid email.";
    if (!password) e.password = "Password is required.";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (password && password !== confirmPassword) e.confirmPassword = "Passwords don't match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    await register({ email: email.trim(), password, confirmPassword });
  }

  const serverError = error?.message ?? null;

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <LinearGradient colors={["#1e1b4b", "#312e81", "#4f46e5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing["2xl"] }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.top}>
            <View style={styles.pill}>
              <Text style={styles.pillIcon}>▲</Text>
              <Text style={styles.pillText}>PilotForms</Text>
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>Join the fleet</Text>
          </View>

          <View style={[styles.card, shadows.lg]}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="you@company.com"
                placeholderTextColor={colors.runway[400]}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: "" })); }}
                autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
                textContentType="emailAddress" autoComplete="email" returnKeyType="next"
                editable={!isLoading} accessibilityLabel="Email"
              />
              {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, styles.pwInput, errors.password && styles.inputError]}
                  placeholder="Create a strong password"
                  placeholderTextColor={colors.runway[400]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: "" })); }}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword" autoComplete="new-password" returnKeyType="next"
                  editable={!isLoading} accessibilityLabel="Password"
                />
                <TouchableOpacity style={styles.eye} onPress={() => setShowPassword((v) => !v)}>
                  <Text style={{ fontSize: 20 }}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
              {strength !== null && (
                <View style={styles.strengthRow} accessibilityLabel={`Strength: ${STRENGTH[strength]}`}>
                  <View style={styles.bars}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={[styles.bar, { backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : colors.runway[200] }]} />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>{STRENGTH[strength]}</Text>
                </View>
              )}
              <Text style={styles.hint}>Min 8 chars · uppercase · lowercase · digit · special</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.runway[400]}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: "" })); }}
                secureTextEntry={!showPassword}
                textContentType="newPassword" autoComplete="new-password" returnKeyType="done"
                onSubmitEditing={handleRegister}
                editable={!isLoading} accessibilityLabel="Confirm password"
              />
              {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
            </View>

            {serverError && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorIcon}>!</Text>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            <PressableScale style={styles.button} onPress={handleRegister} disabled={isLoading} haptic>
              {isLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Create account</Text>}
            </PressableScale>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity><Text style={styles.footerLink}>Sign in</Text></TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing["2xl"] },
  top: { alignItems: "center", marginBottom: spacing["2xl"] },
  pill: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full, marginBottom: spacing.lg,
  },
  pillIcon: { fontSize: 18, color: colors.white },
  pillText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.white, letterSpacing: -0.3 },
  title: { fontSize: fontSize["4xl"], fontWeight: "700", color: colors.white, letterSpacing: -1 },
  sub: { fontSize: fontSize.base, color: "rgba(255,255,255,0.6)", marginTop: spacing.xs },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[700], marginBottom: spacing.xs + 2 },
  input: {
    backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[300],
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    fontSize: fontSize.base, color: colors.runway[900],
  },
  inputError: { borderColor: colors.red[500] },
  fieldError: { fontSize: fontSize.xs, color: colors.red[600], marginTop: spacing.xs },
  pwRow: { position: "relative" },
  pwInput: { paddingRight: 48 },
  eye: { position: "absolute", right: spacing.md, top: 0, bottom: 0, justifyContent: "center" },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs + 4, marginTop: spacing.sm },
  bars: { flexDirection: "row", gap: spacing.xs, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: fontSize.xs, fontWeight: "600", minWidth: 44, textAlign: "right" },
  hint: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: spacing.xs },
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
  button: { backgroundColor: colors.brand[600], borderRadius: borderRadius.md, paddingVertical: spacing.sm + 6, alignItems: "center" },
  buttonText: { color: colors.white, fontSize: fontSize.base, fontWeight: "700", letterSpacing: 0.3 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
  footerText: { fontSize: fontSize.sm, color: colors.runway[500] },
  footerLink: { fontSize: fontSize.sm, color: colors.brand[600], fontWeight: "700" },
});
