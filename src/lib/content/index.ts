// Content access layer.
//
// Phase 0 reads from the typed seed so the app runs and is demonstrable without a
// database. Every function here is a seam: when Supabase is provisioned, swap the
// bodies to query Postgres (the SQL schema mirrors these shapes) without touching
// the pages that call them.

import { chapters, classes, lessons, levels, plans, subjects } from "./seed";
import type {
  Chapter,
  EducationLevel,
  Lesson,
  SchoolClass,
  Subject,
  SubjectKey,
  SubscriptionPlan,
} from "./types";

export function getLevels(): EducationLevel[] {
  return [...levels].sort((a, b) => a.order - b.order);
}

export function getLevel(slug: string): EducationLevel | undefined {
  return levels.find((l) => l.slug === slug);
}

export function getClasses(levelSlug?: string): SchoolClass[] {
  const list = levelSlug
    ? classes.filter((c) => c.levelSlug === levelSlug)
    : classes;
  return [...list].sort((a, b) => a.order - b.order);
}

export function getClass(slug: string): SchoolClass | undefined {
  return classes.find((c) => c.slug === slug);
}

export function getSubjects(): Subject[] {
  return subjects;
}

export function getSubject(key: string): Subject | undefined {
  return subjects.find((s) => s.key === key);
}

/** Subjects that actually have chapters for a given class (drives the catalog). */
export function getSubjectsForClass(classSlug: string): Subject[] {
  const keys = new Set(
    chapters.filter((ch) => ch.classSlug === classSlug).map((ch) => ch.subjectKey),
  );
  return subjects.filter((s) => keys.has(s.key));
}

export function getChapters(classSlug: string, subjectKey: SubjectKey): Chapter[] {
  return chapters
    .filter((ch) => ch.classSlug === classSlug && ch.subjectKey === subjectKey)
    .sort((a, b) => a.order - b.order);
}

export function getLessonsForChapter(chapterSlug: string): Lesson[] {
  return lessons
    .filter((l) => l.chapterSlug === chapterSlug)
    .sort((a, b) => a.order - b.order);
}

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getPlans(): SubscriptionPlan[] {
  return plans;
}

/** Lightweight counts for the catalog / marketing pages. */
export function getStats() {
  return {
    classes: classes.length,
    subjects: subjects.length,
    lessons: lessons.length,
    freeLessons: lessons.filter((l) => l.isFreePreview).length,
  };
}
