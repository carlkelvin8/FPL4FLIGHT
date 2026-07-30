import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, fontSize } from "@shared/theme";
import { useChat } from "@features/chat/hooks/useChat";
import { useChannels } from "@features/chat/hooks/useChannels";
import { MessageList } from "@features/chat/components/MessageList";
import { ChatInput } from "@features/chat/components/ChatInput";
import { ChannelList } from "@features/chat/components/ChannelList";
import { CreateChannelModal } from "@features/chat/components/CreateChannelModal";
import { ReactionPicker } from "@features/chat/components/ReactionPicker";
import { ReplyPreview } from "@features/chat/components/ReplyPreview";
import { OnlineMembers } from "@features/chat/components/OnlineMembers";
import { AttachmentBar } from "@features/chat/components/AttachmentBar";
import { VoiceRecorder } from "@features/chat/components/VoiceRecorder";
import { SearchModal } from "@features/chat/components/SearchModal";
import type { ChatChannel, ChatMessage } from "@features/chat/types";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { channels, createChannel, creating, createError } = useChannels();

  useEffect(() => {
    if (!activeChannel && channels.length > 0) setActiveChannel(channels[0]!);
  }, [channels, activeChannel]);

  const channelId = activeChannel?.id ?? "general";

  const {
    messages, user, isLoading, error, sending,
    sendMessage, sendImage, sendVoice, sendLocation,
    deleteMessage, toggleReaction, togglePin,
    replyingTo, startReply, cancelReply,
    editingMessage, startEdit, cancelEdit, saveEdit,
    flatListRef, isAtBottom, newMessageCount, typingUsers, onlineMembers, members,
    scrollToBottom, handleScroll, fetchNextPage, hasNextPage, isFetchingNextPage,
    onTyping, onStopTyping,
  } = useChat(channelId);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        if (isAtBottom) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isAtBottom, flatListRef]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectChannel = useCallback((ch: ChatChannel) => { setActiveChannel(ch); }, []);
  const handleCreateChannel = useCallback(async (name: string, desc: string, icon: string) => {
    const created = await createChannel(name, desc, icon);
    if (created) { setActiveChannel(created); setShowCreateModal(false); }
  }, [createChannel]);

  const handleReact = useCallback((id: string) => setReactionTarget(id), []);
  const handleSelectReaction = useCallback((emoji: string) => {
    if (reactionTarget) toggleReaction(reactionTarget, emoji);
    setReactionTarget(null);
  }, [reactionTarget, toggleReaction]);
  const handleReply = useCallback((msg: ChatMessage) => startReply(msg), [startReply]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Ionicons name={(activeChannel?.icon as any) ?? "chatbubbles"} size={20} color={colors.brand[600]} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}># {activeChannel?.name ?? "general"}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{activeChannel?.description ?? "Pilot chat room"}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(true)} activeOpacity={0.7} style={styles.headerBtn}>
            <Ionicons name="search-outline" size={18} color={colors.runway[500]} />
          </TouchableOpacity>
          <OnlineMembers members={onlineMembers} />
        </View>
      </View>

      {/* Channel list */}
      <ChannelList
        channels={channels}
        activeChannelId={channelId}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateModal(true)}
      />

      {/* Message list */}
      <MessageList
        messages={messages}
        currentUserId={user?.id}
        isLoading={isLoading}
        error={error}
        flatListRef={flatListRef}
        newMessageCount={newMessageCount}
        isAtBottom={isAtBottom}
        typingUsers={typingUsers}
        scrollToBottom={scrollToBottom}
        onEndReached={handleEndReached}
        onScroll={handleScroll}
        onDelete={deleteMessage}
        onReact={handleReact}
        onReply={handleReply}
        onToggleReaction={toggleReaction}
        onPin={togglePin}
        onEdit={startEdit}
      />

      {/* Reply preview */}
      {replyingTo && <ReplyPreview message={replyingTo} onCancel={cancelReply} />}

      {/* Edit mode preview */}
      {editingMessage && (
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.brand[50], paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.brand[200] }}>
          <Ionicons name="pencil" size={14} color={colors.brand[600]} />
          <Text style={{ flex: 1, marginLeft: spacing.sm, fontSize: fontSize.sm, color: colors.brand[700] }} numberOfLines={1}>Editing: {editingMessage.content}</Text>
          <TouchableOpacity onPress={cancelEdit}><Ionicons name="close" size={18} color={colors.runway[500]} /></TouchableOpacity>
        </View>
      )}

      {/* Voice recorder (replaces input) */}
      {showVoiceRecorder ? (
        <VoiceRecorder
          onSend={(uri, dur) => { sendVoice(uri, dur); setShowVoiceRecorder(false); }}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      ) : (
        <>
          {/* Attachment bar */}
          {showAttachments && (
            <AttachmentBar
              onPickImage={() => { sendImage(); setShowAttachments(false); }}
              onRecordVoice={() => { setShowAttachments(false); setShowVoiceRecorder(true); }}
              onShareLocation={() => { sendLocation(); setShowAttachments(false); }}
              onClose={() => setShowAttachments(false)}
            />
          )}

          {/* Input */}
          <View style={{ paddingBottom: insets.bottom }}>
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={() => setShowAttachments(!showAttachments)} style={styles.attachBtn} activeOpacity={0.7}>
                <Ionicons name={showAttachments ? "close" : "add-circle-outline"} size={24} color={colors.brand[600]} />
              </TouchableOpacity>
              <View style={styles.inputFlex}>
                <ChatInput
                  onSend={editingMessage ? saveEdit : sendMessage}
                  onTyping={onTyping}
                  onStopTyping={onStopTyping}
                  sending={sending}
                  placeholder={`Message #${activeChannel?.name ?? "general"}...`}
                />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Modals */}
      <ReactionPicker visible={!!reactionTarget} onSelect={handleSelectReaction} onClose={() => setReactionTarget(null)} />
      <CreateChannelModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateChannel} creating={creating} error={createError} />
      <SearchModal visible={showSearch} channelId={channelId} onClose={() => setShowSearch(false)} onSelectMessage={(msg) => {
        // Find the message index and scroll to it
        const index = messages.findIndex((m) => m.id === msg.id);
        if (index >= 0) {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }
      }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  headerIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: colors.runway[400], maxWidth: 160 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  headerBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  inputRow: { flexDirection: "row", alignItems: "flex-end" },
  attachBtn: { paddingLeft: spacing.md, paddingBottom: spacing.md },
  inputFlex: { flex: 1 },
});
