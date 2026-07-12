import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { relativeTime } from "@shared/utils";

import type { ChatMessage } from "../types";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, isOwn, showAvatar, onDelete }: MessageBubbleProps) {
  const initial = message.userId.substring(0, 2).toUpperCase();

  const handleLongPress = () => {
    if (!isOwn || !onDelete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onDelete(message.id);
  };

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn && (
        <View style={[styles.avatar, showAvatar ? styles.avatarVisible : styles.avatarHidden]}>
          {showAvatar && <Text style={styles.avatarText}>{initial}</Text>}
        </View>
      )}

      <View style={[styles.bubbleWrapper, isOwn && styles.bubbleWrapperOwn]}>
        {showAvatar && !isOwn && (
          <Text style={styles.userId} numberOfLines={1}>
            {message.userId.substring(0, 8)}
          </Text>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        >
          <Text style={[styles.content, isOwn && styles.contentOwn]}>{message.content}</Text>
        </TouchableOpacity>

        {showAvatar && (
          <Text style={[styles.time, isOwn && styles.timeOwn]}>
            {relativeTime(message.createdAt)}
          </Text>
        )}
      </View>

      {isOwn && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarVisible: {
    opacity: 1,
  },
  avatarHidden: {
    opacity: 0,
  },
  avatarText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.brand[600],
  },
  bubbleWrapper: {
    maxWidth: "75%",
  },
  bubbleWrapperOwn: {
    alignItems: "flex-end",
  },
  userId: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.runway[400],
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: borderRadius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.runway[200],
    borderBottomLeftRadius: borderRadius.sm,
  },
  content: {
    fontSize: fontSize.base,
    color: colors.runway[800],
    lineHeight: 22,
  },
  contentOwn: {
    color: colors.white,
  },
  time: {
    fontSize: 10,
    color: colors.runway[400],
    marginTop: 2,
    marginLeft: spacing.xs,
  },
  timeOwn: {
    marginRight: spacing.xs,
    marginLeft: 0,
  },
  spacer: {
    width: 32,
    marginLeft: spacing.sm,
  },
});
