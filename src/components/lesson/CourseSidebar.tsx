// Sommaire du chapitre dans la page de lecon : sous-chapitres cliquables,
// lecon courante mise en avant, progression (✓), evaluations et examen.
// Composant serveur pur (aucun JS client) : rapide sur connexions lentes.

import Link from "next/link";
import type { Assessment, Chapter, Lesson, Subchapter } from "@/lib/content/types";

/** Autres modules du cours (PHY 1, PHY 2...) : lien vers leur 1re leçon. */
export interface SidebarModule {
  chapter: Chapter;
  firstLessonSlug: string | null;
  isCurrent: boolean;
}

export interface SidebarData {
  chapter: Chapter;
  subchapters: Subchapter[];
  lessons: Lesson[];
  assessments: Assessment[];
  currentSlug: string;
  completedSlugs: string[];
  hasAccess: boolean;
  classSlug: string;
  /** Tous les modules du cours, dans l'ordre du programme. */
  modules: SidebarModule[];
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
    modules,
  } = data;
  const done = new Set(completedSlugs);
  const exam = assessments.find((a) => a.kind === "examen");
  // Quiz du module (format APC, 70 %) : rattache au chapitre entier.
  const moduleQuiz = assessments.find(
    (a) => a.kind === "evaluation" && !a.subchapterId,
  );

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

  // Modules avant / apres le module courant (ordre du programme).
  const before = modules.filter(
    (m) => !m.isCurrent && m.chapter.order < chapter.order,
  );
  const after = modules.filter(
    (m) => !m.isCurrent && m.chapter.order >= chapter.order,
  );

  const moduleRow = (m: SidebarModule) => (
    <div key={m.chapter.slug}>
      {m.firstLessonSlug ? (
        <Link
          href={`/lecon/${m.firstLessonSlug}`}
          className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink hover:bg-white"
        >
          <span aria-hidden className="mt-0.5 flex-none text-xs">📦</span>
          <span className="min-w-0">{m.chapter.title}</span>
        </Link>
      ) : (
        <div className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--color-muted)]">
          <span aria-hidden className="mt-0.5 flex-none text-xs">📦</span>
          <span className="min-w-0">{m.chapter.title} · bientôt</span>
        </div>
      )}
    </div>
  );

  return (
    <nav
      aria-label="Sommaire du cours"
      className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-4"
    >
      <Link
        href={`/classes/${classSlug}`}
        className="block px-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600 hover:text-togo-green-700"
      >
        Sommaire du cours
      </Link>

      {before.length > 0 && (
        <div className="mt-3 flex flex-col gap-0.5">{before.map(moduleRow)}</div>
      )}

      <div className="mt-3 rounded-xl border border-togo-green-500/40 bg-white/50 p-2">
        <div className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-togo-green-700">
          {chapter.title}
        </div>

      <div className="flex flex-col gap-4">
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

        {moduleQuiz && (
          <Link
            href={`/evaluation/${moduleQuiz.slug}`}
            className="flex items-start gap-2 rounded-lg border border-togo-yellow-400/70 bg-white px-2.5 py-2 text-sm font-semibold text-ink hover:bg-togo-yellow-100/50"
          >
            <span aria-hidden className="mt-0.5 flex-none text-xs">📝</span>
            <span className="min-w-0">
              Quiz du module ({moduleQuiz.passPercent}%)
            </span>
          </Link>
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
      </div>

      {after.length > 0 && (
        <div className="mt-3 flex flex-col gap-0.5">{after.map(moduleRow)}</div>
      )}
    </nav>
  );
}
