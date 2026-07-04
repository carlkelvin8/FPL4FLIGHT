"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root client-side providers.
 * Wraps the application with TanStack Query's QueryClientProvider.
 * The QueryClient is created per-session (useState) to avoid shared state
 * between server renders.
 */
export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Re-fetch on window focus to keep admin data fresh.
            refetchOnWindowFocus: true,
            // 60 s stale time — reduces redundant fetches for relatively
            // static admin data (users, templates).
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only bundle in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
