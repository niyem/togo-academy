// Browser Supabase client for Client Components (auth forms, realtime, etc.).
// Instantiated lazily so Phase 0 pages that never call it don't require env vars.

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
