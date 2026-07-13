// Sommaire du chapitre dans la page de lecon : sous-chapitres cliquables,
// lecon courante mise en avant, progression (✓), evaluations et examen.
// Composant serveur pur (aucun JS client) : rapide sur connexions lentes.

import Link from "next/link";
import type { Assessment, Chapter, Lesson, Subchapter } from "@/lib/content/types";

export interface SidebarData {
  chapter: Chapter;
  subchapters: Subchapter[];
  lessons: Lesson[];
  assessments: Assessment[];
  currentSlug: string;
  completedSlugs: string[];
  hasAccess: boolean;
  classSlug: string;
}

export function CourseSidebar({ data }: { data: SidebarData }) {
  const {
    chapter,
    subchapters,
    lessons,
    assessments,
    currentSlug,
    completedSlugs,
    hasAccess,
    classSlug,
  } = data;
  const done = new Set(completedSlugs);
  const exam = assessments.find((a) => a.kind === "examen");

  const groups = subchapters.map((sc) => ({
    sc,
    lessons: lessons.filter((l) => l.subchapterId === sc.id),
    evaluation: assessments.find(
      (a) => a.kind === "evaluation" && a.subchapterId === sc.id,
    ),
  }));
  const ungrouped = lessons.filter(
    (l) => !subchapters.some((sc) => sc.id === l.subchapterId),
  );

  const lessonRow = (l: Lesson) => {
    const current = l.slug === currentSlug;
    const locked = !l.isFreePreview && !hasAccess;
    return (
      <li key={l.slug}>
        <Link
          href={`/lecon/${l.slug}`}
          aria-current={current ? "page" : undefined}
          className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            current
              ? "bg-togo-green-600 font-semibold text-white"
              : "text-ink hover:bg-white"
          }`}
        >
          <span aria-hidden className="mt-0.5 flex-none text-xs">
            {done.has(l.slug) ? (
              <span className={current ? "text-white" : "text-togo-green-600"}>✓</span>
            ) : locked ? (
              "🔒"
            ) : (
              <span className={current ? "text-white/70" : "text-[var(--color-muted)]"}>•</span>
            )}
          </span>
          <span className="min-w-0">{l.title}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Sommaire du chapitre"
      className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-4"
    >
      <Link
        href={`/classes/${classSlug}`}
        className="block px-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600 hover:text-togo-green-700"
      >
        {chapter.title}
      </Link>

      <div className="mt-3 flex flex-col gap-4">
        {groups.map(({ sc, lessons: scLessons, evaluation }) => (
          <div key={sc.id}>
            <div className="px-2.5 pb-1 text-xs font-semibold text-[var(--color-muted)]">
              {sc.title}
            </div>
            <ul className="flex flex-col gap-0.5">
              {scLessons.map(lessonRow)}
              {evaluation && (
                <li>
                  <Link
                    href={`/evaluation/${evaluation.slug}`}
                    className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-ink hover:bg-togo-yellow-100/70"
                  >
                    <span aria-hidden className="mt-0.5 flex-none text-xs">📝</span>
                    <span className="min-w-0">
                      Évaluation ({evaluation.passPercent}%)
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <ul className="flex flex-col gap-0.5">{ungrouped.map(lessonRow)}</ul>
        )}

        {exam && (
          <Link
            href={`/evaluation/${exam.slug}`}
            className="flex items-start gap-2 rounded-lg border border-togo-red-500/50 bg-white px-2.5 py-2 text-sm font-semibold text-ink hover:bg-togo-red-100/40"
          >
            <span aria-hidden className="mt-0.5 flex-none text-xs">🎓</span>
            <span className="min-w-0">
              Examen final ({exam.passPercent}%)
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
