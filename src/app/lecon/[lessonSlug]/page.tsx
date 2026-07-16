import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { BackButton } from "@/components/ui/BackButton";
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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DEVICE_LIMIT,
  DEVICE_WINDOW_MINUTES,
  checkDeviceLimit,
} from "@/lib/subscriptions/devices";
import type { Activity } from "@/lib/content/types";

// Rendu TOUJOURS dynamique : la page depend de la session (cookies) pour
// l'acces, les URL signees et la progression. Sans cette directive, si les
// lecons temoins du seed sont depubliees, le build classe la route statique
// et cookies() explose a l'execution (digest DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

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

  // Acces : lecon gratuite, abonnement actif, ou compte staff
  // (admin/enseignant : acces complet a tout le contenu du site).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let subscribed = false;
  let isStaff = false;
  if (user) {
    const [{ data: sub }, { data: profile }] = await Promise.all([
      // Acces selon le perimetre (matiere/classe/plateforme) de l'abonnement.
      supabase.rpc("has_lesson_access", {
        uid: user.id,
        p_class: lesson.classSlug,
        p_subject: lesson.subjectKey,
      }),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    subscribed = sub === true;
    isStaff = profile?.role === "admin" || profile?.role === "teacher";
  }
  const hasAccess = lesson.isFreePreview || subscribed || isStaff;

  // Anti-partage de compte : les abonnes sont limites a DEVICE_LIMIT appareils
  // actifs en meme temps. Le contenu gratuit et le staff ne sont pas limites.
  if (user && subscribed && !isStaff && !lesson.isFreePreview) {
    const device = await checkDeviceLimit(user.id);
    if (!device.allowed) {
      return (
        <Section>
          <Container className="py-16">
            <Card className="mx-auto max-w-lg p-8 text-center">
              <p aria-hidden className="text-4xl">🔒</p>
              <h1 className="mt-3 font-display text-2xl text-ink">
                Trop d&apos;appareils connectés en même temps
              </h1>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Ton compte est déjà utilisé sur {DEVICE_LIMIT} appareils en ce
                moment. Ferme la leçon sur un autre appareil, attends environ{" "}
                {DEVICE_WINDOW_MINUTES} minutes, puis réessaie ici.
              </p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                Chaque abonnement permet {DEVICE_LIMIT} appareils à la fois :
                c&apos;est ce qui garde Togo Academy abordable pour tout le
                monde. Merci de ta compréhension !
              </p>
              <div className="mt-6">
                <Button href="/tableau-de-bord" variant="secondary">
                  Retour au tableau de bord
                </Button>
              </div>
            </Card>
          </Container>
        </Section>
      );
    }
  }

  // Tuteur IA reserve au college et au lycee : au primaire, l'ecrit libre
  // n'est pas adapte (lecture/clavier) ; quiz et videos suffisent.
  const tutorEnabled = schoolClass?.levelSlug !== "primaire";

  // Sommaire du chapitre (barre laterale) : lecons soeurs, evaluations, examen.
  const [chapterLessons, subchapters, assessments, chapterList] =
    await Promise.all([
      getLessonsForChapter(lesson.chapterSlug),
      getSubchapters(lesson.chapterSlug),
      getAssessmentsForChapter(lesson.chapterSlug),
      getChapters(lesson.classSlug, lesson.subjectKey),
    ]);
  const chapter = chapterList.find((c) => c.slug === lesson.chapterSlug);

  // Lecons de chaque module du cours, dans l'ordre du programme : sert a la
  // navigation laterale (modules) ET aux boutons precedent / suivant.
  const chapterLessonLists = await Promise.all(
    chapterList.map((c) =>
      c.slug === lesson.chapterSlug
        ? Promise.resolve(chapterLessons)
        : getLessonsForChapter(c.slug),
    ),
  );
  const modules = chapterList.map((c, i) => ({
    chapter: c,
    firstLessonSlug:
      c.slug === lesson.chapterSlug
        ? null
        : chapterLessonLists[i][0]?.slug ?? null,
    isCurrent: c.slug === lesson.chapterSlug,
  }));

  // Precedent / suivant : sequence complete du cours, modules enchaines.
  const sequence = chapterLessonLists.flat();
  const idx = sequence.findIndex((l) => l.slug === lesson.slug);
  const prevLesson = idx > 0 ? sequence[idx - 1] : null;
  const nextLesson =
    idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : null;

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

  // Fiche PDF : URL signee (1 h), telechargement force avec un nom de fichier
  // propre. Abonnes via leur propre session (politique storage), staff via le
  // client admin (pas d'abonnement requis).
  let pdfUrl: string | null = null;
  if (lesson.pdfPath && (subscribed || isStaff)) {
    const pdfName = `${lesson.slug}-fiche.pdf`;
    if (subscribed) {
      const { data } = await supabase.storage
        .from("lesson-pdfs")
        .createSignedUrl(lesson.pdfPath, 3600, { download: pdfName });
      pdfUrl = data?.signedUrl ?? null;
    } else {
      const admin = createSupabaseAdminClient();
      const { data } = admin
        ? await admin.storage
            .from("lesson-pdfs")
            .createSignedUrl(lesson.pdfPath, 3600, { download: pdfName })
        : { data: null };
      pdfUrl = data?.signedUrl ?? null;
    }
  }

  // Videos hebergees (bucket prive lesson-videos) : URL signee 3 h, emise
  // seulement si l'acces est acquis (lecon gratuite ou abonnement actif).
  // Telechargement hors ligne : abonnes et staff uniquement (comme la fiche).
  const videoUrls = new Map<string, string>();
  const videoDownloadUrls = new Map<string, string>();
  const videoSubtitleUrls = new Map<string, string>();
  // Videos YouTube (niveaux gratuits, ex. primaire) : pas d'URL signee,
  // l'iframe utilise directement l'identifiant de la video.
  const videoYoutubeIds = new Map<string, string>();
  if (hasAccess) {
    for (const a of lesson.activities) {
      if (a.type === "video" && a.videoProvider === "youtube" && a.videoRef) {
        videoYoutubeIds.set(a.id, a.videoRef);
      }
    }
    const admin = createSupabaseAdminClient();
    if (admin) {
      for (const a of lesson.activities) {
        if (a.type === "video" && a.videoProvider === "supabase" && a.videoRef) {
          const { data } = await admin.storage
            .from("lesson-videos")
            .createSignedUrl(a.videoRef, 3600 * 3);
          if (data?.signedUrl) videoUrls.set(a.id, data.signedUrl);
          // Sous-titres optionnels : fichier .vtt a cote de la video.
          const { data: vtt } = await admin.storage
            .from("lesson-videos")
            .createSignedUrl(a.videoRef.replace(/\.mp4$/, ".vtt"), 3600 * 3);
          if (vtt?.signedUrl) videoSubtitleUrls.set(a.id, vtt.signedUrl);
          if (subscribed || isStaff) {
            const { data: dl } = await admin.storage
              .from("lesson-videos")
              .createSignedUrl(a.videoRef, 3600 * 3, {
                download: `${lesson.slug}.mp4`,
              });
            if (dl?.signedUrl) videoDownloadUrls.set(a.id, dl.signedUrl);
          }
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
        modules,
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

        <BackButton />
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

        {hasAccess && tutorEnabled && (
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
                  videoDownloadUrl={videoDownloadUrls.get(activity.id) ?? null}
                  videoSubtitlesUrl={videoSubtitleUrls.get(activity.id) ?? null}
                  videoYoutubeId={videoYoutubeIds.get(activity.id) ?? null}
                />
                {/* Navigation collee au lecteur : passer a la video
                    precedente / suivante sans faire defiler la page. */}
                {activity.type === "video" && (prevLesson || nextLesson) && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {prevLesson ? (
                      <Link
                        href={`/lecon/${prevLesson.slug}`}
                        className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 text-sm font-medium text-ink hover:border-togo-green-500 hover:text-togo-green-700"
                      >
                        <span aria-hidden>⏮</span>
                        <span className="truncate">Vidéo précédente</span>
                      </Link>
                    ) : (
                      <span />
                    )}
                    {nextLesson && (
                      <Link
                        href={`/lecon/${nextLesson.slug}`}
                        className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-togo-green-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-togo-green-500"
                      >
                        <span className="truncate">Vidéo suivante</span>
                        <span aria-hidden>⏭</span>
                      </Link>
                    )}
                  </div>
                )}
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

            {tutorEnabled &&
              (user ? (
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
              ))}
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

        {/* Navigation precedent / suivant (sequence du cours, modules enchaines) */}
        {(prevLesson || nextLesson) && (
          <div className="mt-10 flex flex-col gap-3 border-t border-[var(--color-line)] pt-6 sm:flex-row sm:items-stretch sm:justify-between">
            {prevLesson ? (
              <Link
                href={`/lecon/${prevLesson.slug}`}
                className="group flex max-w-full flex-1 items-center gap-3 rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 hover:border-togo-green-500 sm:max-w-[48%]"
              >
                <span aria-hidden className="flex-none text-togo-green-600">←</span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Leçon précédente
                  </span>
                  <span className="block truncate text-sm font-medium group-hover:text-togo-green-700">
                    {prevLesson.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block sm:max-w-[48%] sm:flex-1" />
            )}
            {nextLesson && (
              <Link
                href={`/lecon/${nextLesson.slug}`}
                className="group flex max-w-full flex-1 items-center justify-end gap-3 rounded-xl border border-togo-green-500 bg-togo-green-50 px-4 py-3 text-right hover:bg-togo-green-100 sm:max-w-[48%]"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-togo-green-600">
                    Leçon suivante
                  </span>
                  <span className="block truncate text-sm font-semibold text-togo-green-700">
                    {nextLesson.title}
                  </span>
                </span>
                <span aria-hidden className="flex-none text-togo-green-600">→</span>
              </Link>
            )}
          </div>
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
  videoDownloadUrl,
  videoSubtitlesUrl,
  videoYoutubeId,
}: {
  activity: Activity;
  lessonSlug: string;
  videoUrl: string | null;
  videoDownloadUrl: string | null;
  videoSubtitlesUrl: string | null;
  videoYoutubeId: string | null;
}) {
  switch (activity.type) {
    case "video":
      return (
        <VideoPlayer
          activity={activity}
          videoUrl={videoUrl}
          downloadUrl={videoDownloadUrl}
          subtitlesUrl={videoSubtitlesUrl}
          youtubeId={videoYoutubeId}
        />
      );
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
