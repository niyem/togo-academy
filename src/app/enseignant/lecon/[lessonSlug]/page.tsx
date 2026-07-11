import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import {
  ActivityForm,
  DeleteActivityButton,
  LessonMetaForm,
  StatusForm,
} from "@/components/teacher/LessonEditor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Activity } from "@/lib/content/types";

export const metadata: Metadata = { title: "Éditeur de leçon" };

const typeLabel: Record<string, string> = {
  video: "Vidéo",
  lecture: "Cours écrit",
  exemple: "Exemple résolu",
  exercice: "Exercice",
  quiz: "Quiz",
};

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ lessonSlug: string }>;
}) {
  const { lessonSlug } = await params;
  const isNew = lessonSlug === "nouvelle";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    redirect("/tableau-de-bord");
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id,title,class_slug")
    .order("class_slug")
    .order("sort_order");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let lesson: any = null;
  let activities: (Activity & { sortOrder: number })[] = [];
  if (!isNew) {
    const { data } = await supabase
      .from("lessons")
      .select("slug,title,summary,chapter_id,is_free_preview,status,activities(*)")
      .eq("slug", lessonSlug)
      .limit(1);
    lesson = data?.[0] ?? null;
    if (!lesson) notFound();
    activities = (lesson.activities ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((a: any) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        body: a.body ?? undefined,
        hint: a.hint ?? undefined,
        solution: a.solution ?? undefined,
        videoRef: a.video_ref ?? undefined,
        durationSec: a.duration_sec ?? undefined,
        sortOrder: a.sort_order,
      }));
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <Section>
      <Container className="max-w-3xl">
        <nav className="text-sm text-[var(--color-muted)]">
          <Link href="/enseignant" className="hover:text-togo-green-700">
            Espace enseignant
          </Link>{" "}
          / <span className="text-ink">{isNew ? "Nouvelle leçon" : lesson.title}</span>
        </nav>
        <h1 className="mt-2 text-3xl font-extrabold">
          {isNew ? "Nouvelle leçon" : "Modifier la leçon"}
        </h1>

        {!isNew && (
          <div className="mt-4">
            <StatusForm
              slug={lesson.slug}
              status={lesson.status}
              isAdmin={profile.role === "admin"}
            />
          </div>
        )}

        <Card className="mt-6">
          <h2 className="mb-4 font-bold">Informations</h2>
          <LessonMetaForm
            isNew={isNew}
            lesson={lesson ?? undefined}
            chapters={chapters ?? []}
          />
        </Card>

        {!isNew && (
          <>
            <h2 className="mt-8 text-xl font-bold">Activités</h2>
            <div className="mt-3 space-y-4">
              {activities.map((a) => (
                <div key={a.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <Badge tone={a.type === "quiz" ? "yellow" : "neutral"}>
                      {typeLabel[a.type] ?? a.type}
                    </Badge>
                    {a.type !== "quiz" && (
                      <DeleteActivityButton id={a.id} lessonSlug={lesson.slug} />
                    )}
                  </div>
                  {a.type === "quiz" ? (
                    <p className="rounded-xl border border-[var(--color-line)] p-4 text-sm text-[var(--color-muted)]">
                      « {a.title} » : l&apos;édition des quiz arrive dans une
                      prochaine version de cet espace.
                    </p>
                  ) : (
                    <ActivityForm lessonSlug={lesson.slug} activity={a} />
                  )}
                </div>
              ))}
            </div>

            <h2 className="mt-8 text-xl font-bold">Ajouter une activité</h2>
            <div className="mt-3">
              <ActivityForm lessonSlug={lesson.slug} />
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
