"use server";

// Actions serveur d'authentification (Supabase Auth, email + mot de passe).
// L'OTP telephone arrive quand un fournisseur SMS sera configure.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = formData.get("role") === "parent" ? "parent" : "student";
  const classSlug = String(formData.get("class_slug") ?? "").trim() || null;

  if (!email || !password || !fullName) {
    return { error: "Nom, email et mot de passe sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role, class_slug: classSlug },
    },
  });
  if (error) return { error: error.message };
  redirect("/tableau-de-bord");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Identifiants incorrects." };
  redirect("/tableau-de-bord");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
