import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAssessmentsForChapter,
  getChapters,
  getClass,
  getClasses,
  getLessonsForChapter,
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
        <nav className="text-sm text-[var(--color-muted)]">
          <Link href="/catalogue" className="hover:text-togo-green-700">
            Catalogue
          </Link>{" "}
          / <span className="text-ink">{schoolClass.name}</span>
        </nav>
        <h1 className="mt-2 text-3xl font-extrabold">
          Classe de {schoolClass.name}
        </h1>

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
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <span aria-hidden>{subject.icon}</span> {subject.name}
                  </h2>
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
                                      ? "bg-togo-green-50 font-semibold text-togo-green-700"
                                      : "bg-togo-green-50/50 text-[var(--color-muted)]"
                                  }`}
                                >
                                  {passed === total
                                    ? `🎓 Certificat du chapitre : toutes les épreuves sont validées (${passed}/${total}) ! Bravo.`
                                    : `🎓 Certificat du chapitre : ${passed}/${total} épreuve${
                                        passed > 1 ? "s" : ""
                                      } validée${passed > 1 ? "s" : ""}. Les leçons restent libres, mais valide les évaluations (70%) et l'examen final (80%) pour obtenir ton certificat.`}
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
