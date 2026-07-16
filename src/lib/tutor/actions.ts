"use server";

// Actions du tutorat en direct (tuteurs humains).
// - applyAsTutor : candidature (cree un compte + profil tuteur "pending").
// - updateTutorProfile : le tuteur edite son profil.
// - requestSession / respondSession / cancelSession : demandes de seance.
// - reviewTutor : l'admin approuve/refuse une candidature (accorde le role).
// Le role 'tutor' n'est jamais accorde en self-service : seule l'approbation
// admin fait passer profiles.role a 'tutor'.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type TutorState = { error?: string; ok?: boolean };

const now = () => new Date().toISOString();

export async function applyAsTutor(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const availability = String(formData.get("availability") ?? "").trim() || null;
  const rate = Number(formData.get("rate") ?? 0) || null;
  const subjectKeys = formData.getAll("subjects").map(String).filter(Boolean);
  const classSlugs = formData.getAll("classes").map(String).filter(Boolean);

  if (!email || !password || !fullName) {
    return { error: "Nom, e-mail et mot de passe sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (subjectKeys.length === 0) {
    return { error: "Choisissez au moins une matière que vous enseignez." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Role 'student' a la creation ; il deviendra 'tutor' apres validation.
    options: { data: { full_name: fullName, phone, role: "student" } },
  });
  if (error) return { error: error.message };
  const userId = data.user?.id;
  if (!userId) return { error: "Inscription impossible. Réessayez." };

  const admin = createSupabaseAdminClient();
  if (admin) {
    const { error: pErr } = await admin.from("tutor_profiles").upsert({
      user_id: userId,
      status: "pending",
      full_name: fullName,
      phone: phone || null,
      headline,
      bio,
      subject_keys: subjectKeys,
      class_slugs: classSlugs,
      availability,
      rate_xof: rate,
      updated_at: now(),
    });
    if (pErr) return { error: "Compte créé mais candidature non enregistrée." };
  }
  redirect("/devenir-tuteur/merci");
}

export async function updateTutorProfile(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const subjectKeys = formData.getAll("subjects").map(String).filter(Boolean);
  const classSlugs = formData.getAll("classes").map(String).filter(Boolean);
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      headline: String(formData.get("headline") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      availability: String(formData.get("availability") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      rate_xof: Number(formData.get("rate") ?? 0) || null,
      subject_keys: subjectKeys,
      class_slugs: classSlugs,
      updated_at: now(),
    })
    .eq("user_id", user.id); // RLS garantit deja la propriete
  if (error) return { error: "Erreur d'enregistrement." };
  revalidatePath("/tuteur");
  return { ok: true };
}

export async function requestSession(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour demander une séance." };

  const tutorId = String(formData.get("tutor_id") ?? "");
  if (!tutorId) return { error: "Tuteur introuvable." };
  const { error } = await supabase.from("tutor_sessions").insert({
    student_id: user.id,
    tutor_id: tutorId,
    subject_key: String(formData.get("subject") ?? "").trim() || null,
    class_slug: String(formData.get("class") ?? "").trim() || null,
    message: String(formData.get("message") ?? "").trim() || null,
    preferred_time: String(formData.get("preferred_time") ?? "").trim() || null,
    status: "requested",
  });
  if (error) return { error: "Impossible d'envoyer la demande." };
  revalidatePath("/tutorat");
  return { ok: true };
}

export async function respondSession(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!["accepted", "declined", "completed"].includes(decision)) {
    return { error: "Action invalide." };
  }
  const { error } = await supabase
    .from("tutor_sessions")
    .update({ status: decision, updated_at: now() })
    .eq("id", id)
    .eq("tutor_id", user.id); // seul le tuteur destinataire agit
  if (error) return { error: "Erreur." };
  revalidatePath("/tuteur");
  return { ok: true };
}

export async function cancelSession(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("tutor_sessions")
    .update({ status: "cancelled", updated_at: now() })
    .eq("id", id)
    .eq("student_id", user.id);
  if (error) return { error: "Erreur." };
  revalidatePath("/tableau-de-bord");
  return { ok: true };
}

// Validation d'une candidature par l'admin. Approuver accorde le role 'tutor'.
export async function reviewTutor(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { error: "Réservé à l'administration." };

  const userId = String(formData.get("user_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!["approved", "rejected"].includes(decision) || !userId) {
    return { error: "Action invalide." };
  }

  // On agit avec la session admin authentifiee : le role guard et les RLS
  // (is_admin()) l'autorisent, alors que la cle service n'a pas d'auth.uid().
  const { error: sErr } = await supabase
    .from("tutor_profiles")
    .update({ status: decision, updated_at: now() })
    .eq("user_id", userId);
  if (sErr) return { error: "Erreur lors de la mise à jour de la candidature." };

  if (decision === "approved") {
    const { error: rErr } = await supabase
      .from("profiles")
      .update({ role: "tutor" })
      .eq("id", userId);
    if (rErr) return { error: "Candidature validée mais rôle non accordé." };
  }
  revalidatePath("/admin");
  return { ok: true };
}
