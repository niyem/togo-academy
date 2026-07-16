// Rafraichit la session Supabase sur chaque requete (pattern @supabase/ssr).
// Sans cela, les jetons expires ne sont jamais renouveles cote serveur.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // mode demo sans base

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();

  // Identifiant d'appareil (limite d'appareils simultanes par abonnement).
  // Pose une seule fois par navigateur; httpOnly : non manipulable en JS.
  if (!request.cookies.get("ta_device")) {
    response.cookies.set("ta_device", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}

export const config = {
  // Tout sauf assets statiques.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.png$).*)"],
};
