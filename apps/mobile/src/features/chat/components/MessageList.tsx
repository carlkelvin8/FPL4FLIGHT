import { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string | undefined;
  isLoading: boolean;
  error: string | null;
  flatListRef: React.RefObject<FlatList>;
  newMessageCount: number;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  onEndReached: () => void;
  onDelete?: (id: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  error,
  flatListRef,
  newMessageCount,
  isAtBottom,
  scrollToBottom,
  onEndReached,
  onDelete,
}: MessageListProps) {
  const showAvatar = useCallback(
    (index: number) => {
      if (index === 0) return true;
      const current = messages[index];
      const prev = messages[index - 1];
      if (!current || !prev) return true;
      return current.userId !== prev.userId;
    },
    [messages],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const props: any = {
        message: item,
        isOwn: item.userId === currentUserId,
        showAvatar: showAvatar(index),
      };
      if (onDelete) props.onDelete = onDelete;
      return <MessageBubble {...props} />;
    },
    [currentUserId, showAvatar, onDelete],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const ListFooter = useMemo(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.brand[500]} />
      </View>
    );
  }, [isLoading]);

  const ListEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconBg}>
          <Ionicons name="chatbubbles-outline" size={40} color={colors.runway[400]} />
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySub}>Start the conversation!</Text>
      </View>
    );
  }, [isLoading]);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={14} color={colors.red[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        onScroll={undefined}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />

      {!isAtBottom && newMessageCount > 0 && (
        <TouchableOpacity style={styles.newMessagesBtn} onPress={scrollToBottom} activeOpacity={0.8}>
          <Ionicons name="arrow-down" size={14} color={colors.white} />
          <Text style={styles.newMessagesText}>
            {newMessageCount} new {newMessageCount === 1 ? "message" : "messages"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing["3xl"],
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.runway[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.runway[700],
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.runway[400],
    marginTop: spacing.xs,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.red[50],
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.red[100] ?? "#fee2e2",
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.red[700] ?? "#b91c1c",
    flex: 1,
  },
  newMessagesBtn: {
    position: "absolute",
    bottom: spacing.md,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newMessagesText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
