// Server-side Supabase client (App Router). Reads/writes the auth cookies so
// Server Components, Route Handlers and Server Actions share the session.
// Used in Phase 1 for auth, RLS-scoped queries, and gated content.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Session refresh is handled by middleware in Phase 1.
        }
      },
    },
  });
}
