import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

interface CreateChannelModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, icon: string) => void;
  creating: boolean;
  error: string | null;
}

const ICON_OPTIONS = [
  "chatbubble-outline",
  "airplane-outline",
  "cloud-outline",
  "radio-outline",
  "cafe-outline",
  "megaphone-outline",
  "flag-outline",
  "earth-outline",
  "compass-outline",
  "navigate-outline",
];

export function CreateChannelModal({
  visible,
  onClose,
  onCreate,
  creating,
  error,
}: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("chatbubble-outline");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name, description, selectedIcon);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedIcon("chatbubble-outline");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Channel</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.runway[500]} />
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Channel Name</Text>
            <View style={styles.nameInputRow}>
              <Text style={styles.hashPrefix}>#</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. flight-planning"
                placeholderTextColor={colors.runway[400]}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.descInput}
              placeholder="What's this channel about?"
              placeholderTextColor={colors.runway[400]}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />
          </View>

          {/* Icon picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionActive,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={selectedIcon === icon ? colors.brand[600] : colors.runway[500]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Error */}
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <PressableScale
              onPress={handleCreate}
              haptic
              style={[styles.createBtn, (!name.trim() || creating) && styles.createBtnDisabled]}
              disabled={!name.trim() || creating}
            >
              <Text style={styles.createText}>
                {creating ? "Creating..." : "Create Channel"}
              </Text>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.runway[900],
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.runway[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  nameInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.runway[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.runway[200],
    paddingHorizontal: spacing.md,
    height: 44,
  },
  hashPrefix: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.runway[400],
    marginRight: spacing.xs,
  },
  nameInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.runway[800],
  },
  descInput: {
    backgroundColor: colors.runway[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.runway[200],
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: fontSize.base,
    color: colors.runway[800],
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.runway[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.runway[200],
  },
  iconOptionActive: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[300],
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.red[600],
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.runway[100],
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.runway[600],
  },
  createBtn: {
    flex: 2,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnDisabled: {
    backgroundColor: colors.runway[200],
  },
  createText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.white,
  },
});
