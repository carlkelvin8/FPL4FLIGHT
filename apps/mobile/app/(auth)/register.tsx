import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Keyboard, TouchableWithoutFeedback,
} from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { useAuth } from "@features/auth/hooks/useAuth";
import { getPasswordStrength } from "@shared/utils/validationUtils";
import { colors, spacing, borderRadius, fontSize, type ThemeColors } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { useAppTheme } from "@shared/hooks/useAppTheme";
import { APP_NAME } from "@shared/constants";

const STRENGTH = ["Weak", "Fair", "Good", "Strong"] as const;
const STRENGTH_COLORS = [colors.red[500], colors.amber[500], colors.brand[500], colors.green[500]] as const;

export default function RegisterScreen() {
  const { register, isLoading, error } = useAuth();
  const { colors: theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

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

  const hasValidationErrors = Object.values(errors).some((e) => e.length > 0);

  async function handleRegister() {
    if (!validate()) return;
    await register({ email: email.trim(), password, confirmPassword });
  }

  const serverError = error?.message ?? null;
  const styles = createStyles(theme);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing["2xl"] }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.topSection}>
              <View style={styles.logo}>
                <Text style={styles.logoIcon}>▲</Text>
                <Text style={styles.brandName}>{APP_NAME}</Text>
              </View>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join the fleet</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@company.com"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: "" })); }}
                  autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
                  textContentType="emailAddress" autoComplete="email" returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!isLoading}
                  selectionColor={colors.brand[400]}
                />
                {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Create a strong password"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: "" })); }}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword" autoComplete="new-password" returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    editable={!isLoading}
                    selectionColor={colors.brand[400]}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                {strength !== null && (
                  <View style={styles.strengthRow} accessibilityLabel={`Strength: ${STRENGTH[strength]}`}>
                    <View style={styles.bars}>
                      {[0, 1, 2, 3].map((i) => (
                        <View key={i} style={[styles.bar, { backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : theme.border }]} />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>{STRENGTH[strength]}</Text>
                  </View>
                )}
                <Text style={styles.hint}>Min 8 chars · uppercase · lowercase · digit · special</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  ref={confirmRef}
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={theme.textMuted}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: "" })); }}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword" autoComplete="new-password" returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  editable={!isLoading}
                  selectionColor={colors.brand[400]}
                />
                {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
              </View>

              {serverError && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{serverError}</Text>
                </Animated.View>
              )}

              <PressableScale
                style={[styles.button, (isLoading || hasValidationErrors) && styles.buttonMuted]}
                onPress={handleRegister}
                disabled={isLoading || hasValidationErrors}
              >
                {isLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.buttonText}>Create account</Text>}
              </PressableScale>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.footerLink}>Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const INPUT_HEIGHT = 50;

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing["2xl"] },
    topSection: { alignItems: "center", marginBottom: spacing["2xl"] },
    logo: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing["2xl"] },
    logoIcon: { fontSize: 22, color: colors.brand[600] },
    brandName: { fontSize: fontSize.xl, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.3 },
    title: { fontSize: 32, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.5, marginBottom: spacing.xs },
    subtitle: { fontSize: fontSize.base, color: theme.textMuted, fontWeight: "400" },
    form: { width: "100%" },
    inputGroup: { marginBottom: spacing.md },
    label: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.sm },
    input: {
      height: INPUT_HEIGHT, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border,
      borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: fontSize.base, color: theme.textPrimary, fontWeight: "500",
    },
    inputError: { borderColor: colors.red[500] },
    fieldError: { fontSize: fontSize.xs, color: colors.red[600], marginTop: spacing.xs + 2 },
    passwordRow: { position: "relative", justifyContent: "center" },
    passwordInput: { paddingRight: 60 },
    eyeBtn: { position: "absolute", right: spacing.md },
    eyeText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.brand[600], textTransform: "uppercase", letterSpacing: 0.5 },
    strengthRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs + 4, marginTop: spacing.sm + 2 },
    bars: { flexDirection: "row", gap: spacing.xs, flex: 1 },
    bar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: fontSize.xs, fontWeight: "600", minWidth: 44, textAlign: "right" },
    hint: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: spacing.xs + 2 },
    errorBox: {
      backgroundColor: colors.red[50], borderWidth: 1, borderColor: colors.red[100],
      borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
      marginBottom: spacing.md,
    },
    errorText: { fontSize: fontSize.sm, color: colors.red[700], fontWeight: "500" },
    button: { height: INPUT_HEIGHT + 2, backgroundColor: colors.runway[900], borderRadius: borderRadius.md, alignItems: "center", justifyContent: "center" },
    buttonMuted: { opacity: 0.5 },
    buttonText: { color: colors.white, fontSize: fontSize.base, fontWeight: "600", letterSpacing: 0.3 },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg + spacing.sm },
    footerText: { fontSize: fontSize.sm, color: theme.textMuted, fontWeight: "400" },
    footerLink: { fontSize: fontSize.sm, color: colors.brand[600], fontWeight: "600" },
  });
