import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import { BackButton } from "@/components/ui/BackButton";
import {
  AssessmentExam,
  type PublicQuestion,
} from "@/components/assessment/AssessmentExam";
import { examAttemptStatus } from "@/lib/assessments/grade";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAssessment } from "@/lib/content";
import type { QuizQuestion } from "@/lib/content/types";

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

// Version PUBLIQUE d'une question : jamais les bonnes reponses (la correction
// se fait cote serveur, dans gradeAssessment).
function toPublic(q: QuizQuestion): PublicQuestion {
  const p = (q.payload ?? {}) as Record<string, unknown>;
  return {
    id: q.id,
    prompt: q.prompt,
    qtype: q.qtype ?? "qcm",
    points: q.points ?? 1,
    section: q.section,
    options: q.options.map((o) => ({ id: o.id, label: o.label })),
    texte: typeof p.texte === "string" ? p.texte : undefined,
    nbBlancs: Array.isArray(p.blancs) ? p.blancs.length : undefined,
    gauche: Array.isArray(p.gauche) ? (p.gauche as string[]) : undefined,
    droite: Array.isArray(p.droite) ? (p.droite as string[]) : undefined,
    contexte: typeof p.contexte === "string" ? p.contexte : undefined,
    consigne: typeof p.consigne === "string" ? p.consigne : undefined,
    competence: typeof p.competence === "string" ? p.competence : undefined,
  };
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ assessmentSlug: string }>;
}) {
  const { assessmentSlug } = await params;
  const assessment = await getAssessment(assessmentSlug);
  if (!assessment) notFound();

  // Evaluations et examens : reserves aux abonnes connectes et au staff
  // (admin/enseignant : acces complet, comme sur les lecons).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const [{ data: subscribed }, { data: profile }] = await Promise.all([
    // Acces selon le perimetre : la (classe, matiere) de l'epreuve.
    supabase.rpc("has_assessment_access", {
      uid: user.id,
      p_assessment: assessment.id,
    }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);
  const isStaff = profile?.role === "admin" || profile?.role === "teacher";
  if (subscribed !== true && !isStaff) redirect("/tarifs");

  // Politique de repassage : 4 tentatives, 12 h d'intervalle (examens).
  const initialStatus =
    assessment.kind === "examen" && !isStaff
      ? await examAttemptStatus(assessment.id, user.id)
      : null;

  const totalPoints = assessment.questions.reduce((s, q) => s + (q.points ?? 1), 0);

  return (
    <Section>
      <Container className="max-w-2xl">
        <BackButton />
        <nav className="text-sm text-[var(--color-muted)]">
          <Link href="/catalogue" className="hover:text-togo-green-700">
            Catalogue
          </Link>{" "}
          / <span className="text-ink">{assessment.title}</span>
        </nav>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-3xl font-extrabold">{assessment.title}</h1>
          <Badge tone={assessment.kind === "examen" ? "red" : "yellow"}>
            {assessment.kind === "examen" ? "Examen final" : "Quiz du module"}
          </Badge>
        </div>
        <p className="mt-2 text-[var(--color-muted)]">
          Sujet sur {String(totalPoints).replace(".", ",")} points · Seuil de
          réussite : {assessment.passPercent}%
          {assessment.kind === "examen" &&
            " · Format officiel BAC · 4 tentatives, 12 h entre deux essais"}
        </p>

        <Card className="mt-6">
          <AssessmentExam
            slug={assessment.slug}
            kind={assessment.kind}
            passPercent={assessment.passPercent}
            questions={assessment.questions.map(toPublic)}
            initialStatus={initialStatus}
          />
        </Card>
      </Container>
    </Section>
  );
}
