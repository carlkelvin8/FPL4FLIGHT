import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { ChatMessage } from "../types";

interface ReplyPreviewProps {
  message: ChatMessage;
  onCancel: () => void;
}

export function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  const displayName = message.displayName ?? message.userId.substring(0, 8);

  return (
    <View style={styles.container}>
      <View style={styles.bar} />
      <View style={styles.content}>
        <Text style={styles.label}>
          Replying to <Text style={styles.name}>{displayName}</Text>
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {message.content}
        </Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={18} color={colors.runway[500]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.runway[50],
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.runway[200],
  },
  bar: {
    width: 3,
    height: "100%",
    backgroundColor: colors.brand[500],
    borderRadius: 2,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.runway[500],
  },
  name: {
    fontWeight: "700",
    color: colors.brand[600],
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.runway[600],
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
