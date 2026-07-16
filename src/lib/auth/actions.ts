"use server";

// Actions serveur d'authentification (Supabase Auth, email + mot de passe).
// L'OTP telephone arrive quand un fournisseur SMS sera configure.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };
export type ResetState = { error?: string; sent?: boolean };
export type UpdatePwState = { error?: string; done?: boolean };

// Origine du site (https://academie.groupebm.net en prod), deduite de la requete.
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

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

// Envoie l'e-mail de reinitialisation. Vaut pour tous les comptes (eleve,
// parent, enseignant, admin). On ne revele jamais si l'e-mail existe : la
// reponse est identique dans tous les cas (protection vie privee).
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Entrez votre adresse e-mail." };

  const supabase = await createSupabaseServerClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });
  // On ignore volontairement error (email inexistant, etc.) pour ne rien reveler.
  if (error && /rate|limit/i.test(error.message)) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }
  return { sent: true };
}

// Definit le nouveau mot de passe. L'utilisateur arrive ici avec une session
// de recuperation ouverte par le lien e-mail (via /auth/callback).
export async function updatePassword(
  _prev: UpdatePwState,
  formData: FormData,
): Promise<UpdatePwState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "Lien expiré ou invalide. Recommencez depuis « Mot de passe oublié ».",
    };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Impossible de mettre à jour le mot de passe." };
  return { done: true };
}
