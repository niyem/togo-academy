"use server";

// Actions de l'espace enseignant. La RLS (politiques "staff write") reste la
// vraie barriere ; on verifie aussi le role ici pour des messages clairs.
// Workflow : brouillon -> en revue (enseignant) -> publie (admin).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as string | null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { supabase, user, role: profile?.role ?? null };
}

export type TeacherState = { error?: string; ok?: boolean };

export async function saveLessonMeta(
  _prev: TeacherState,
  formData: FormData,
): Promise<TeacherState> {
  const { supabase, user, role } = await requireStaff();
  if (!user || (role !== "teacher" && role !== "admin")) {
    return { error: "Accès réservé aux enseignants." };
  }

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const chapterId = String(formData.get("chapter_id") ?? "");
  const isFree = formData.get("is_free_preview") === "on";
  const isNew = formData.get("is_new") === "1";

  if (!slug || !title || !chapterId) {
    return { error: "Slug, titre et chapitre sont obligatoires." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Le slug : lettres minuscules, chiffres et tirets." };
  }

  if (isNew) {
    const { error } = await supabase.from("lessons").insert({
      slug,
      title,
      summary,
      chapter_id: chapterId,
      is_free_preview: isFree,
      status: "draft",
      author_id: user.id,
    });
    if (error) {
      return {
        error: error.code === "23505" ? "Ce slug existe déjà." : "Erreur d'enregistrement.",
      };
    }
    redirect(`/enseignant/lecon/${slug}`);
  }

  const { error } = await supabase
    .from("lessons")
    .update({
      title,
      summary,
      chapter_id: chapterId,
      is_free_preview: isFree,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) return { error: "Erreur d'enregistrement." };
  revalidatePath(`/enseignant/lecon/${slug}`);
  return { ok: true };
}

export async function setLessonStatus(
  _prev: TeacherState,
  formData: FormData,
): Promise<TeacherState> {
  const { user, role, supabase } = await requireStaff();
  if (!user || (role !== "teacher" && role !== "admin")) {
    return { error: "Accès réservé aux enseignants." };
  }
  const slug = String(formData.get("slug") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed =
    role === "admin"
      ? ["draft", "in_review", "published"]
      : ["draft", "in_review"]; // la publication est reservee a l'admin
  if (!allowed.includes(status)) {
    return { error: "La publication est validée par l'administration." };
  }
  const { error } = await supabase
    .from("lessons")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) return { error: "Erreur de changement de statut." };
  revalidatePath(`/enseignant/lecon/${slug}`);
  revalidatePath("/enseignant");
  return { ok: true };
}

export async function saveActivity(
  _prev: TeacherState,
  formData: FormData,
): Promise<TeacherState> {
  const { user, role, supabase } = await requireStaff();
  if (!user || (role !== "teacher" && role !== "admin")) {
    return { error: "Accès réservé aux enseignants." };
  }
  const lessonSlug = String(formData.get("lesson_slug") ?? "");
  const id = String(formData.get("id") ?? "");
  const videoRef = String(formData.get("video_ref") ?? "").trim() || null;
  // Hebergeur choisi dans le formulaire. Vide + ref presente => 'placeholder'
  // (video annoncee mais pas encore disponible) ; vide + pas de ref => null.
  const providerRaw = String(formData.get("video_provider") ?? "").trim();
  const allowedProviders = ["youtube", "supabase", "bunny", "cloudflare", "placeholder"];
  const videoProvider = allowedProviders.includes(providerRaw)
    ? providerRaw
    : videoRef
      ? "placeholder"
      : null;
  const record = {
    type: String(formData.get("type") ?? "lecture"),
    title: String(formData.get("title") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    body: String(formData.get("body") ?? "").trim() || null,
    hint: String(formData.get("hint") ?? "").trim() || null,
    solution: String(formData.get("solution") ?? "").trim() || null,
    video_ref: videoRef,
    video_provider: videoProvider,
    duration_sec: Number(formData.get("duration_sec") ?? 0) || null,
  };
  if (!record.title) return { error: "Titre obligatoire." };

  if (id) {
    const { error } = await supabase.from("activities").update(record).eq("id", id);
    if (error) return { error: "Erreur d'enregistrement." };
  } else {
    const { data: lessonRows } = await supabase
      .from("lessons")
      .select("id")
      .eq("slug", lessonSlug)
      .limit(1);
    if (!lessonRows?.[0]) return { error: "Leçon introuvable." };
    const { error } = await supabase.from("activities").insert({
      ...record,
      lesson_id: lessonRows[0].id,
    });
    if (error) return { error: "Erreur d'ajout." };
  }
  revalidatePath(`/enseignant/lecon/${lessonSlug}`);
  return { ok: true };
}

export async function deleteActivity(
  _prev: TeacherState,
  formData: FormData,
): Promise<TeacherState> {
  const { user, role, supabase } = await requireStaff();
  if (!user || (role !== "teacher" && role !== "admin")) {
    return { error: "Accès réservé aux enseignants." };
  }
  const id = String(formData.get("id") ?? "");
  const lessonSlug = String(formData.get("lesson_slug") ?? "");
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { error: "Erreur de suppression." };
  revalidatePath(`/enseignant/lecon/${lessonSlug}`);
  return { ok: true };
}
