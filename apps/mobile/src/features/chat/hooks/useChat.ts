import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { useAuth } from "@features/auth/hooks/useAuth";

import { chatRepository } from "../repositories/ChatRepository";
import type { ChatMessage, TypingUser, OnlineMember } from "../types";
import { useMessages } from "./useMessages";

export function useChat(channelId: string) {
  const { messages, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, queryKey } = useMessages(channelId);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  const typingControlRef = useRef<{ sendTyping: (dn: string) => void; stopTyping: () => void; cleanup: () => void } | null>(null);
  const presenceControlRef = useRef<{ cleanup: () => void } | null>(null);

  // Realtime messages
  useEffect(() => {
    if (!channelId) return;
    const unsub = chatRepository.subscribe(channelId, (message: ChatMessage) => {
      queryClient.setQueryData<{ pages: ChatMessage[][] }>(queryKey, (old) => {
        if (!old) return old;
        const lastPage = old.pages[old.pages.length - 1] ?? [];
        if (lastPage.some((m) => m.id === message.id)) return old;
        return { ...old, pages: [...old.pages.slice(0, -1), [...lastPage, message]] };
      });
      if (!isAtBottomRef.current && message.userId !== user?.id) setNewMessageCount((c) => c + 1);
    });
    return unsub;
  }, [queryClient, queryKey, channelId, user?.id]);

  // Typing presence
  useEffect(() => {
    if (!user?.id || !channelId) return;
    const ctrl = chatRepository.subscribeTyping(channelId, user.id, setTypingUsers);
    typingControlRef.current = ctrl;
    return () => { ctrl.cleanup(); typingControlRef.current = null; };
  }, [user?.id, channelId]);

  // Online presence
  useEffect(() => {
    if (!user?.id || !channelId) return;
    const dn = user.email?.split("@")[0] ?? "Pilot";
    const ctrl = chatRepository.subscribePresence(channelId, user.id, dn, setOnlineMembers);
    presenceControlRef.current = ctrl;
    return () => { ctrl.cleanup(); presenceControlRef.current = null; };
  }, [user?.id, user?.email, channelId]);

  // Fetch members for @mentions
  useEffect(() => {
    chatRepository.fetchAllMembers().then((r) => { if (r.success) setMembers(r.data); });
  }, []);

  // Reset on channel change
  useEffect(() => { setNewMessageCount(0); setIsAtBottom(true); setSendError(null); setReplyingTo(null); }, [channelId]);

  const onTyping = useCallback(() => { typingControlRef.current?.sendTyping(user?.email?.split("@")[0] ?? "Pilot"); }, [user?.email]);
  const onStopTyping = useCallback(() => { typingControlRef.current?.stopTyping(); }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true); setSendError(null);
    const replyPayload = replyingTo ? { id: replyingTo.id, userName: replyingTo.displayName ?? replyingTo.userId.substring(0, 8), content: replyingTo.content } : undefined;
    // Detect @mentions
    const mentionMatches = trimmed.match(/@(\w+)/g);
    const mentionIds = mentionMatches ? members.filter((m) => mentionMatches.some((mm) => m.name.toLowerCase().includes(mm.slice(1).toLowerCase()))).map((m) => m.id) : [];
    const opts: Parameters<typeof chatRepository.sendMessage>[2] = { type: "text" };
    if (replyPayload) opts.replyTo = replyPayload;
    if (mentionIds.length > 0) opts.mentions = mentionIds;
    const result = await chatRepository.sendMessage(channelId, trimmed, opts);
    if (!result.success) { setSendError(result.error.message); }
    else {
      setIsAtBottom(true); setNewMessageCount(0); setReplyingTo(null);
      // Immediately refetch to show new message
      queryClient.invalidateQueries({ queryKey });
    }
    setSending(false);
  }, [sending, channelId, replyingTo, members, queryClient, queryKey]);

  const sendImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
      if (result.canceled || !result.assets[0]) return;
      setSending(true);
      const asset = result.assets[0];
      const fileName = `chat/${channelId}/${Date.now()}.jpg`;
      const uploadResult = await chatRepository.uploadFile(asset.uri, "chat-media", fileName);
      if (uploadResult.success) {
        await chatRepository.sendMessage(channelId, "", { type: "image", imageUrl: uploadResult.data });
      } else { setSendError(uploadResult.error.message); }
      setSending(false);
    } catch { setSending(false); }
  }, [channelId]);

  const sendVoice = useCallback(async (uri: string, durationMs: number) => {
    try {
      setSending(true);
      const fileName = `chat/${channelId}/${Date.now()}.m4a`;
      const uploadResult = await chatRepository.uploadFile(uri, "chat-media", fileName);
      if (uploadResult.success) {
        await chatRepository.sendMessage(channelId, "", { type: "voice", voiceUrl: uploadResult.data, voiceDuration: durationMs });
      } else { setSendError(uploadResult.error.message); }
      setSending(false);
    } catch { setSending(false); }
  }, [channelId]);

  const sendLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setSendError("Location permission denied."); return; }
      setSending(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await chatRepository.sendMessage(channelId, "", { type: "location", latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setSending(false);
    } catch { setSending(false); }
  }, [channelId]);

  const deleteMessage = useCallback(async (id: string) => {
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await chatRepository.deleteMessage(id);
        queryClient.invalidateQueries({ queryKey });
      }},
    ]);
  }, [queryClient, queryKey]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    await chatRepository.toggleReaction(messageId, emoji);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const togglePin = useCallback(async (messageId: string) => {
    await chatRepository.togglePin(messageId);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const startReply = useCallback((message: ChatMessage) => { setReplyingTo(message); setEditingMessage(null); }, []);
  const cancelReply = useCallback(() => { setReplyingTo(null); }, []);

  const startEdit = useCallback((message: ChatMessage) => {
    // Only allow editing within 5 minutes
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    if (message.createdAt.getTime() < fiveMinAgo) {
      Alert.alert("Cannot Edit", "Messages can only be edited within 5 minutes of sending.");
      return;
    }
    setEditingMessage(message);
    setReplyingTo(null);
  }, []);

  const cancelEdit = useCallback(() => { setEditingMessage(null); }, []);

  const saveEdit = useCallback(async (newContent: string) => {
    if (!editingMessage) return;
    const trimmed = newContent.trim();
    if (!trimmed) return;
    const result = await chatRepository.editMessage(editingMessage.id, trimmed);
    if (result.success) {
      setEditingMessage(null);
      queryClient.invalidateQueries({ queryKey });
    }
  }, [editingMessage, queryClient, queryKey]);

  const scrollToBottom = useCallback(() => { flatListRef.current?.scrollToEnd({ animated: true }); setIsAtBottom(true); setNewMessageCount(0); }, []);
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const atBottom = contentSize.height - layoutMeasurement.height - contentOffset.y < 50;
    setIsAtBottom(atBottom);
    isAtBottomRef.current = atBottom;
    if (atBottom) setNewMessageCount(0);
  }, []);

  return {
    messages, user, isLoading, error: error ?? sendError, sending,
    sendMessage, sendImage, sendVoice, sendLocation,
    deleteMessage, toggleReaction, togglePin,
    replyingTo, startReply, cancelReply,
    editingMessage, startEdit, cancelEdit, saveEdit,
    flatListRef, isAtBottom, newMessageCount, typingUsers, onlineMembers, members,
    scrollToBottom, handleScroll, fetchNextPage, hasNextPage, isFetchingNextPage,
    onTyping, onStopTyping,
  };
}
