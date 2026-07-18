"use server";

// Actions de l'espace collaboratif (Phase 1) :
// - applyAsCollaborator : candidature publique (concepteur ou inspecteur).
// - reviewCollaborator : l'admin approuve (accorde le role) ou refuse.
// - assignConcepteur : l'admin attribue une lecon suivie a un concepteur.
// - submitVersion : le concepteur depose une version (fichier) d'une lecon.
//
// Le role n'est jamais accorde en self-service : seule l'approbation admin
// fait passer profiles.role a 'concepteur' / 'inspecteur'.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CollabState = { error?: string; ok?: boolean };

const now = () => new Date().toISOString();

type UploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};
const DOC_MAX = 25 * 1024 * 1024;
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "application/zip",
];
function asFile(v: FormDataEntryValue | null): UploadFile | null {
  if (v && typeof v === "object" && "arrayBuffer" in v && "size" in v) {
    return v as unknown as UploadFile;
  }
  return null;
}

async function requireRole(role: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, ok: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { supabase, user, ok: profile?.role === role };
}

// ---- Candidature publique ----
export async function applyAsCollaborator(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const desiredRole = String(formData.get("role") ?? "");
  const headline = String(formData.get("headline") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;
  const subjectKeys = formData.getAll("subjects").map(String).filter(Boolean);
  const ipAccepted = formData.get("ip_accept") === "on";
  const cv = asFile(formData.get("cv"));

  if (!email || !password || !fullName) {
    return { error: "Nom, e-mail et mot de passe sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (!["concepteur", "inspecteur"].includes(desiredRole)) {
    return { error: "Choisissez votre rôle : concepteur ou inspecteur." };
  }
  if (!ipAccepted) {
    return { error: "Vous devez accepter les conditions de cession des droits." };
  }
  if (cv && cv.size > DOC_MAX) return { error: "CV : fichier trop lourd (25 Mo max)." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, role: "student" } },
  });
  if (error) return { error: error.message };
  const userId = data.user?.id;
  if (!userId) return { error: "Inscription impossible. Réessayez." };

  const admin = createSupabaseAdminClient();
  if (admin) {
    let cvPath: string | null = null;
    if (cv && cv.size > 0) {
      const ext = (cv.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${userId}/cv.${ext}`;
      const { error: uErr } = await admin.storage
        .from("collab-docs")
        .upload(path, await cv.arrayBuffer(), {
          contentType: cv.type || "application/octet-stream",
          upsert: true,
        });
      cvPath = uErr ? null : path;
    }
    const { error: aErr } = await admin.from("collab_applications").upsert({
      user_id: userId,
      desired_role: desiredRole,
      full_name: fullName,
      phone: phone || null,
      headline,
      message,
      subject_keys: subjectKeys,
      cv_path: cvPath,
      ip_accepted: true,
      ip_accepted_at: now(),
      status: "pending",
      updated_at: now(),
    });
    if (aErr) return { error: "Compte créé mais candidature non enregistrée." };
  }
  redirect("/rejoindre-production/merci");
}

// ---- Approbation par l'admin ----
export async function reviewCollaborator(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };

  const userId = String(formData.get("user_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const desiredRole = String(formData.get("desired_role") ?? "");
  if (!userId || !["approved", "rejected"].includes(decision)) {
    return { error: "Action invalide." };
  }
  const { error: sErr } = await supabase
    .from("collab_applications")
    .update({ status: decision, updated_at: now() })
    .eq("user_id", userId);
  if (sErr) return { error: "Erreur lors de la mise à jour." };

  if (decision === "approved" && ["concepteur", "inspecteur"].includes(desiredRole)) {
    const { error: rErr } = await supabase
      .from("profiles")
      .update({ role: desiredRole })
      .eq("id", userId);
    if (rErr) return { error: "Candidature validée mais rôle non accordé." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

// ---- Attribution d'un module a un concepteur ----
export async function assignConcepteur(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };

  const chapterId = String(formData.get("chapter_id") ?? "");
  const concepteurId = String(formData.get("concepteur_id") ?? "");
  if (!chapterId) return { error: "Module manquant." };
  const { error } = await supabase
    .from("content_production")
    .update({
      concepteur_id: concepteurId || null,
      updated_at: now(),
    })
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec de l'attribution." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// ---- Soumission d'une version (module) par le concepteur ----
export async function submitVersion(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, user, ok } = await requireRole("concepteur");
  if (!ok || !user) return { error: "Réservé aux concepteurs." };

  const chapterId = String(formData.get("chapter_id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const file = asFile(formData.get("file"));
  if (!chapterId) return { error: "Module manquant." };
  if (!file || file.size === 0) return { error: "Ajoutez votre fichier." };
  if (file.size > DOC_MAX) return { error: "Fichier trop lourd (25 Mo max)." };
  if (file.type && !DOC_TYPES.includes(file.type)) {
    return { error: "Format accepté : PDF, Word, PowerPoint, images ou ZIP." };
  }

  // Le module doit bien etre attribue a ce concepteur.
  const { data: prod } = await supabase
    .from("content_production")
    .select("chapter_id")
    .eq("chapter_id", chapterId)
    .eq("concepteur_id", user.id)
    .single();
  if (!prod) return { error: "Ce module ne vous est pas attribué." };

  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Service indisponible." };

  const { data: last } = await admin
    .from("content_submissions")
    .select("version")
    .eq("chapter_id", chapterId)
    .order("version", { ascending: false })
    .limit(1);
  const version = (last?.[0]?.version ?? 0) + 1;

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${chapterId}/v${version}-${user.id}.${ext}`;
  const { error: uErr } = await admin.storage
    .from("collab-docs")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (uErr) return { error: "Échec du téléversement." };

  const { error: iErr } = await supabase.from("content_submissions").insert({
    chapter_id: chapterId,
    version,
    submitted_by: user.id,
    file_path: path,
    file_name: file.name,
    note,
  });
  if (iErr) return { error: "Fichier envoyé mais version non enregistrée." };

  // Le module passe en relecture (l'admin routera vers un inspecteur).
  await supabase
    .from("content_production")
    .update({ stage: "en_relecture", at_en_relecture: now(), updated_at: now() })
    .eq("chapter_id", chapterId);

  revalidatePath("/espace-concepteur");
  return { ok: true };
}
