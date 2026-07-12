// Client Supabase service-role, STRICTEMENT serveur (routes/actions).
// Contourne la RLS : ne l'utiliser qu'apres une verification d'autorisation
// explicite dans le code appelant (voir memo "tenant guard").

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

export function createSupabaseAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secret) return null;
  return createClient(supabaseUrl, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
