// Callback des liens e-mail Supabase (reinitialisation de mot de passe,
// confirmation). Le lien pointe ici avec un `code` PKCE : on l'echange contre
// une session (pose les cookies) puis on redirige vers `next`.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // On n'autorise que des chemins internes pour `next` (pas d'URL externe).
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(
    `${origin}/mot-de-passe-oublie?erreur=lien`,
  );
}
