"use server";

// Persistance de la progression : tentative de quiz + lecon terminee +
// inscription automatique a la classe. RLS : l'eleve n'ecrit que ses lignes.

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function recordQuizAttempt(input: {
  lessonSlug: string;
  activityId: string;
  score: number;
  total: number;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // visiteur non connecte : progression non suivie

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("id, chapters!inner(class_slug)")
    .eq("slug", input.lessonSlug)
    .limit(1);
  const lesson = lessonRows?.[0];
  if (!lesson) return;

  await Promise.all([
    supabase.from("quiz_attempts").insert({
      student_id: user.id,
      activity_id: input.activityId,
      score: input.score,
      total: input.total,
    }),
    supabase.from("lesson_progress").upsert(
      {
        student_id: user.id,
        lesson_id: lesson.id,
        state: "completed",
        percent: 100,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,lesson_id" },
    ),
    supabase.from("enrollments").upsert(
      {
        student_id: user.id,
        class_slug: (lesson.chapters as unknown as { class_slug: string })
          .class_slug,
      },
      { onConflict: "student_id,class_slug", ignoreDuplicates: true },
    ),
  ]);
}
