"use server";

// Actions de l'espace collaboratif (Phase 1) :
// - applyAsCollaborator : candidature publique (concepteur ou inspecteur).
// - reviewCollaborator : l'admin approuve (accorde le role) ou refuse.
// - assignConcepteur : l'admin attribue une lecon suivie a un concepteur.
// - submitVersion : le concepteur depose une version (fichier) d'une lecon.
//
// Le role n'est jamais accorde en self-service : seule l'approbation admin
// fait passer profiles.role a 'concepteur' / 'inspecteur'.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendApprovalEmail } from "@/lib/email/send";
import { siteOrigin } from "@/lib/site";

export type CollabState = { error?: string; ok?: boolean };

const now = () => new Date().toISOString();

// Le CV est televerse DIRECTEMENT du navigateur vers Supabase Storage (le
// bucket accepte 25 Mo), et non via cette Server Action : Vercel plafonne le
// corps d'une fonction serverless a ~4,5 Mo, donc un CV plus lourd (photo ou
// scan de telephone) renvoyait un 413 "This page couldn't load". Cette action
// ne fait que fabriquer une URL d'upload signee (reponse minuscule).
export async function createCollabCvUploadUrl(
  ext: string,
): Promise<{ path?: string; signedUrl?: string; error?: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Service indisponible." };
  const safeExt = (ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  const rand =
    (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`);
  const path = `applications/${rand}.${safeExt}`;
  const { data, error } = await admin.storage
    .from("collab-docs")
    .createSignedUploadUrl(path);
  if (error || !data) return { error: "Préparation du téléversement impossible." };
  return { path: data.path, signedUrl: data.signedUrl };
}

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
  // Le CV a deja ete televerse cote navigateur (voir createCollabCvUploadUrl) ;
  // ici on ne recoit que son chemin dans le bucket, jamais les octets.
  const cvPathInput = String(formData.get("cv_path") ?? "").trim();

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

  const supabase = await createSupabaseServerClient();
  // Compte cree "en attente" (pending) : role provisoire student, aucun acces
  // tant que l'admin n'a pas approuve.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, role: "student", pending: "yes" } },
  });
  if (error) return { error: error.message };
  const userId = data.user?.id;
  if (!userId) return { error: "Inscription impossible. Réessayez." };

  const admin = createSupabaseAdminClient();
  if (admin) {
    // On n'accepte que les chemins produits par createCollabCvUploadUrl.
    const cvPath = cvPathInput.startsWith("applications/") ? cvPathInput : null;
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
  // On ne laisse PAS le candidat connecte : le compte reste inactif jusqu'a
  // l'approbation de l'administration. La redirection est faite cote client
  // (ce flux est appele depuis un handler, pas via <form action>).
  await supabase.auth.signOut();
  return { ok: true };
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
    // Accorde le role ET active le compte (via la session admin authentifiee).
    const { error: rErr } = await supabase
      .from("profiles")
      .update({ role: desiredRole, access_state: "active" })
      .eq("id", userId);
    if (rErr) return { error: "Candidature validée mais rôle non accordé." };

    // E-mail de connexion (best-effort : n'echoue jamais l'approbation).
    const admin = createSupabaseAdminClient();
    const email = admin ? (await admin.auth.admin.getUserById(userId)).data.user?.email : null;
    if (email) {
      const { data: prof } = await supabase
        .from("profiles").select("full_name").eq("id", userId).single();
      await sendApprovalEmail({
        to: email,
        name: prof?.full_name ?? null,
        role: desiredRole,
        loginUrl: `${await siteOrigin()}/connexion`,
      });
    }
  } else if (decision === "rejected") {
    await supabase
      .from("profiles")
      .update({ access_state: "rejected" })
      .eq("id", userId);
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

// ---- Attribution d'un module a un inspecteur (admin) ----
export async function assignInspector(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };
  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Service indisponible." };

  const chapterId = String(formData.get("chapter_id") ?? "");
  const inspectorId = String(formData.get("inspector_id") ?? "");
  if (!chapterId || !inspectorId) return { error: "Paramètres manquants." };
  const { error } = await admin
    .from("module_inspectors")
    .upsert({ chapter_id: chapterId, inspector_id: inspectorId });
  if (error) return { error: "Échec de l'attribution." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// ---- Retrait d'un inspecteur d'un module (admin) ----
export async function unassignInspector(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };
  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Service indisponible." };

  const chapterId = String(formData.get("chapter_id") ?? "");
  const inspectorId = String(formData.get("inspector_id") ?? "");
  if (!chapterId || !inspectorId) return { error: "Paramètres manquants." };
  const { error } = await admin
    .from("module_inspectors")
    .delete()
    .eq("chapter_id", chapterId)
    .eq("inspector_id", inspectorId);
  if (error) return { error: "Échec du retrait." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// ---- Depot d'une relecture par l'inspecteur ----
export async function submitReview(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, user, ok } = await requireRole("inspecteur");
  if (!ok || !user) return { error: "Réservé aux inspecteurs." };

  const chapterId = String(formData.get("chapter_id") ?? "");
  const version = parseInt(String(formData.get("version") ?? "0"), 10);
  const comment = String(formData.get("comment") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!chapterId || !version) return { error: "Paramètres manquants." };
  if (!comment) return { error: "Ajoutez vos observations." };
  if (!["changes_requested", "approved"].includes(decision)) {
    return { error: "Décision invalide." };
  }

  // L'inspecteur doit etre attribue a ce module.
  const { data: mi } = await supabase
    .from("module_inspectors")
    .select("chapter_id")
    .eq("chapter_id", chapterId)
    .eq("inspector_id", user.id)
    .single();
  if (!mi) return { error: "Ce module ne vous est pas attribué." };

  const { error } = await supabase.from("content_reviews").insert({
    chapter_id: chapterId,
    version,
    inspector_id: user.id,
    comment,
    decision,
  });
  if (error) return { error: "Échec de l'enregistrement." };

  // La decision fait avancer le module.
  const patch =
    decision === "approved"
      ? { stage: "valide", at_valide: now(), updated_at: now() }
      : { stage: "a_corriger", at_a_corriger: now(), updated_at: now() };
  await supabase.from("content_production").update(patch).eq("chapter_id", chapterId);

  revalidatePath("/espace-inspecteur");
  return { ok: true };
}

// ==================== PHASE 3 : video + cloture ====================

// L'admin attache la video produite et envoie le module en verification finale.
export async function startVideoQA(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };
  const chapterId = String(formData.get("chapter_id") ?? "");
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  if (!chapterId || !videoUrl) return { error: "Lien de la vidéo requis." };
  const { error } = await supabase
    .from("content_production")
    .update({
      video_url: videoUrl,
      stage: "verification",
      at_verification: now(),
      updated_at: now(),
    })
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec de l'envoi en vérification." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// Le concepteur OU un inspecteur attribue fait le controle qualite de la video.
export async function submitVideoReview(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["concepteur", "inspecteur"].includes(profile?.role ?? "")) {
    return { error: "Réservé aux contributeurs." };
  }

  const chapterId = String(formData.get("chapter_id") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!chapterId || !comment) return { error: "Ajoutez vos observations." };
  if (!["approved", "changes_requested"].includes(decision)) {
    return { error: "Décision invalide." };
  }

  // Le module doit etre attribue a cet utilisateur et non verrouille.
  const { data: prod } = await supabase
    .from("content_production")
    .select("chapter_id, concepteur_id, locked_at")
    .eq("chapter_id", chapterId)
    .single();
  if (!prod || prod.locked_at) return { error: "Module indisponible." };
  let allowed = prod.concepteur_id === user.id;
  if (!allowed) {
    const { data: mi } = await supabase
      .from("module_inspectors")
      .select("chapter_id")
      .eq("chapter_id", chapterId)
      .eq("inspector_id", user.id)
      .single();
    allowed = !!mi;
  }
  if (!allowed) return { error: "Ce module ne vous est pas attribué." };

  const { error } = await supabase.from("content_reviews").insert({
    chapter_id: chapterId,
    version: 0, // 0 = relecture video (pas une version de fichier)
    inspector_id: user.id,
    comment,
    decision,
    on_video: true,
  });
  if (error) return { error: "Échec de l'enregistrement." };
  revalidatePath("/espace-concepteur");
  revalidatePath("/espace-inspecteur");
  return { ok: true };
}

// L'admin publie le module (en ligne).
export async function publishModule(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!chapterId) return { error: "Module manquant." };
  const { error } = await supabase
    .from("content_production")
    .update({ stage: "en_ligne", at_en_ligne: now(), updated_at: now() })
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec de la publication." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// L'admin cloture la collaboration : verrouille et retire les droits.
export async function closeCollaboration(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, user, ok } = await requireRole("admin");
  if (!ok || !user) return { error: "Réservé à l'administration." };
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!chapterId) return { error: "Module manquant." };
  const { error } = await supabase
    .from("content_production")
    .update({ locked_at: now(), locked_by: user.id, updated_at: now() })
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec de la clôture." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// ==================== PHASE 4 : paie ====================

// L'admin marque un montant comme PAYE a un contributeur pour un module.
export async function markPaid(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };
  const chapterId = String(formData.get("chapter_id") ?? "");
  const payeeId = String(formData.get("payee_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const amount = parseInt(String(formData.get("amount_xof") ?? "0"), 10);
  if (!chapterId || !payeeId || !["concepteur", "inspecteur"].includes(role)) {
    return { error: "Paramètres manquants." };
  }
  const { error } = await supabase.from("collab_payments").upsert({
    chapter_id: chapterId,
    payee_id: payeeId,
    role,
    amount_xof: Number.isFinite(amount) ? amount : 0,
    paid_at: now(),
  });
  if (error) return { error: "Échec de l'enregistrement du paiement." };
  revalidatePath("/admin/paie");
  return { ok: true };
}

// L'admin annule un paiement (erreur de saisie).
export async function unmarkPaid(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };
  const chapterId = String(formData.get("chapter_id") ?? "");
  const payeeId = String(formData.get("payee_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!chapterId || !payeeId || !role) return { error: "Paramètres manquants." };
  const { error } = await supabase
    .from("collab_payments")
    .delete()
    .eq("chapter_id", chapterId)
    .eq("payee_id", payeeId)
    .eq("role", role);
  if (error) return { error: "Échec de l'annulation." };
  revalidatePath("/admin/paie");
  return { ok: true };
}

// L'admin rouvre un cycle de revision (redonne l'acces au concepteur).
export async function reopenCycle(
  _prev: CollabState,
  formData: FormData,
): Promise<CollabState> {
  const { supabase, ok } = await requireRole("admin");
  if (!ok) return { error: "Réservé à l'administration." };
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!chapterId) return { error: "Module manquant." };
  const { error } = await supabase
    .from("content_production")
    .update({
      locked_at: null,
      locked_by: null,
      stage: "a_corriger",
      at_a_corriger: now(),
      updated_at: now(),
    })
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec de la réouverture." };
  revalidatePath("/admin/production");
  return { ok: true };
}
