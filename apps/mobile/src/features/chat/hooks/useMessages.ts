import { useInfiniteQuery } from "@tanstack/react-query";

import { chatRepository } from "../repositories/ChatRepository";
import type { ChatMessage } from "../types";

const MESSAGES_KEY = ["community_messages"];

export function useMessages() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: MESSAGES_KEY,
    queryFn: async ({ pageParam }) => {
      const result = await chatRepository.fetchMessages(pageParam);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 50) return undefined;
      return lastPage[0]?.createdAt.toISOString();
    },
    staleTime: 1000 * 30,
  });

  const messages: ChatMessage[] = data?.pages?.flat().reverse() ?? [];

  return {
    messages,
    isLoading,
    error: error?.message ?? null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    refetch,
    queryKey: MESSAGES_KEY,
  };
}
