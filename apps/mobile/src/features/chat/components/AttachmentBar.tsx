import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { colors, spacing, borderRadius } from "@shared/theme";

interface AttachmentBarProps {
  onPickImage: () => void;
  onRecordVoice: () => void;
  onShareLocation: () => void;
  onClose: () => void;
}

export function AttachmentBar({ onPickImage, onRecordVoice, onShareLocation, onClose }: AttachmentBarProps) {
  const tap = (fn: () => void) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={tap(onPickImage)} activeOpacity={0.7}>
        <Ionicons name="image-outline" size={22} color={colors.brand[600]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={tap(onRecordVoice)} activeOpacity={0.7}>
        <Ionicons name="mic-outline" size={22} color={colors.red[500]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={tap(onShareLocation)} activeOpacity={0.7}>
        <Ionicons name="location-outline" size={22} color={colors.green[600]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <Ionicons name="close" size={18} color={colors.runway[500]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.runway[200],
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.runway[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.runway[200],
  },
  closeBtn: {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
