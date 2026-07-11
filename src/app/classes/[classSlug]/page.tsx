import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card, Container, Section } from "@/components/ui";
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
                                  <Badge tone="yellow">Évaluation</Badge>
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
                              <Badge tone="red">Examen final</Badge>
                            </Link>
                          )}
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
