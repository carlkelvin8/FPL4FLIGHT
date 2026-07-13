import { useInfiniteQuery } from "@tanstack/react-query";

import { chatRepository } from "../repositories/ChatRepository";
import type { ChatMessage } from "../types";

export function useMessages(channelId: string) {
  const queryKey = ["channel_messages", channelId];

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await chatRepository.fetchMessages(channelId, pageParam);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 50) return undefined;
      return lastPage[0]?.createdAt.toISOString();
    },
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 10, // Poll every 10s as fallback for realtime
    enabled: !!channelId,
  });

  // Messages come back from repository in chronological order (oldest first).
  // Pages are loaded newest-first, so flatten all pages in order: oldest → newest.
  const messages: ChatMessage[] = data?.pages?.flat() ?? [];

  return {
    messages,
    isLoading,
    error: error?.message ?? null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    refetch,
    queryKey,
  };
}
