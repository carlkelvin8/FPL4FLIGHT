import { useState, useRef, useMemo } from "react";
import {
  View, Text, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../src/features/auth/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize, shadows } from "../../src/shared/theme";
import { PressableScale } from "../../src/shared/components/PressableScale";

const DIGIT_COUNT = 6;

export default function MFAScreen() {
  const { verifyMFA, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();

  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(""));
  const refs = useRef<(TextInput | null)[]>(Array(DIGIT_COUNT).fill(null));

  const code = useMemo(() => digits.join(""), [digits]);

  function handleDigit(text: string, index: number) {
    const char = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < DIGIT_COUNT - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyPress({ nativeEvent }: { nativeEvent: { key: string } }, index: number) {
    if (nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    if (code.length !== DIGIT_COUNT) return;
    await verifyMFA(code);
  }

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <LinearGradient colors={["#1e1b4b", "#312e81", "#4f46e5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.content, { paddingTop: insets.top + spacing["3xl"] }]}>
          <View style={styles.top}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>▲ PilotForms</Text>
            </View>
            <Text style={styles.title}>Two-factor auth</Text>
            <Text style={styles.sub}>Enter the code from your authenticator app</Text>
          </View>

          <View style={[styles.card, shadows.lg]}>
            <View style={styles.digitRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { refs.current[i] = r; }}
                  style={[styles.digitInput, d ? styles.digitFilled : null]}
                  value={d}
                  onChangeText={(t) => handleDigit(t, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={1}
                  autoFocus={i === 0}
                  editable={!isLoading}
                  accessibilityLabel={`Digit ${i + 1}`}
                />
              ))}
            </View>

            {error && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <PressableScale
              style={[styles.button, code.length < DIGIT_COUNT && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={code.length < DIGIT_COUNT || isLoading}
              haptic
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  top: { alignItems: "center", marginBottom: spacing["2xl"] },
  pill: {
    backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full, marginBottom: spacing.lg,
  },
  pillText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.white, letterSpacing: -0.3 },
  title: { fontSize: fontSize["4xl"], fontWeight: "700", color: colors.white, letterSpacing: -1 },
  sub: { fontSize: fontSize.base, color: "rgba(255,255,255,0.6)", marginTop: spacing.xs, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: "center" },
  digitRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  digitInput: {
    width: 48, height: 56, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.runway[300],
    backgroundColor: colors.runway[50], textAlign: "center", fontSize: fontSize["2xl"], fontWeight: "700",
    color: colors.runway[900],
  },
  digitFilled: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  errorBox: {
    backgroundColor: colors.red[50], borderWidth: 1, borderColor: colors.red[100],
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    marginBottom: spacing.md, width: "100%",
  },
  errorText: { fontSize: fontSize.sm, color: colors.red[700], textAlign: "center" },
  button: {
    backgroundColor: colors.brand[600], borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 6, alignItems: "center", width: "100%",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: fontSize.base, fontWeight: "700", letterSpacing: 0.3 },
});
