import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card, Container, Section } from "@/components/ui";
import {
  getChapters,
  getClass,
  getClasses,
  getLessonsForChapter,
  getSubjectsForClass,
} from "@/lib/content";

export function generateStaticParams() {
  return getClasses().map((c) => ({ classSlug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classSlug: string }>;
}): Promise<Metadata> {
  const { classSlug } = await params;
  const c = getClass(classSlug);
  return { title: c ? `Classe de ${c.name}` : "Classe" };
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classSlug: string }>;
}) {
  const { classSlug } = await params;
  const schoolClass = getClass(classSlug);
  if (!schoolClass) notFound();

  const subjects = getSubjectsForClass(classSlug);

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
              const chapters = getChapters(classSlug, subject.key);
              return (
                <div key={subject.key}>
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <span aria-hidden>{subject.icon}</span> {subject.name}
                  </h2>
                  <div className="mt-3 space-y-4">
                    {chapters.map((chapter) => {
                      const lessons = getLessonsForChapter(chapter.slug);
                      return (
                        <Card key={chapter.slug}>
                          <h3 className="font-bold text-togo-green-700">
                            {chapter.title}
                          </h3>
                          <ul className="mt-3 divide-y divide-[var(--color-line)]">
                            {lessons.map((lesson) => (
                              <li key={lesson.slug}>
                                <Link
                                  href={`/lecon/${lesson.slug}`}
                                  className="flex items-center justify-between gap-3 py-3 hover:text-togo-green-700"
                                >
                                  <span className="font-medium">
                                    {lesson.title}
                                  </span>
                                  {lesson.isFreePreview ? (
                                    <Badge tone="green">Gratuit</Badge>
                                  ) : (
                                    <Badge tone="red">🔒 Abonnés</Badge>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
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
