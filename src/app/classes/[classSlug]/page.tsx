import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAssessmentsForChapter,
  getChapters,
  getClass,
  getClasses,
  getLessonsForChapter,
  getLevels,
  getSubchapters,
  getSubjectsForClass,
} from "@/lib/content";

export async function generateStaticParams() {
  return (await getClasses()).map((c) => ({ classSlug: c.slug }));
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classSlug: string }>;
}): Promise<Metadata> {
  const { classSlug } = await params;
  const c = await getClass(classSlug);
  return { title: c ? `Classe de ${c.name}` : "Classe" };
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classSlug: string }>;
}) {
  const { classSlug } = await params;
  const schoolClass = await getClass(classSlug);
  if (!schoolClass) notFound();

  // Meilleurs scores de l'eleve connecte sur les evaluations/examens
  // (progression vers le certificat de chapitre). RLS : ses lignes seulement.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bestPercent = new Map<string, number>();
  if (user) {
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("assessment_id, score, total")
      .not("assessment_id", "is", null);
    for (const a of attempts ?? []) {
      if (!a.total || !a.assessment_id) continue;
      const p = Math.round((100 * a.score) / a.total);
      if (p > (bestPercent.get(a.assessment_id) ?? -1)) {
        bestPercent.set(a.assessment_id, p);
      }
    }
  }

  // Prefetch de tout l'arbre matiere -> chapitres -> lecons pour cette classe.
  const levels = await getLevels();
  const level = levels.find((l) => l.slug === schoolClass.levelSlug);
  const subjectList = await getSubjectsForClass(classSlug);
  const subjects = await Promise.all(
    subjectList.map(async (subject) => ({
      ...subject,
      chapterList: await Promise.all(
        (await getChapters(classSlug, subject.key)).map(async (chapter) => {
          const [lessonList, subchapterList, assessmentList] =
            await Promise.all([
              getLessonsForChapter(chapter.slug),
              getSubchapters(chapter.slug),
              getAssessmentsForChapter(chapter.slug),
            ]);
          return { ...chapter, lessonList, subchapterList, assessmentList };
        }),
      ),
    })),
  );

  return (
    <Section>
      <Container>
        <Link
          href="/catalogue"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-ink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Retour au catalogue
        </Link>

        {/* En-tete clair editorial */}
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 px-8 py-10 sm:px-10">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600">
            {level?.name ?? "Classe"}
            {schoolClass.track === "technique" && " · Enseignement technique"}
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            Classe de {schoolClass.name}
          </h1>
          <p className="mt-3 max-w-lg text-[var(--color-muted)]">
            {subjects.length > 0
              ? `${subjects.length} matière${subjects.length > 1 ? "s" : ""} disponible${subjects.length > 1 ? "s" : ""} · leçons, quiz, évaluations et examens alignés sur le programme officiel.`
              : "Le contenu de cette classe est en cours de préparation par nos enseignants."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/tarifs" variant="primary">
              S&apos;abonner pour tout débloquer
            </Button>
            <Button href="/catalogue" variant="secondary">
              Voir d&apos;autres classes
            </Button>
          </div>
        </div>

        {subjects.length === 0 ? (
          <Card className="mt-8 bg-togo-yellow-100/60">
            <p className="font-semibold">Bientôt disponible</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Les leçons de cette classe sont en cours de préparation par nos
              enseignants. Découvrez la classe de 3ème (Mathématiques) pour un
              aperçu complet.
            </p>
          </Card>
        ) : (
          <div className="mt-8 space-y-8">
            {subjects.map((subject) => {
              const chapters = subject.chapterList;
              return (
                <div key={subject.key}>
                  <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight text-ink">
                    <span aria-hidden className="text-xl">
                      {subject.icon}
                    </span>{" "}
                    {subject.name}
                  </h2>
                  {(() => {
                    // Certificat par COURS (matiere de la classe) : toutes les
                    // epreuves de tous les chapitres du cours.
                    const all = subject.chapterList.flatMap(
                      (c) => c.assessmentList,
                    );
                    if (all.length === 0) return null;
                    const passed = all.filter(
                      (a) => (bestPercent.get(a.id) ?? -1) >= a.passPercent,
                    ).length;
                    const complete = passed === all.length;
                    return (
                      <div
                        className={`mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                          complete
                            ? "bg-togo-green-600 font-semibold text-white"
                            : "bg-togo-yellow-100/60 text-ink"
                        }`}
                      >
                        <span>
                          {complete
                            ? `🎓 Certificat du cours ${subject.name} ${schoolClass.name} obtenu : toutes les épreuves sont validées (${passed}/${all.length}) ! Félicitations.`
                            : `🎓 Certificat du cours ${subject.name} ${schoolClass.name} : ${passed}/${all.length} épreuve${
                                passed > 1 ? "s" : ""
                              } validée${passed > 1 ? "s" : ""}. Les leçons restent libres, mais valide toutes les évaluations (70%) et tous les examens de chapitre (80%) pour l'obtenir.`}
                        </span>
                        {complete && (
                          <a
                            href={`/api/certificat/${schoolClass.slug}/${subject.key}`}
                            className="flex-none rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-togo-green-700 hover:bg-togo-green-50"
                          >
                            📄 Télécharger le certificat (PDF)
                          </a>
                        )}
                      </div>
                    );
                  })()}
                  <div className="mt-3 space-y-4">
                    {chapters.map((chapter) => {
                      const lessons = chapter.lessonList;
                      const exam = chapter.assessmentList.find(
                        (a) => a.kind === "examen",
                      );
                      // Groupes : sous-chapitres declares, puis lecons isolees.
                      const groups = chapter.subchapterList.map((sc) => ({
                        sc,
                        lessons: lessons.filter(
                          (l) => l.subchapterId === sc.id,
                        ),
                        evaluation: chapter.assessmentList.find(
                          (a) =>
                            a.kind === "evaluation" &&
                            a.subchapterId === sc.id,
                        ),
                      }));
                      const ungrouped = lessons.filter(
                        (l) =>
                          !chapter.subchapterList.some(
                            (sc) => sc.id === l.subchapterId,
                          ),
                      );

                      const lessonRow = (lesson: (typeof lessons)[number]) => (
                        <li key={lesson.slug}>
                          <Link
                            href={`/lecon/${lesson.slug}`}
                            className="flex items-center justify-between gap-3 py-3 hover:text-togo-green-700"
                          >
                            <span className="font-medium">{lesson.title}</span>
                            {lesson.isFreePreview ? (
                              <Badge tone="green">Gratuit</Badge>
                            ) : (
                              <Badge tone="red">🔒 Abonnés</Badge>
                            )}
                          </Link>
                        </li>
                      );

                      return (
                        <Card key={chapter.slug}>
                          <h3 className="font-bold text-togo-green-700">
                            {chapter.title}
                          </h3>

                          {groups.map(({ sc, lessons: scLessons, evaluation }) => (
                            <div key={sc.id} className="mt-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                                {sc.title}
                              </p>
                              <ul className="divide-y divide-[var(--color-line)]">
                                {scLessons.map(lessonRow)}
                              </ul>
                              {evaluation && (
                                <Link
                                  href={`/evaluation/${evaluation.slug}`}
                                  className="mt-1 flex items-center justify-between gap-3 rounded-lg bg-togo-yellow-100/60 px-3 py-2.5 text-sm font-semibold hover:bg-togo-yellow-100"
                                >
                                  <span>📝 {evaluation.title}</span>
                                  {(bestPercent.get(evaluation.id) ?? -1) >=
                                  evaluation.passPercent ? (
                                    <Badge tone="green">✓ Validée</Badge>
                                  ) : (
                                    <Badge tone="yellow">
                                      Évaluation · {evaluation.passPercent}%
                                    </Badge>
                                  )}
                                </Link>
                              )}
                            </div>
                          ))}

                          {ungrouped.length > 0 && (
                            <ul className="mt-3 divide-y divide-[var(--color-line)]">
                              {ungrouped.map(lessonRow)}
                            </ul>
                          )}

                          {exam && (
                            <Link
                              href={`/evaluation/${exam.slug}`}
                              className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-togo-red-500 bg-togo-red-100/40 px-3 py-3 text-sm font-bold hover:bg-togo-red-100"
                            >
                              <span>🎓 {exam.title}</span>
                              {(bestPercent.get(exam.id) ?? -1) >=
                              exam.passPercent ? (
                                <Badge tone="green">✓ Validé</Badge>
                              ) : (
                                <Badge tone="red">
                                  Examen final · {exam.passPercent}%
                                </Badge>
                              )}
                            </Link>
                          )}

                          {chapter.assessmentList.length > 0 &&
                            (() => {
                              const total = chapter.assessmentList.length;
                              const passed = chapter.assessmentList.filter(
                                (a) =>
                                  (bestPercent.get(a.id) ?? -1) >=
                                  a.passPercent,
                              ).length;
                              return (
                                <p
                                  className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                                    passed === total
                                      ? "bg-white font-semibold text-togo-green-700"
                                      : "bg-white/60 text-[var(--color-muted)]"
                                  }`}
                                >
                                  {passed === total
                                    ? `✅ Chapitre validé : ${passed}/${total} épreuves réussies.`
                                    : `Épreuves du chapitre : ${passed}/${total} validée${
                                        passed > 1 ? "s" : ""
                                      }.`}
                                </p>
                              );
                            })()}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}
