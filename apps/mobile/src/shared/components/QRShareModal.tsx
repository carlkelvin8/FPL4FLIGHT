import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

interface QRShareModalProps {
  visible: boolean;
  onClose: () => void;
  formId: string;
  formName: string;
}

export function QRShareModal({ visible, onClose, formId, formName }: QRShareModalProps) {
  // Generate a deep link URL for this form
  const shareUrl = `fpl4flight://form/${formId}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Form</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.runway[500]} />
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
            <Ionicons name="information-circle-outline" size={16} color={colors.runway[400]} />
            <Text style={styles.instructionText}>
              Other FPL4FLIGHT users can scan this code to open and view this form on their device.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  container: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, width: "100%", maxWidth: 320, alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  formName: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600], marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[500], marginBottom: spacing.lg },
  qrContainer: { padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.runway[100], marginBottom: spacing.md },
  urlText: { fontSize: fontSize.xs, color: colors.runway[400], fontFamily: "monospace", marginBottom: spacing.md },
  instructions: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingHorizontal: spacing.sm },
  instructionText: { flex: 1, fontSize: fontSize.xs, color: colors.runway[400], lineHeight: 16 },
});
