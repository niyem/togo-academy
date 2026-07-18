"use server";

// Actions du tableau de bord editorial (production par MODULE = chapitre).
// Reservees a l'administration ; la RLS "admin manages content_production"
// (is_admin()) reste la barriere reelle, le role est verifie ici aussi.

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

// Commence a suivre un MODULE (par le slug du chapitre).
export async function startTracking(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Slug du module (chapitre) requis." };

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!chapter) return { error: `Aucun module pour le slug « ${slug} ».` };

  const { error } = await supabase.from("content_production").insert({
    chapter_id: chapter.id,
    mode: "adaptation",
    inspector_name: String(formData.get("inspector_name") ?? "").trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "Ce module est déjà suivi." };
    return { error: "Échec de l'enregistrement." };
  }
  revalidatePath("/admin/production");
  return { ok: true };
}

// Met a jour les champs d'un module suivi (inspecteur, cout, notes).
export async function updateProduction(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!chapterId) return { error: "Module manquant." };

  const costRaw = String(formData.get("cost_xof") ?? "").trim();
  const { error } = await supabase
    .from("content_production")
    .update({
      inspector_name: String(formData.get("inspector_name") ?? "").trim() || null,
      cost_xof: costRaw === "" ? null : num(formData.get("cost_xof")),
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec de la mise à jour." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// Fait passer un module a une etape donnee et horodate l'entree dans l'etape.
export async function setStage(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const chapterId = String(formData.get("chapter_id") ?? "");
  const stage = String(formData.get("stage") ?? "") as Stage;
  if (!chapterId || !stage) return { error: "Paramètres manquants." };

  const payload: Record<string, unknown> = {
    stage,
    updated_at: new Date().toISOString(),
  };
  const col = STAGE_TIMESTAMP[stage];
  if (col) payload[col] = new Date().toISOString();

  const { error } = await supabase
    .from("content_production")
    .update(payload)
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec du changement d'étape." };
  revalidatePath("/admin/production");
  return { ok: true };
}

// Retire un module du suivi (n'affecte pas le module lui-meme).
export async function stopTracking(
  _prev: ProdState,
  formData: FormData,
): Promise<ProdState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!chapterId) return { error: "Module manquant." };
  const { error } = await supabase
    .from("content_production")
    .delete()
    .eq("chapter_id", chapterId);
  if (error) return { error: "Échec du retrait." };
  revalidatePath("/admin/production");
  return { ok: true };
}
