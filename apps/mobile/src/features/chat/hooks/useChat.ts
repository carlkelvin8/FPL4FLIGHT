import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@features/auth/hooks/useAuth";

import { chatRepository } from "../repositories/ChatRepository";
import type { ChatMessage } from "../types";
import { useMessages } from "./useMessages";

export function useChat() {
  const { messages, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, queryKey } = useMessages();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const flatListRef = useRef<any>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

  useEffect(() => {
    const unsubscribe = chatRepository.subscribe((message: ChatMessage) => {
      queryClient.setQueryData<{ pages: ChatMessage[][] }>(queryKey, (old) => {
        if (!old) return old;
        const lastPage = old.pages[old.pages.length - 1] ?? [];
        const exists = lastPage.some((m) => m.id === message.id);
        if (exists) return old;
        return { ...old, pages: [...old.pages.slice(0, -1), [...lastPage, message]] };
      });

      if (!isAtBottom && message.userId !== user?.id) {
        setNewMessageCount((c) => c + 1);
      }
    });
    return unsubscribe;
  }, [queryClient, queryKey, isAtBottom, user?.id]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setSendError(null);

      const result = await chatRepository.sendMessage(trimmed);
      if (!result.success) {
        setSendError(result.error.message);
      } else {
        setIsAtBottom(true);
        setNewMessageCount(0);
      }

      setSending(false);
    },
    [sending],
  );

  const deleteMessage = useCallback(async (id: string) => {
    await chatRepository.deleteMessage(id);
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setIsAtBottom(true);
    setNewMessageCount(0);
  }, []);

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      const atBottom = distanceFromBottom < 50;
      setIsAtBottom(atBottom);
      if (atBottom) setNewMessageCount(0);
    },
    [],
  );

  return {
    messages,
    user,
    isLoading,
    error: error ?? sendError,
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
  };
}
