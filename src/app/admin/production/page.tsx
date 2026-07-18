import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container, Section } from "@/components/ui";
import {
  ProductionBoard,
  type ProdRow,
} from "@/components/admin/ProductionBoard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Production de contenu" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ProductionPage() {
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
  if (profile?.role !== "admin") redirect("/tableau-de-bord");

  const [{ data }, { data: concepteurRows }] = await Promise.all([
    supabase
      .from("content_production")
      .select("*, lessons(slug, title, chapters(title, class_slug, subject_key))")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "concepteur")
      .order("full_name"),
  ]);

  const concepteurs = (concepteurRows ?? []).map((c: any) => ({
    id: c.id,
    name: c.full_name ?? "Concepteur",
  }));
  const nameById = new Map(concepteurs.map((c) => [c.id, c.name]));

  const rows: ProdRow[] = (data ?? []).map((p: any) => ({
    lessonId: p.lesson_id,
    title: p.lessons?.title ?? "(leçon supprimée)",
    slug: p.lessons?.slug ?? "",
    chapterTitle: p.lessons?.chapters?.title ?? "",
    classSlug: p.lessons?.chapters?.class_slug ?? "",
    subjectKey: p.lessons?.chapters?.subject_key ?? "",
    stage: p.stage,
    mode: p.mode,
    teacher: p.teacher_name,
    inspector: p.inspector_name,
    concepteurId: p.concepteur_id ?? null,
    concepteurName: p.concepteur_id ? nameById.get(p.concepteur_id) ?? null : null,
    n_examples: p.n_examples,
    n_exercises: p.n_exercises,
    n_figures: p.n_figures,
    n_quiz: p.n_quiz,
    costXof: p.cost_xof,
    createdAt: p.created_at,
    atEnLigne: p.at_en_ligne,
  }));

  return (
    <Section>
      <Container>
        <Link
          href="/admin"
          className="text-sm text-togo-green-700 hover:underline"
        >
          ← Administration
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Production de contenu</h1>
        <p className="mt-1 max-w-2xl text-[var(--color-muted)]">
          Suit chaque leçon dans la chaîne enseignant → inspecteur → ingénierie →
          mise en ligne, mesure le temps par leçon et estime le coût par le
          barème (création vs adaptation). Idéal pour piloter d&apos;abord un
          chapitre, mesurer, puis planifier le déploiement complet.
        </p>
        <div className="mt-6">
          <ProductionBoard rows={rows} concepteurs={concepteurs} />
        </div>
      </Container>
    </Section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
