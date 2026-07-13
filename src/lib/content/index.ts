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
  Assessment,
  Chapter,
  ContentStatus,
  EducationLevel,
  Lesson,
  SchoolClass,
  Subchapter,
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
        atTimeSec: q.at_time_sec ?? undefined,
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
    subchapterId: row.subchapter_id ?? undefined,
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
  let q = db.from("classes").select("slug,name,level_slug,sort_order,track");
  if (levelSlug) q = q.eq("level_slug", levelSlug);
  const { data } = await q.order("sort_order");
  return (data ?? []).map((r) => ({
    slug: r.slug,
    name: r.name,
    levelSlug: r.level_slug,
    order: r.sort_order,
    track: r.track ?? "general",
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

/**
 * Carte classe -> noms des matieres ayant des chapitres.
 * Une seule requete (pour le catalogue), au lieu d'un appel par classe.
 */
export async function getSubjectsByClass(): Promise<Record<string, string[]>> {
  const subs = await getSubjects();
  const nameOf = new Map(subs.map((s) => [s.key as string, s.name]));
  const pairs: { classSlug: string; subjectKey: string }[] = [];
  if (!db) {
    chapters.forEach((ch) =>
      pairs.push({ classSlug: ch.classSlug, subjectKey: ch.subjectKey }),
    );
  } else {
    const { data } = await db.from("chapters").select("class_slug,subject_key");
    (data ?? []).forEach((r) =>
      pairs.push({ classSlug: r.class_slug, subjectKey: r.subject_key }),
    );
  }
  const map: Record<string, string[]> = {};
  for (const { classSlug, subjectKey } of pairs) {
    const name = nameOf.get(subjectKey);
    if (!name) continue;
    const list = (map[classSlug] ??= []);
    if (!list.includes(name)) list.push(name);
  }
  return map;
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
  "slug,title,summary,sort_order,is_free_preview,status,pdf_path,subchapter_id," +
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

/** Sous-chapitres d'un chapitre (structure Coursera). */
export async function getSubchapters(chapterSlug: string): Promise<Subchapter[]> {
  if (!db) return [];
  const { data } = await db
    .from("subchapters")
    .select("id,slug,title,sort_order,chapters!inner(slug)")
    .eq("chapters.slug", chapterSlug)
    .order("sort_order");
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    order: r.sort_order,
  }));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapAssessment(row: any): Assessment {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    passPercent: row.pass_percent,
    subchapterId: row.subchapter_id ?? undefined,
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
/* eslint-enable @typescript-eslint/no-explicit-any */

const ASSESSMENT_SELECT =
  "id,slug,title,kind,pass_percent,subchapter_id," +
  "quiz_questions!assessment_id(*,quiz_options(*))";

/** Evaluations (par sous-chapitre) et examen final d'un chapitre. */
export async function getAssessmentsForChapter(
  chapterSlug: string,
): Promise<Assessment[]> {
  if (!db) return [];
  const [evals, exams] = await Promise.all([
    db
      .from("assessments")
      .select(ASSESSMENT_SELECT + ",subchapters!inner(chapters!inner(slug))")
      .eq("subchapters.chapters.slug", chapterSlug)
      .order("sort_order"),
    db
      .from("assessments")
      .select(ASSESSMENT_SELECT + ",chapters!inner(slug)")
      .eq("chapters.slug", chapterSlug)
      .order("sort_order"),
  ]);
  return [...(evals.data ?? []), ...(exams.data ?? [])].map(mapAssessment);
}

export async function getAssessment(slug: string): Promise<Assessment | undefined> {
  if (!db) return undefined;
  const { data } = await db
    .from("assessments")
    .select(ASSESSMENT_SELECT)
    .eq("slug", slug)
    .limit(1);
  return data && data[0] ? mapAssessment(data[0]) : undefined;
}

// Les plans restent sur le seed en Phase 1 (les textes marketing "highlights"
// ne sont pas en base) ; ils passeront en base avec l'admin (Phase 5).
export async function getPlans(): Promise<SubscriptionPlan[]> {
  return plans;
}

/**
 * Inventaire compact du contenu publie (classes > matieres > chapitres >
 * lecons + epreuves), destine a ancrer le chatbot visiteurs sur ce qui
 * existe vraiment aujourd'hui.
 */
export async function getCatalogueDigest(): Promise<string> {
  const [allClasses, allSubjects] = await Promise.all([
    getClasses(),
    getSubjects(),
  ]);
  const className = new Map(allClasses.map((c) => [c.slug, c.name]));
  const subjectName = new Map(allSubjects.map((s) => [s.key as string, s.name]));

  type Row = {
    title: string;
    isFree: boolean;
    hasVideo: boolean;
    chapterTitle: string;
    classSlug: string;
    subjectKey: string;
  };
  const rows: Row[] = [];
  const assessmentRows: { kind: string; chapterTitle: string }[] = [];

  if (!db) {
    lessons
      .filter((l) => l.status === "publie")
      .forEach((l) => {
        const ch = chapters.find((c) => c.slug === l.chapterSlug);
        rows.push({
          title: l.title,
          isFree: l.isFreePreview,
          hasVideo: l.activities.some((a) => a.type === "video"),
          chapterTitle: ch?.title ?? l.chapterSlug,
          classSlug: l.classSlug,
          subjectKey: l.subjectKey,
        });
      });
  } else {
    const [{ data: ls }, { data: as }] = await Promise.all([
      db
        .from("lessons")
        .select(
          "title,is_free_preview,sort_order," +
            "chapters!inner(title,class_slug,subject_key),activities(type)",
        )
        .eq("status", "published")
        .order("sort_order"),
      db
        .from("assessments")
        .select("kind,chapters!inner(title)"),
    ]);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (ls ?? []).forEach((r: any) =>
      rows.push({
        title: r.title,
        isFree: r.is_free_preview,
        hasVideo: (r.activities ?? []).some((a: any) => a.type === "video"),
        chapterTitle: r.chapters.title,
        classSlug: r.chapters.class_slug,
        subjectKey: r.chapters.subject_key,
      }),
    );
    (as ?? []).forEach((r: any) =>
      assessmentRows.push({ kind: r.kind, chapterTitle: r.chapters.title }),
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  const byCourse = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${r.classSlug}|${r.subjectKey}`;
    (byCourse.get(key) ?? byCourse.set(key, []).get(key)!).push(r);
  }

  const lines: string[] = [];
  for (const [key, courseRows] of byCourse) {
    const [classSlug, subjectKey] = key.split("|");
    lines.push(
      `### ${className.get(classSlug) ?? classSlug} · ${
        subjectName.get(subjectKey) ?? subjectKey
      }`,
    );
    const byChapter = new Map<string, Row[]>();
    for (const r of courseRows) {
      (byChapter.get(r.chapterTitle) ??
        byChapter.set(r.chapterTitle, []).get(r.chapterTitle)!).push(r);
    }
    for (const [chapterTitle, chRows] of byChapter) {
      const epreuves = assessmentRows.filter(
        (a) => a.chapterTitle === chapterTitle,
      );
      const suffix =
        epreuves.length > 0
          ? ` + ${epreuves.filter((e) => e.kind === "evaluation").length} évaluation(s) et ${epreuves.filter((e) => e.kind === "examen").length} examen`
          : "";
      lines.push(`Chapitre « ${chapterTitle} »${suffix} :`);
      chRows.forEach((r, i) =>
        lines.push(
          `${i + 1}. ${r.title}${r.hasVideo ? " (vidéo + quiz intégrés)" : ""}${
            r.isFree ? " — GRATUITE" : ""
          }`,
        ),
      );
    }
  }
  const total = rows.length;
  const free = rows.filter((r) => r.isFree).length;
  lines.push(
    `\nTotal : ${byCourse.size} cours (classe + matière) ouverts, ` +
      `${total} leçon(s) publiée(s) dont ${free} gratuite(s). ` +
      `Le catalogue s'enrichit chaque semaine.`,
  );
  return lines.join("\n");
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
