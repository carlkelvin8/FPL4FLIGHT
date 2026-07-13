import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import { chatRepository } from "../repositories/ChatRepository";
import type { ChatMessage } from "../types";

interface PinnedMessagesProps {
  channelId: string;
  visible: boolean;
  onClose: () => void;
}

export function PinnedMessages({ channelId, visible, onClose }: PinnedMessagesProps) {
  const [pinned, setPinned] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (visible) {
      chatRepository.fetchPinnedMessages(channelId).then((r) => {
        if (r.success) setPinned(r.data);
      });
    }
  }, [visible, channelId]);

  if (!visible || pinned.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pin" size={14} color={colors.amber[600]} />
        <Text style={styles.headerText}>{pinned.length} pinned</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color={colors.runway[400]} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {pinned.map((msg) => (
          <View key={msg.id} style={styles.pinnedCard}>
            <Text style={styles.pinnedAuthor} numberOfLines={1}>
              {msg.displayName ?? msg.userId.substring(0, 8)}
            </Text>
            <Text style={styles.pinnedContent} numberOfLines={2}>
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.amber[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.amber[100],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.amber[600],
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pinnedCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    width: 200,
    borderWidth: 1,
    borderColor: colors.amber[100],
    marginRight: spacing.sm,
  },
  pinnedAuthor: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.runway[500],
    marginBottom: 2,
  },
  pinnedContent: {
    fontSize: fontSize.xs,
    color: colors.runway[700],
    lineHeight: 16,
  },
});
