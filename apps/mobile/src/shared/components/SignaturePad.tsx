import { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

interface SignaturePadProps {
  value: string | null;
  onChange: (base64: string) => void;
  label?: string;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, label, disabled }: SignaturePadProps) {
  const [showPad, setShowPad] = useState(false);
  const sigRef = useRef<any>(null);

  const handleSave = (signature: string) => {
    onChange(signature);
    setShowPad(false);
  };

  const handleClear = () => {
    sigRef.current?.clearSignature();
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.preview, disabled && styles.previewDisabled]}
        onPress={() => !disabled && setShowPad(true)}
        activeOpacity={0.7}
      >
        {value ? (
          <View style={styles.signaturePreview}>
            <Text style={styles.signedText}>✓ Signed</Text>
            <Ionicons name="pencil-outline" size={14} color={colors.runway[400]} />
          </View>
        ) : (
          <View style={styles.emptyPreview}>
            <Ionicons name="create-outline" size={20} color={colors.runway[400]} />
            <Text style={styles.emptyText}>Tap to sign</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={showPad} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPad(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sign Here</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signatureArea}>
            <SignatureScreen
              ref={sigRef}
              onOK={handleSave}
              onEmpty={() => {}}
              descriptionText=""
              clearText="Clear"
              confirmText="Done"
              webStyle={`.m-signature-pad { box-shadow: none; border: none; } .m-signature-pad--body { border: none; } .m-signature-pad--footer { display: none; }`}
              autoClear={false}
              imageType="image/png"
              backgroundColor="white"
              penColor="black"
              minWidth={2}
              maxWidth={4}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.doneBtn} onPress={() => sigRef.current?.readSignature()}>
              <Ionicons name="checkmark" size={20} color={colors.white} />
              <Text style={styles.doneBtnText}>Save Signature</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  preview: { backgroundColor: colors.runway[50], borderWidth: 1.5, borderColor: colors.runway[200], borderRadius: borderRadius.md, padding: spacing.md, minHeight: 60, justifyContent: "center", alignItems: "center" },
  previewDisabled: { opacity: 0.5 },
  signaturePreview: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  signedText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.green[600] },
  emptyPreview: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, color: colors.runway[400] },
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  cancelText: { fontSize: fontSize.base, color: colors.runway[500] },
  modalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  clearText: { fontSize: fontSize.base, color: colors.red[500] },
  signatureArea: { flex: 1, margin: spacing.md, borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.md, overflow: "hidden" },
  modalFooter: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.runway[200] },
  doneBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.brand[600], paddingVertical: spacing.md, borderRadius: borderRadius.md },
  doneBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
});
