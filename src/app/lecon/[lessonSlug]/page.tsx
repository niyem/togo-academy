import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { LessonProse } from "@/components/lesson/LessonProse";
import { VideoPlayer } from "@/components/lesson/VideoPlayer";
import { ExerciseBlock } from "@/components/lesson/ExerciseBlock";
import { QuizBlock } from "@/components/lesson/QuizBlock";
import {
  getClass,
  getLesson,
  getSubject,
} from "@/lib/content";
import { lessons } from "@/lib/content/seed";
import type { Activity } from "@/lib/content/types";

export function generateStaticParams() {
  return lessons.map((l) => ({ lessonSlug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonSlug: string }>;
}): Promise<Metadata> {
  const { lessonSlug } = await params;
  const lesson = await getLesson(lessonSlug);
  return {
    title: lesson?.title ?? "Leçon",
    description: lesson?.summary,
  };
}

export const revalidate = 60;

const activityLabels: Record<Activity["type"], string> = {
  video: "Vidéo",
  lecture: "Le cours",
  exemple: "Exemple résolu",
  exercice: "Exercice",
  quiz: "Quiz",
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonSlug: string }>;
}) {
  const { lessonSlug } = await params;
  const lesson = await getLesson(lessonSlug);
  if (!lesson) notFound();

  const [subject, schoolClass] = await Promise.all([
    getSubject(lesson.subjectKey),
    getClass(lesson.classSlug),
  ]);

  // Phase 0 gating: free-preview lessons are fully open; others show a paywall.
  // Phase 1 replaces `false` with a real subscription check from the session.
  const hasAccess = lesson.isFreePreview || false;

  return (
    <Section>
      <Container className="max-w-3xl">
        <nav className="text-sm text-[var(--color-muted)]">
          <Link href="/catalogue" className="hover:text-togo-green-700">
            Catalogue
          </Link>{" "}
          /{" "}
          {schoolClass && (
            <Link
              href={`/classes/${schoolClass.slug}`}
              className="hover:text-togo-green-700"
            >
              {schoolClass.name}
            </Link>
          )}{" "}
          / <span className="text-ink">{subject?.name}</span>
        </nav>

        <div className="mt-3 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-extrabold">{lesson.title}</h1>
          {lesson.isFreePreview ? (
            <Badge tone="green">Gratuit</Badge>
          ) : (
            <Badge tone="red">🔒 Abonnés</Badge>
          )}
        </div>
        <p className="mt-2 text-[var(--color-muted)]">{lesson.summary}</p>

        {hasAccess ? (
          <div className="mt-8 space-y-8">
            {lesson.activities.map((activity) => (
              <section key={activity.id}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-togo-green-600">
                  {activityLabels[activity.type]}
                </h2>
                <ActivityView activity={activity} />
              </section>
            ))}

            {lesson.pdfPath && (
              <Card className="flex items-center justify-between gap-3 bg-togo-green-50/60">
                <div>
                  <p className="font-semibold">📄 Fiche de leçon (PDF)</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    Téléchargeable par les abonnés.
                  </p>
                </div>
                <Button href="/tarifs" variant="outline">
                  Débloquer
                </Button>
              </Card>
            )}

            <Card className="bg-togo-yellow-100/50">
              <p className="font-semibold">🤖 Besoin d&apos;aide ?</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Le tuteur IA t&apos;expliquera ce concept autrement et te
                proposera d&apos;autres exercices (bientôt disponible).
              </p>
            </Card>
          </div>
        ) : (
          <Card className="mt-8 text-center">
            <div className="text-4xl">🔒</div>
            <h2 className="mt-2 text-xl font-bold">Leçon réservée aux abonnés</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
              Abonne-toi pour accéder à toutes les vidéos, exercices, quiz et
              fiches PDF de cette classe.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button href="/tarifs">Voir les abonnements</Button>
              <Button href="/catalogue" variant="outline">
                Leçons gratuites
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </Section>
  );
}

function ActivityView({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case "video":
      return <VideoPlayer activity={activity} />;
    case "quiz":
      return <QuizBlock activity={activity} />;
    case "exercice":
      return <ExerciseBlock activity={activity} />;
    case "exemple":
      return (
        <Card>
          {activity.body && <LessonProse text={activity.body} />}
          {activity.solution && (
            <div className="mt-3 rounded-lg bg-togo-green-50 px-4 py-3 text-sm">
              <LessonProse text={activity.solution} />
            </div>
          )}
        </Card>
      );
    case "lecture":
    default:
      return activity.body ? <LessonProse text={activity.body} /> : null;
  }
}
