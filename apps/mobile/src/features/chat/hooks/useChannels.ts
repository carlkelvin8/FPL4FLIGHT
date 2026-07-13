import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { chatRepository } from "../repositories/ChatRepository";
import type { ChatChannel } from "../types";

const CHANNELS_KEY = ["chat_channels"];

export function useChannels() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: channels,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: CHANNELS_KEY,
    queryFn: async () => {
      const result = await chatRepository.fetchChannels();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const createChannel = useCallback(
    async (name: string, description: string, icon: string) => {
      setCreating(true);
      setCreateError(null);

      const result = await chatRepository.createChannel(name, description, icon);
      if (!result.success) {
        setCreateError(result.error.message);
        setCreating(false);
        return null;
      }

      // Optimistically add to cache
      queryClient.setQueryData<ChatChannel[]>(CHANNELS_KEY, (old) => [
        ...(old ?? []),
        result.data,
      ]);

      setCreating(false);
      return result.data;
    },
    [queryClient],
  );

  return {
    channels: channels ?? [],
    isLoading,
    error: error?.message ?? null,
    creating,
    createError,
    createChannel,
    refetch,
  };
}
