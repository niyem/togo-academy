// Central place to read Supabase env vars. Phase 0 runs on seed data, so these
// may be unset; `isSupabaseConfigured` lets the data layer stay in demo mode
// until the project is provisioned. Never expose the service-role key to the client.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
