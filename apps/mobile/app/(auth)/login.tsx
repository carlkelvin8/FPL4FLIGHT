import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Switch,
} from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@features/auth/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

const REMEMBER_KEY = "fpl4flight_remember_me";
const SAVED_EMAIL_KEY = "fpl4flight_saved_email";
const SAVED_PASS_KEY = "fpl4flight_saved_pass";

export default function LoginScreen() {
  const { signIn, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load saved credentials on mount
  useEffect(() => {
    (async () => {
      try {
        const remembered = await SecureStore.getItemAsync(REMEMBER_KEY);
        if (remembered === "true") {
          const savedEmail = await SecureStore.getItemAsync(SAVED_EMAIL_KEY);
          const savedPass = await SecureStore.getItemAsync(SAVED_PASS_KEY);
          if (savedEmail) setEmail(savedEmail);
          if (savedPass) setPassword(savedPass);
          setRememberMe(true);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  async function handleSignIn() {
    setLocalError(null);
    if (!email.trim()) { setLocalError("Please enter your email address."); return; }
    if (!password) { setLocalError("Please enter your password."); return; }

    // Save or clear credentials based on remember me
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync(REMEMBER_KEY, "true");
        await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email.trim());
        await SecureStore.setItemAsync(SAVED_PASS_KEY, password);
      } else {
        await SecureStore.deleteItemAsync(REMEMBER_KEY);
        await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
        await SecureStore.deleteItemAsync(SAVED_PASS_KEY);
      }
    } catch { /* ignore */ }

    await signIn({ email: email.trim(), password });
  }

  const displayError = localError ?? error?.message ?? null;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.flex}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.container, { paddingTop: insets.top }]}>
            <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.topSection}>
              <View style={styles.logo}>
                <Text style={styles.logoIcon}>▲</Text>
                <Text style={styles.brandName}>FPL4FLIGHT</Text>
              </View>
              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.subtitle}>Enter your credentials to continue</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
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
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!isLoading}
                  selectionColor={colors.brand[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordRef}
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
              </View>

              <View style={styles.rememberRow}>
                <TouchableOpacity style={styles.rememberLeft} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert("Reset Password", "Password reset is not yet available. Contact your administrator.", [{ text: "OK" }]);
                }}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {displayError && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{displayError}</Text>
                </Animated.View>
              )}

              <PressableScale
                style={[styles.button, !canSubmit && styles.buttonMuted]}
                onPress={handleSignIn}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Sign in</Text>
                )}
              </PressableScale>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.footerLink}>Create one</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const INPUT_HEIGHT = 50;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  topSection: {
    alignItems: "center",
    marginBottom: spacing["2xl"] + spacing.lg,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing["2xl"],
  },
  logoIcon: {
    fontSize: 22,
    color: colors.brand[600],
  },
  brandName: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.runway[900],
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.runway[900],
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.runway[500],
    fontWeight: "400",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.runway[600],
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  input: {
    height: INPUT_HEIGHT,
    backgroundColor: colors.runway[50],
    borderWidth: 1,
    borderColor: colors.runway[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.runway[900],
    fontWeight: "500",
  },
  passwordRow: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeBtn: {
    position: "absolute",
    right: spacing.md,
  },
  eyeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.brand[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.brand[600],
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  rememberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.runway[300],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  rememberText: {
    fontSize: fontSize.sm,
    color: colors.runway[600],
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: colors.red[50],
    borderWidth: 1,
    borderColor: colors.red[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.red[700],
    fontWeight: "500",
  },
  button: {
    height: INPUT_HEIGHT + 2,
    backgroundColor: colors.runway[900],
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonMuted: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg + spacing.sm,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.runway[500],
    fontWeight: "400",
  },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.brand[600],
    fontWeight: "600",
  },
});
