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

  const [
    { data },
    { data: concepteurRows },
    { data: inspectorRows },
    { data: miRows },
    { data: chapterRows },
  ] = await Promise.all([
    supabase
      .from("content_production")
      .select("*, chapters(slug, title, class_slug, subject_key, lessons(count))")
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name").eq("role", "concepteur").order("full_name"),
    supabase.from("profiles").select("id, full_name").eq("role", "inspecteur").order("full_name"),
    supabase.from("module_inspectors").select("chapter_id, inspector_id, profiles(full_name)"),
    supabase
      .from("chapters")
      .select("slug, title, class_slug, subject_key")
      .order("class_slug")
      .order("sort_order"),
  ]);

  const trackedSlugs = new Set(
    (data ?? []).map((p: any) => p.chapters?.slug).filter(Boolean),
  );
  const modules = (chapterRows ?? [])
    .filter((c: any) => !trackedSlugs.has(c.slug))
    .map((c: any) => ({
      slug: c.slug,
      title: c.title,
      classSlug: c.class_slug,
      subjectKey: c.subject_key,
    }));

  const concepteurs = (concepteurRows ?? []).map((c: any) => ({
    id: c.id,
    name: c.full_name ?? "Concepteur",
  }));
  const inspectors = (inspectorRows ?? []).map((c: any) => ({
    id: c.id,
    name: c.full_name ?? "Inspecteur",
  }));
  const nameById = new Map(concepteurs.map((c) => [c.id, c.name]));

  const inspByModule = new Map<string, { id: string; name: string }[]>();
  for (const mi of miRows ?? []) {
    const arr = inspByModule.get((mi as any).chapter_id) ?? [];
    arr.push({ id: (mi as any).inspector_id, name: (mi as any).profiles?.full_name ?? "Inspecteur" });
    inspByModule.set((mi as any).chapter_id, arr);
  }

  const rows: ProdRow[] = (data ?? []).map((p: any) => ({
    moduleId: p.chapter_id,
    title: p.chapters?.title ?? "(module supprimé)",
    slug: p.chapters?.slug ?? "",
    classSlug: p.chapters?.class_slug ?? "",
    subjectKey: p.chapters?.subject_key ?? "",
    lessonCount: p.chapters?.lessons?.[0]?.count ?? 0,
    stage: p.stage,
    inspector: p.inspector_name,
    concepteurId: p.concepteur_id ?? null,
    concepteurName: p.concepteur_id ? nameById.get(p.concepteur_id) ?? null : null,
    inspectors: inspByModule.get(p.chapter_id) ?? [],
    costXof: p.cost_xof,
    inspectorCostXof: p.inspector_cost_xof ?? null,
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
          Suit chaque module (chapitre, ex. « PHY 1 », qui contient plusieurs
          leçons) dans la chaîne concepteur → inspecteur → ingénierie → mise en
          ligne. Mesure le temps par module et estime le coût par le barème (prix
          de la classe). Idéal pour piloter d&apos;abord un module, mesurer, puis
          planifier le déploiement complet.
        </p>
        <div className="mt-6">
          <ProductionBoard
            rows={rows}
            concepteurs={concepteurs}
            inspectors={inspectors}
            modules={modules}
          />
        </div>
      </Container>
    </Section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
