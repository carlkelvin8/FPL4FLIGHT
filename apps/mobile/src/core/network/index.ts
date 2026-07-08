/**
 * Supabase client setup, interceptors, and network utilities.
 * Additional interceptors and auth token refresh are configured in Task 7.
 */

import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  process.env["EXPO_PUBLIC_SUPABASE_URL"] ??
  "";
const supabaseAnonKey: string =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ??
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
