import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { LessonProse } from "@/components/lesson/LessonProse";
import { TutorPanel } from "@/components/lesson/TutorPanel";
import { VideoPlayer } from "@/components/lesson/VideoPlayer";
import { ExerciseBlock } from "@/components/lesson/ExerciseBlock";
import { QuizBlock } from "@/components/lesson/QuizBlock";
import { CourseSidebar } from "@/components/lesson/CourseSidebar";
import {
  getAssessmentsForChapter,
  getChapters,
  getClass,
  getLesson,
  getLessonsForChapter,
  getSubchapters,
  getSubject,
} from "@/lib/content";
import { lessons } from "@/lib/content/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  // Acces : lecon gratuite, ou abonnement actif du visiteur connecte.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let subscribed = false;
  if (user) {
    const { data } = await supabase.rpc("has_active_subscription", {
      uid: user.id,
    });
    subscribed = data === true;
  }
  const hasAccess = lesson.isFreePreview || subscribed;

  // Sommaire du chapitre (barre laterale) : lecons soeurs, evaluations, examen.
  const [chapterLessons, subchapters, assessments, chapterList] =
    await Promise.all([
      getLessonsForChapter(lesson.chapterSlug),
      getSubchapters(lesson.chapterSlug),
      getAssessmentsForChapter(lesson.chapterSlug),
      getChapters(lesson.classSlug, lesson.subjectKey),
    ]);
  const chapter = chapterList.find((c) => c.slug === lesson.chapterSlug);

  // Lecons terminees par l'utilisateur (coches ✓ du sommaire).
  let completedSlugs: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("lesson_progress")
      .select("state, lessons(slug)")
      .eq("state", "completed");
    completedSlugs = (data ?? [])
      .map((r) => (r.lessons as unknown as { slug: string } | null)?.slug)
      .filter((s): s is string => !!s);
  }

  // Fiche PDF : URL signee (1 h), reservee aux abonnes (politique storage).
  let pdfUrl: string | null = null;
  if (lesson.pdfPath && subscribed) {
    const { data } = await supabase.storage
      .from("lesson-pdfs")
      .createSignedUrl(lesson.pdfPath, 3600);
    pdfUrl = data?.signedUrl ?? null;
  }

  // Videos hebergees (bucket prive lesson-videos) : URL signee 3 h, emise
  // seulement si l'acces est acquis (lecon gratuite ou abonnement actif).
  const videoUrls = new Map<string, string>();
  if (hasAccess) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      for (const a of lesson.activities) {
        if (a.type === "video" && a.videoProvider === "supabase" && a.videoRef) {
          const { data } = await admin.storage
            .from("lesson-videos")
            .createSignedUrl(a.videoRef, 3600 * 3);
          if (data?.signedUrl) videoUrls.set(a.id, data.signedUrl);
        }
      }
    }
  }

  const sidebarData = chapter
    ? {
        chapter,
        subchapters,
        lessons: chapterLessons,
        assessments,
        currentSlug: lesson.slug,
        completedSlugs,
        hasAccess,
        classSlug: lesson.classSlug,
      }
    : null;

  return (
    <Section>
      <Container className="grid items-start gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sommaire : colonne fixe sur grand ecran */}
        {sidebarData && (
          <aside className="sticky top-24 hidden lg:block">
            <CourseSidebar data={sidebarData} />
          </aside>
        )}

        <div className="min-w-0 max-w-3xl">
        {/* Sommaire repliable sur mobile */}
        {sidebarData && (
          <details className="mb-5 rounded-2xl border border-togo-green-100 bg-togo-green-50 px-4 py-3 lg:hidden">
            <summary className="cursor-pointer list-none text-sm font-semibold text-togo-green-700 [&::-webkit-details-marker]:hidden">
              📚 Sommaire du chapitre
            </summary>
            <div className="mt-3 -mx-4 -mb-3">
              <CourseSidebar data={sidebarData} />
            </div>
          </details>
        )}

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

        {hasAccess && (
          <a
            href="#tuteur"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-togo-green-500 bg-togo-green-50 px-4 py-2 text-sm font-semibold text-togo-green-700 hover:bg-togo-green-100"
          >
            🤖 Tuteur IA : pose ta question sur cette leçon ↓
          </a>
        )}

        {hasAccess ? (
          <div className="mt-8 space-y-8">
            {lesson.activities.map((activity) => (
              <section key={activity.id}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-togo-green-600">
                  {activityLabels[activity.type]}
                </h2>
                <ActivityView
                  activity={activity}
                  lessonSlug={lesson.slug}
                  videoUrl={videoUrls.get(activity.id) ?? null}
                />
              </section>
            ))}

            {lesson.pdfPath && (
              <Card className="flex items-center justify-between gap-3 bg-togo-green-50/60">
                <div>
                  <p className="font-semibold">📄 Fiche de leçon (PDF)</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {pdfUrl
                      ? "À télécharger et réviser hors ligne."
                      : "Téléchargeable par les abonnés."}
                  </p>
                </div>
                {pdfUrl ? (
                  <Button href={pdfUrl}>Télécharger</Button>
                ) : (
                  <Button href="/tarifs" variant="outline">
                    Débloquer
                  </Button>
                )}
              </Card>
            )}

            {user ? (
              <div id="tuteur" className="scroll-mt-24">
                <TutorPanel lessonSlug={lesson.slug} />
              </div>
            ) : (
              <Card className="bg-togo-yellow-100/50">
                <p className="font-semibold">🤖 Besoin d&apos;aide ?</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Connecte-toi pour discuter avec le tuteur IA : il explique
                  autrement, donne des indices et propose des exercices.
                </p>
                <div className="mt-3">
                  <Button href="/connexion" variant="outline">
                    Se connecter
                  </Button>
                </div>
              </Card>
            )}
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
        </div>
      </Container>
    </Section>
  );
}

function ActivityView({
  activity,
  lessonSlug,
  videoUrl,
}: {
  activity: Activity;
  lessonSlug: string;
  videoUrl: string | null;
}) {
  switch (activity.type) {
    case "video":
      return <VideoPlayer activity={activity} videoUrl={videoUrl} />;
    case "quiz":
      return <QuizBlock activity={activity} lessonSlug={lessonSlug} />;
    case "exercice":
      return <ExerciseBlock activity={activity} />;
    case "exemple":
      return (
        <Card>
          {activity.body && <LessonProse text={activity.body} />}
          {activity.solution && (
            <div className="mt-3 rounded-lg border border-togo-green-100 bg-white px-4 py-3 text-sm">
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
