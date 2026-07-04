/**
 * Supabase server-side clients for use in Server Components, Route Handlers,
 * and Server Actions.
 *
 * Two clients are provided:
 *  - `createSupabaseServerClient`  — respects Row Level Security (anon key)
 *  - `createSupabaseServiceClient` — bypasses RLS (service role key, server-only)
 */

import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

function envConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes("<"));
}

/**
 * Server client that reads/writes cookies for the authenticated session.
 * Use this in most Server Components and Route Handlers.
 * Throws if Supabase env vars are not configured.
 */
export function createSupabaseServerClient() {
  if (!envConfigured()) {
    throw new Error(
      "Supabase environment variables not configured. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Partial<ResponseCookie>;
          }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (options) {
                cookieStore.set(name, value, options);
              } else {
                cookieStore.set(name, value);
              }
            });
          } catch {
            // Silent no-op in read-only Server Component context.
          }
        },
      },
    },
  );
}

/**
 * Service-role client that bypasses Row Level Security.
 * Never expose this to the browser — server-only use.
 * Throws if Supabase env vars are not configured.
 */
export function createSupabaseServiceClient() {
  if (!envConfigured()) {
    throw new Error(
      "Supabase environment variables not configured. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No cookie management for service role client.
        },
      },
    },
  );
}

/** Check whether Supabase env vars are configured without throwing. */
export function supabaseConfigured(): boolean {
  return envConfigured();
}
