/**
 * Supabase client setup, interceptors, and network utilities.
 * Additional interceptors and auth token refresh are configured in Task 7.
 */

import { createClient } from "@supabase/supabase-js";

// Force new Supabase project - no fallback to Constants
export const SUPABASE_URL = "https://tajflaaiezwlbkgyfnkh.supabase.co";
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhamZsYWFpZXp3bGJrZ3lmbmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTY2NTUsImV4cCI6MjEwMDc3MjY1NX0.0-YkHZr5UM0eEp16eHrLa7-Vud9TNccwS0A_BgHA--g";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
