"use server";

// Actions serveur du compte parent.
// - linkStudent : un parent DEJA approuve relie un enfant supplementaire.
// - applyAsParent : demande de compte parent via l'identifiant unique de
//   l'enfant (link_code). Le compte reste "en attente" jusqu'a l'approbation
//   de l'administration ; jamais automatique.
// - reviewParent : l'admin approuve (accorde le role parent + relie l'enfant)
//   ou refuse.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendApprovalEmail } from "@/lib/email/send";
import { siteOrigin } from "@/lib/site";

export type LinkState = { error?: string; linkedName?: string };
export type ParentApplyState = { error?: string; ok?: boolean };

const now = () => new Date().toISOString();

export async function linkStudent(
  _prev: LinkState,
  formData: FormData,
): Promise<LinkState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Entrez le code de liaison de votre enfant." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("link_student_by_code", { code });

  if (error) return { error: "Une erreur est survenue. Réessayez." };
  if (!data?.ok) {
    return {
      error:
        data?.error === "not_parent"
          ? "Seul un compte parent peut relier un élève."
          : "Code invalide. Vérifiez le code affiché sur le tableau de bord de votre enfant.",
    };
  }
  revalidatePath("/tableau-de-bord");
  return { linkedName: data.student_name as string };
}

// ---- Demande publique de compte parent ----
export async function applyAsParent(
  _prev: ParentApplyState,
  formData: FormData,
): Promise<ParentApplyState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const childCode = String(formData.get("child_code") ?? "").trim().toUpperCase();

  if (!email || !password || !fullName) {
    return { error: "Nom, e-mail et mot de passe sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (!childCode) {
    return { error: "Entrez l'identifiant unique de votre enfant (ex. TG-XXXXXX)." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Service indisponible. Réessayez plus tard." };

  // On verifie que l'identifiant correspond bien a un eleve existant.
  const { data: child } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("link_code", childCode)
    .eq("role", "student")
    .maybeSingle();
  if (!child) {
    return {
      error:
        "Identifiant enfant introuvable. Demandez à votre enfant le code affiché sur son tableau de bord.",
    };
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
  if (!userId) return { error: "Demande impossible. Réessayez." };

  const { error: aErr } = await admin.from("parent_applications").upsert({
    user_id: userId,
    full_name: fullName,
    phone: phone || null,
    child_link_code: childCode,
    child_student_id: child.id,
    child_full_name: child.full_name,
    status: "pending",
    updated_at: now(),
  });
  if (aErr) return { error: "Compte créé mais demande non enregistrée." };

  // Le parent n'est pas laisse connecte : compte inactif jusqu'a validation.
  await supabase.auth.signOut();
  redirect("/demander-compte-parent/merci");
}

// ---- Approbation d'une demande de compte parent (admin) ----
export async function reviewParent(
  _prev: ParentApplyState,
  formData: FormData,
): Promise<ParentApplyState> {
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
  if (!userId || !["approved", "rejected"].includes(decision)) {
    return { error: "Action invalide." };
  }

  const admin = createSupabaseAdminClient();
  const { data: appRow } = await supabase
    .from("parent_applications")
    .select("child_student_id")
    .eq("user_id", userId)
    .single();

  // Statut de la demande.
  await supabase
    .from("parent_applications")
    .update({ status: decision, reviewed_by: user.id, updated_at: now() })
    .eq("user_id", userId);

  if (decision === "approved") {
    // Accorde le role parent + active le compte (session admin authentifiee,
    // requise par le garde-fou de changement de role).
    const { error: rErr } = await supabase
      .from("profiles")
      .update({ role: "parent", access_state: "active" })
      .eq("id", userId);
    if (rErr) return { error: "Demande validée mais rôle non accordé." };

    // Relie l'enfant au parent (cle service : contourne les RLS).
    if (admin && appRow?.child_student_id) {
      await admin
        .from("parent_student_links")
        .upsert(
          { parent_id: userId, student_id: appRow.child_student_id },
          { onConflict: "parent_id,student_id", ignoreDuplicates: true },
        );
    }

    const email = admin ? (await admin.auth.admin.getUserById(userId)).data.user?.email : null;
    if (email) {
      const { data: prof } = await supabase
        .from("profiles").select("full_name").eq("id", userId).single();
      await sendApprovalEmail({
        to: email,
        name: prof?.full_name ?? null,
        role: "parent",
        loginUrl: `${await siteOrigin()}/connexion`,
      });
    }
  } else {
    await supabase
      .from("profiles")
      .update({ access_state: "rejected" })
      .eq("id", userId);
  }
  revalidatePath("/admin");
  return { ok: true };
}
