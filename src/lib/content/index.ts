// Content access layer.
//
// Phase 1 : les fonctions interrogent Supabase (contenu publie, lisible par la
// politique RLS publique). Si les variables d'environnement ne sont pas
// configurees (dev local sans base), on retombe sur le seed type : les pages
// ne changent pas.

import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import { chapters, classes, lessons, levels, plans, subjects } from "./seed";
import type {
  Activity,
  Chapter,
  ContentStatus,
  EducationLevel,
  Lesson,
  SchoolClass,
  Subject,
  SubjectKey,
  SubscriptionPlan,
} from "./types";

// Client module-level : contenu public uniquement (cle anon + RLS).
const db = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const statusMap: Record<string, ContentStatus> = {
  draft: "brouillon",
  in_review: "en_revue",
  published: "publie",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapActivity(row: any): Activity {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? undefined,
    videoProvider: row.video_provider ?? undefined,
    videoRef: row.video_ref ?? undefined,
    durationSec: row.duration_sec ?? undefined,
    hint: row.hint ?? undefined,
    solution: row.solution ?? undefined,
    questions: (row.quiz_questions ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((q: any) => ({
        id: q.id,
        prompt: q.prompt,
        explanation: q.explanation ?? "",
        options: (q.quiz_options ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((o: any) => ({ id: o.id, label: o.label, correct: o.is_correct })),
      })),
  };
}

function mapLesson(row: any): Lesson {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? "",
    chapterSlug: row.chapters?.slug ?? "",
    classSlug: row.chapters?.class_slug ?? "",
    subjectKey: row.chapters?.subject_key,
    order: row.sort_order,
    isFreePreview: row.is_free_preview,
    status: statusMap[row.status] ?? "brouillon",
    pdfPath: row.pdf_path ?? undefined,
    activities: (row.activities ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map(mapActivity),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getLevels(): Promise<EducationLevel[]> {
  if (!db) return [...levels].sort((a, b) => a.order - b.order);
  const { data } = await db
    .from("education_levels")
    .select("slug,name,description,sort_order")
    .order("sort_order");
  return (data ?? []).map((r) => ({
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    order: r.sort_order,
  }));
}

export async function getClasses(levelSlug?: string): Promise<SchoolClass[]> {
  if (!db) {
    const list = levelSlug
      ? classes.filter((c) => c.levelSlug === levelSlug)
      : classes;
    return [...list].sort((a, b) => a.order - b.order);
  }
  let q = db.from("classes").select("slug,name,level_slug,sort_order");
  if (levelSlug) q = q.eq("level_slug", levelSlug);
  const { data } = await q.order("sort_order");
  return (data ?? []).map((r) => ({
    slug: r.slug,
    name: r.name,
    levelSlug: r.level_slug,
    order: r.sort_order,
  }));
}

export async function getClass(slug: string): Promise<SchoolClass | undefined> {
  return (await getClasses()).find((c) => c.slug === slug);
}

export async function getSubjects(): Promise<Subject[]> {
  if (!db) return subjects;
  const { data } = await db.from("subjects").select("key,name,icon,description");
  return (data ?? []).map((r) => ({
    key: r.key,
    name: r.name,
    icon: r.icon ?? "",
    description: r.description ?? "",
  }));
}

export async function getSubject(key: string): Promise<Subject | undefined> {
  return (await getSubjects()).find((s) => s.key === key);
}

export async function getSubjectsForClass(classSlug: string): Promise<Subject[]> {
  if (!db) {
    const keys = new Set(
      chapters.filter((ch) => ch.classSlug === classSlug).map((ch) => ch.subjectKey),
    );
    return subjects.filter((s) => keys.has(s.key));
  }
  const { data } = await db
    .from("chapters")
    .select("subject_key")
    .eq("class_slug", classSlug);
  const keys = new Set((data ?? []).map((r) => r.subject_key));
  return (await getSubjects()).filter((s) => keys.has(s.key));
}

export async function getChapters(
  classSlug: string,
  subjectKey: SubjectKey,
): Promise<Chapter[]> {
  if (!db) {
    return chapters
      .filter((ch) => ch.classSlug === classSlug && ch.subjectKey === subjectKey)
      .sort((a, b) => a.order - b.order);
  }
  const { data } = await db
    .from("chapters")
    .select("slug,title,class_slug,subject_key,sort_order")
    .eq("class_slug", classSlug)
    .eq("subject_key", subjectKey)
    .order("sort_order");
  return (data ?? []).map((r) => ({
    slug: r.slug,
    title: r.title,
    classSlug: r.class_slug,
    subjectKey: r.subject_key,
    order: r.sort_order,
  }));
}

const LESSON_SELECT =
  "slug,title,summary,sort_order,is_free_preview,status,pdf_path," +
  "chapters!inner(slug,class_slug,subject_key)," +
  "activities(*,quiz_questions(*,quiz_options(*)))";

export async function getLessonsForChapter(chapterSlug: string): Promise<Lesson[]> {
  if (!db) {
    return lessons
      .filter((l) => l.chapterSlug === chapterSlug)
      .sort((a, b) => a.order - b.order);
  }
  const { data } = await db
    .from("lessons")
    .select(LESSON_SELECT)
    .eq("chapters.slug", chapterSlug)
    .eq("status", "published")
    .order("sort_order");
  return (data ?? []).map(mapLesson);
}

export async function getLesson(slug: string): Promise<Lesson | undefined> {
  if (!db) return lessons.find((l) => l.slug === slug);
  const { data } = await db
    .from("lessons")
    .select(LESSON_SELECT)
    .eq("slug", slug)
    .limit(1);
  return data && data[0] ? mapLesson(data[0]) : undefined;
}

// Les plans restent sur le seed en Phase 1 (les textes marketing "highlights"
// ne sont pas en base) ; ils passeront en base avec l'admin (Phase 5).
export async function getPlans(): Promise<SubscriptionPlan[]> {
  return plans;
}

export async function getStats() {
  if (!db) {
    return {
      classes: classes.length,
      subjects: subjects.length,
      lessons: lessons.length,
      freeLessons: lessons.filter((l) => l.isFreePreview).length,
    };
  }
  const [c, s, l, f] = await Promise.all([
    db.from("classes").select("*", { count: "exact", head: true }),
    db.from("subjects").select("*", { count: "exact", head: true }),
    db.from("lessons").select("*", { count: "exact", head: true })
      .eq("status", "published"),
    db.from("lessons").select("*", { count: "exact", head: true })
      .eq("status", "published").eq("is_free_preview", true),
  ]);
  return {
    classes: c.count ?? 0,
    subjects: s.count ?? 0,
    lessons: l.count ?? 0,
    freeLessons: f.count ?? 0,
  };
}
