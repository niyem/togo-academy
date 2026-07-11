import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import { AssessmentQuiz } from "@/components/assessment/AssessmentQuiz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAssessment } from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ assessmentSlug: string }>;
}): Promise<Metadata> {
  const { assessmentSlug } = await params;
  const a = await getAssessment(assessmentSlug);
  return { title: a?.title ?? "Évaluation" };
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ assessmentSlug: string }>;
}) {
  const { assessmentSlug } = await params;
  const assessment = await getAssessment(assessmentSlug);
  if (!assessment) notFound();

  // Evaluations et examens : reserves aux abonnes connectes.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: subscribed } = await supabase.rpc("has_active_subscription", {
    uid: user.id,
  });
  if (subscribed !== true) redirect("/tarifs");

  return (
    <Section>
      <Container className="max-w-2xl">
        <nav className="text-sm text-[var(--color-muted)]">
          <Link href="/catalogue" className="hover:text-togo-green-700">
            Catalogue
          </Link>{" "}
          / <span className="text-ink">{assessment.title}</span>
        </nav>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-3xl font-extrabold">{assessment.title}</h1>
          <Badge tone={assessment.kind === "examen" ? "red" : "yellow"}>
            {assessment.kind === "examen" ? "Examen final" : "Évaluation"}
          </Badge>
        </div>
        <p className="mt-2 text-[var(--color-muted)]">
          {assessment.questions.length} questions · Seuil de réussite :{" "}
          {assessment.passPercent}%
          {assessment.kind === "examen" &&
            " · Prends ton temps, c'est l'examen du chapitre !"}
        </p>

        <Card className="mt-6">
          <AssessmentQuiz assessment={assessment} />
        </Card>
      </Container>
    </Section>
  );
}
