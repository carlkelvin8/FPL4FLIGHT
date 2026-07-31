import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { colors, spacing, borderRadius, fontSize, type ThemeColors } from "@shared/theme";
import { APP_NAME } from "@shared/constants";
import { useAppTheme } from "@shared/hooks/useAppTheme";

interface QRShareModalProps {
  visible: boolean;
  onClose: () => void;
  formId: string;
  formName: string;
}

export function QRShareModal({ visible, onClose, formId, formName }: QRShareModalProps) {
  const { colors: theme } = useAppTheme();
  const styles = createStyles(theme);
  // Generate a deep link URL for this form
  const shareUrl = `fpl4flight://form/${formId}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Form</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.formName}>{formName}</Text>
          <Text style={styles.subtitle}>Scan this QR code to view this form</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={shareUrl}
              size={200}
              color={colors.runway[900]}
              backgroundColor={colors.white}
            />
          </View>

          <Text style={styles.urlText}>{shareUrl}</Text>

          <View style={styles.instructions}>
            <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
            <Text style={styles.instructionText}>
              Other {APP_NAME} users can scan this code to open and view this form on their device.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  container: { backgroundColor: theme.surface, borderRadius: borderRadius.xl, padding: spacing.lg, width: "100%", maxWidth: 320, alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: "700", color: theme.textPrimary },
  formName: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600], marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: theme.textMuted, marginBottom: spacing.lg },
  qrContainer: { padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 2, borderColor: theme.borderLight, marginBottom: spacing.md },
  urlText: { fontSize: fontSize.xs, color: theme.textMuted, fontFamily: "monospace", marginBottom: spacing.md },
  instructions: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingHorizontal: spacing.sm },
  instructionText: { flex: 1, fontSize: fontSize.xs, color: theme.textMuted, lineHeight: 16 },
});
