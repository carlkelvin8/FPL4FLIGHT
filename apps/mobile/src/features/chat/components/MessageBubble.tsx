import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { ChatMessage, MessageReaction } from "../types";
import { ImageContent, VoiceContent, LocationContent, MetarInlineContent } from "./RichContent";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showHeader: boolean;
  currentUserId?: string | undefined;
  onDelete?: ((id: string) => void) | undefined;
  onReact?: ((messageId: string) => void) | undefined;
  onReply?: ((message: ChatMessage) => void) | undefined;
  onToggleReaction?: ((messageId: string, emoji: string) => void) | undefined;
  onPin?: ((messageId: string) => void) | undefined;
  onEdit?: ((message: ChatMessage) => void) | undefined;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
}

export function MessageBubble({
  message,
  isOwn,
  showHeader,
  currentUserId,
  onDelete,
  onReact,
  onReply,
  onToggleReaction,
  onPin,
  onEdit,
}: MessageBubbleProps) {
  const displayName = message.displayName ?? message.userId.substring(0, 8);
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const avatarBg = message.avatarColor ?? colors.brand[500];

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Show reaction picker on long press
    onReact?.(message.id);
  };

  return (
    <View style={[styles.container, showHeader && styles.containerWithHeader]}>
      {/* Reply context */}
      {message.replyTo && (
        <View style={styles.replyContext}>
          <View style={styles.replyBar} />
          <Ionicons name="return-up-back" size={12} color={colors.runway[400]} />
          <Text style={styles.replyName} numberOfLines={1}>
            {message.replyTo.displayName}
          </Text>
          <Text style={styles.replyPreview} numberOfLines={1}>
            {message.replyTo.content}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.92}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={styles.row}
      >
        {/* Avatar column */}
        <View style={styles.avatarCol}>
          {showHeader ? (
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          ) : (
            <View style={styles.avatarSpacer} />
          )}
        </View>

        {/* Content column */}
        <View style={styles.contentCol}>
          {showHeader && (
            <View style={styles.header}>
              <Text style={[styles.username, isOwn && styles.usernameOwn]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.timestamp}>{formatTimestamp(message.createdAt)}</Text>
            </View>
          )}
          <Text style={styles.messageText}>{message.content}</Text>

          {/* Rich content */}
          {message.type === "image" && <ImageContent message={message} />}
          {message.type === "voice" && <VoiceContent message={message} />}
          {message.type === "location" && <LocationContent message={message} />}
          {message.type === "text" && <MetarInlineContent message={message} />}

          {/* Pinned indicator */}
          {message.isPinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={10} color={colors.amber[600]} />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}

          {/* Action buttons (reply, react, pin) */}
          <View style={styles.actions}>
            {onReply && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onReply(message)} activeOpacity={0.7}>
                <Ionicons name="arrow-undo-outline" size={14} color={colors.runway[400]} />
              </TouchableOpacity>
            )}
            {onReact && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onReact(message.id)} activeOpacity={0.7}>
                <Ionicons name="happy-outline" size={14} color={colors.runway[400]} />
              </TouchableOpacity>
            )}
            {onPin && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onPin(message.id)} activeOpacity={0.7}>
                <Ionicons name={message.isPinned ? "pin" : "pin-outline"} size={14} color={colors.amber[500]} />
              </TouchableOpacity>
            )}
            {isOwn && onEdit && (Date.now() - message.createdAt.getTime() < 5 * 60 * 1000) && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onEdit(message)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.brand[500]} />
              </TouchableOpacity>
            )}
            {isOwn && onDelete && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); onDelete(message.id); }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color={colors.red[500]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <View style={styles.reactionsRow}>
              {message.reactions.map((reaction) => (
                <TouchableOpacity
                  key={reaction.emoji}
                  style={[
                    styles.reactionBadge,
                    currentUserId && reaction.userIds.includes(currentUserId) && styles.reactionBadgeOwn,
                  ]}
                  onPress={() => onToggleReaction?.(message.id, reaction.emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={[
                    styles.reactionCount,
                    currentUserId && reaction.userIds.includes(currentUserId) && styles.reactionCountOwn,
                  ]}>
                    {reaction.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  containerWithHeader: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  replyContext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 52,
    marginBottom: 4,
  },
  replyBar: {
    width: 2,
    height: 14,
    backgroundColor: colors.brand[300],
    borderRadius: 1,
    marginRight: 2,
  },
  replyName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.runway[500],
    maxWidth: 80,
  },
  replyPreview: {
    fontSize: 11,
    color: colors.runway[400],
    flex: 1,
  },
  row: {
    flexDirection: "row",
  },
  avatarCol: {
    width: 40,
    marginRight: spacing.sm,
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.white,
  },
  avatarSpacer: {
    width: 36,
    height: 0,
  },
  contentCol: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginBottom: 2,
  },
  username: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.runway[800],
  },
  usernameOwn: {
    color: colors.brand[600],
  },
  timestamp: {
    fontSize: 11,
    color: colors.runway[400],
    fontWeight: "400",
  },
  messageText: {
    fontSize: fontSize.base,
    color: colors.runway[700],
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 4,
    opacity: 0.6,
  },
  actionBtn: {
    width: 28,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.sm,
  },
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.amber[600],
  },
  reactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.runway[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.runway[200],
  },
  reactionBadgeOwn: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[200],
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.runway[600],
  },
  reactionCountOwn: {
    color: colors.brand[600],
  },
});
