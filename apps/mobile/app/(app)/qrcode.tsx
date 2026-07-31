import { useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, Share, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { File, Paths } from "expo-file-system";
import QRCode from "react-native-qrcode-svg";
import { colors, spacing, borderRadius, fontSize, shadows, type ThemeColors } from "@shared/theme";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";
import { useAppTheme } from "@shared/hooks/useAppTheme";

const PRESETS = [
  { label: "Form Link", icon: "document-text-outline", prefix: "fpl4flight://form/" },
  { label: "Flight Plan", icon: "airplane-outline", prefix: "fpl4flight://plan/" },
  { label: "Custom URL", icon: "link-outline", prefix: "" },
] as const;

export default function QRCodeScreen() {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
  const [inputValue, setInputValue] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(2);
  const qrRef = useRef<any>(null);
  const styles = createStyles(theme);

  const handleGenerate = useCallback(() => {
    const preset = PRESETS[selectedPreset];
    if (!preset) return;
    const value = preset.prefix + inputValue.trim();
    if (!inputValue.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQrValue(value);
  }, [inputValue, selectedPreset]);

  const handleShare = useCallback(async () => {
    if (!qrRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    qrRef.current.toDataURL(async (dataURL: string) => {
      try {
        if (Platform.OS === "web") return;
        const file = new File(Paths.cache, "qrcode.png");
        file.write(dataURL, { encoding: "base64" });
        await Share.share({ url: file.uri, message: `QR Code: ${qrValue}` });
      } catch {
        Alert.alert("Error", "Failed to share QR code.");
      }
    });
  }, [qrValue]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputValue("");
    setQrValue("");
  }, []);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>QR Code</Text>
        <Text style={styles.subtitle}>Generate and share QR codes</Text>
      </View>

      {/* Presets */}
      <View style={styles.presetRow}>
        {PRESETS.map((preset, i) => (
          <PressableScale
            key={i}
            style={[styles.presetChip, selectedPreset === i && styles.presetChipActive]}
            onPress={() => { setSelectedPreset(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            haptic
          >
            <Ionicons
              name={preset.icon as any}
              size={14}
              color={selectedPreset === i ? colors.white : theme.textSecondary}
            />
            <Text style={[styles.presetLabel, selectedPreset === i && styles.presetLabelActive]}>
              {preset.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {/* Input */}
      <Card variant="elevated" style={styles.inputCard}>
        <Text style={styles.label}>CONTENT</Text>
        <TextInput
          style={styles.input}
          placeholder={selectedPreset === 2 ? "Enter text, URL, or data..." : "Enter ID or reference..."}
          placeholderTextColor={theme.textMuted}
          value={inputValue}
          onChangeText={setInputValue}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {PRESETS[selectedPreset]?.prefix ? (
          <Text style={styles.prefixHint}>Prefix: {PRESETS[selectedPreset].prefix}</Text>
        ) : null}
        <View style={styles.buttonRow}>
          {qrValue ? (
            <PressableScale style={styles.clearBtn} onPress={handleClear} haptic>
              <Ionicons name="close-circle-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </PressableScale>
          ) : null}
          <PressableScale
            style={[styles.generateBtn, !inputValue.trim() && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            haptic
            disabled={!inputValue.trim()}
          >
            <Ionicons name="qr-code-outline" size={16} color={colors.white} />
            <Text style={styles.generateBtnText}>Generate</Text>
          </PressableScale>
        </View>
      </Card>

      {/* QR Display */}
      {qrValue ? (
        <Card variant="elevated" style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={200}
              color={colors.runway[900]}
              backgroundColor={colors.white}
              getRef={(ref: any) => (qrRef.current = ref)}
            />
          </View>
          <View style={styles.qrMeta}>
            <Text style={styles.qrMetaLabel}>Encoded:</Text>
            <Text style={styles.qrMetaValue} numberOfLines={2}>{qrValue}</Text>
          </View>
          <View style={styles.qrActions}>
            <PressableScale style={styles.shareBtn} onPress={handleShare} haptic>
              <Ionicons name="share-outline" size={18} color={colors.brand[700]} />
              <Text style={styles.shareBtnText}>Share</Text>
            </PressableScale>
            <PressableScale style={styles.copyBtn} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Copied", "QR value copied to clipboard.");
            }} haptic>
              <Ionicons name="copy-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </PressableScale>
          </View>
        </Card>
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.placeholderIconBg}>
            <Ionicons name="qr-code-outline" size={40} color={theme.textMuted} />
          </View>
          <Text style={styles.placeholderTitle}>No QR code yet</Text>
          <Text style={styles.placeholderSub}>Enter content above and tap Generate</Text>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: 2 },
  presetRow: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  presetChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.md, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  presetChipActive: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  presetLabel: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textSecondary },
  presetLabelActive: { color: colors.white },
  inputCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  label: { fontSize: fontSize.xs, fontWeight: "700", color: theme.textMuted, letterSpacing: 0.6, marginBottom: spacing.sm },
  input: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4, fontSize: fontSize.base, color: theme.textPrimary, minHeight: 72 },
  prefixHint: { fontSize: fontSize.xs, color: colors.brand[600], marginTop: spacing.xs },
  buttonRow: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  generateBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brand[600], paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md, ...shadows.md },
  generateBtnDisabled: { backgroundColor: colors.runway[300], shadowOpacity: 0, elevation: 0 },
  generateBtnText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.white },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  clearBtnText: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textSecondary },
  qrCard: { marginHorizontal: spacing.lg, alignItems: "center" },
  qrContainer: { padding: spacing.lg, backgroundColor: theme.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: theme.borderLight, alignItems: "center", justifyContent: "center" },
  qrMeta: { width: "100%", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.borderLight },
  qrMetaLabel: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textMuted, marginBottom: 2 },
  qrMetaValue: { fontSize: fontSize.sm, color: theme.textSecondary },
  qrActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, width: "100%" },
  shareBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md, backgroundColor: colors.brand[50], borderWidth: 1, borderColor: colors.brand[100] },
  shareBtnText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[700] },
  copyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md, backgroundColor: theme.borderLight, borderWidth: 1, borderColor: theme.border },
  copyBtnText: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textSecondary },
  placeholder: { alignItems: "center", paddingTop: spacing["3xl"] },
  placeholderIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.borderLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  placeholderTitle: { fontSize: fontSize.lg, fontWeight: "600", color: theme.textSecondary },
  placeholderSub: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: spacing.xs, textAlign: "center" },
});
