"use server";

// Actions du tableau de bord editorial (production de contenu). Reservees a
// l'administration ; la RLS "admin manages content_production" (is_admin())
// reste la barriere reelle, le role est verifie ici aussi.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STAGE_TIMESTAMP, type Stage } from "@/lib/production/stages";

export type ProdState = { error?: string; ok?: boolean };

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, admin: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { supabase, admin: profile?.role === "admin" };
}

const num = (v: FormDataEntryValue | null) => {
  const n = parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Commence a suivre une lecon (par son slug) dans la chaine de production.
export async function startTracking(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Slug de la leçon requis." };

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!lesson) return { error: `Aucune leçon pour le slug « ${slug} ».` };

  // Tout est de l'adaptation (enseignants assermentes ayant deja leurs cours).
  const { error } = await supabase.from("content_production").insert({
    lesson_id: lesson.id,
    mode: "adaptation",
    teacher_name: String(formData.get("teacher_name") ?? "").trim() || null,
    inspector_name: String(formData.get("inspector_name") ?? "").trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "Cette leçon est déjà suivie." };
    return { error: "Échec de l'enregistrement." };
  }
  revalidatePath("/admin/production");
  return { ok: true };
}

// Met a jour les champs d'une lecon suivie (mode, personnes, comptes, cout, notes).
export async function updateProduction(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const lessonId = String(formData.get("lesson_id") ?? "");
  if (!lessonId) return { error: "Leçon manquante." };

  const costRaw = String(formData.get("cost_xof") ?? "").trim();
  const { error } = await supabase
    .from("content_production")
    .update({
      teacher_name: String(formData.get("teacher_name") ?? "").trim() || null,
      inspector_name:
        String(formData.get("inspector_name") ?? "").trim() || null,
      n_examples: num(formData.get("n_examples")),
      n_exercises: num(formData.get("n_exercises")),
      n_figures: num(formData.get("n_figures")),
      n_quiz: num(formData.get("n_quiz")),
      cost_xof: costRaw === "" ? null : num(formData.get("cost_xof")),
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("lesson_id", lessonId);
  if (error) return { error: "Échec de la mise à jour." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// Fait passer une lecon a une etape donnee et horodate l'entree dans l'etape.
export async function setStage(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const lessonId = String(formData.get("lesson_id") ?? "");
  const stage = String(formData.get("stage") ?? "") as Stage;
  if (!lessonId || !stage) return { error: "Paramètres manquants." };

  const payload: Record<string, unknown> = {
    stage,
    updated_at: new Date().toISOString(),
  };
  const col = STAGE_TIMESTAMP[stage];
  if (col) payload[col] = new Date().toISOString();

  const { error } = await supabase
    .from("content_production")
    .update(payload)
    .eq("lesson_id", lessonId);
  if (error) return { error: "Échec du changement d'étape." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// Retire une lecon du suivi (n'affecte pas la lecon elle-meme).
export async function stopTracking(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };
  const lessonId = String(formData.get("lesson_id") ?? "");
  if (!lessonId) return { error: "Leçon manquante." };
  const { error } = await supabase
    .from("content_production")
    .delete()
    .eq("lesson_id", lessonId);
  if (error) return { error: "Échec du retrait." };
  revalidatePath("/admin/production");
  return { ok: true };
}
