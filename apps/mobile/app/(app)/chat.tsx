import { useCallback, useEffect } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "@shared/theme";
import { useChat } from "@features/chat/hooks/useChat";
import { MessageList } from "@features/chat/components/MessageList";
import { ChatInput } from "@features/chat/components/ChatInput";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages,
    user,
    isLoading,
    error,
    sending,
    sendMessage,
    deleteMessage,
    flatListRef,
    isAtBottom,
    newMessageCount,
    scrollToBottom,
    handleScroll,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChat();

  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isAtBottom, flatListRef]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScrollWrap = useCallback(
    (event: any) => {
      handleScroll(event);
    },
    [handleScroll],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Ionicons name="chatbubbles" size={20} color={colors.brand[600]} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSub}>Pilot chat room</Text>
          </View>
        </View>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Live</Text>
        </View>
      </View>

      <MessageList
        messages={messages}
        currentUserId={user?.id}
        isLoading={isLoading}
        error={error}
        flatListRef={flatListRef}
        newMessageCount={newMessageCount}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        onEndReached={handleEndReached}
        onDelete={deleteMessage}
      />

      <View style={{ paddingBottom: insets.bottom }}>
        <ChatInput onSend={sendMessage} sending={sending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.runway[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.runway[200],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.runway[900],
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: colors.runway[400],
  },
  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.green[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green[500],
  },
  onlineText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.green[600],
  },
});
