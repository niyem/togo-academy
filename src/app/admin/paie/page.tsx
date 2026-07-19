import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container, Section } from "@/components/ui";
import { PayBoard, type PayGroup } from "@/components/admin/PayBoard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { modulePrice, inspectorPrice } from "@/lib/production/bareme";

export const metadata: Metadata = { title: "Paie des contributeurs" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function PayPage() {
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

  const [{ data: prod }, { data: mi }, { data: people }, { data: payments }] =
    await Promise.all([
      supabase
        .from("content_production")
        .select("chapter_id, concepteur_id, cost_xof, inspector_cost_xof, chapters(title, class_slug)"),
      supabase.from("module_inspectors").select("chapter_id, inspector_id"),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["concepteur", "inspecteur"]),
      supabase.from("collab_payments").select("chapter_id, payee_id, role"),
    ]);

  const nameById = new Map<string, string>(
    ((people ?? []) as any[]).map((p) => [p.id, p.full_name ?? "Contributeur"]),
  );
  const paidSet = new Set(
    ((payments ?? []) as any[]).map((p) => `${p.chapter_id}|${p.payee_id}|${p.role}`),
  );
  const prodByChapter = new Map<string, any>();
  for (const p of (prod ?? []) as any[]) prodByChapter.set(p.chapter_id, p);

  // Regroupe par (beneficiaire, role)
  const groups = new Map<string, PayGroup>();
  const push = (payeeId: string, role: "concepteur" | "inspecteur", p: any, amount: number) => {
    const key = `${payeeId}|${role}`;
    let g = groups.get(key);
    if (!g) {
      g = { payeeId, name: nameById.get(payeeId) ?? "Contributeur", role, entries: [] };
      groups.set(key, g);
    }
    g.entries.push({
      chapterId: p.chapter_id,
      title: p.chapters?.title ?? "(module)",
      className: p.chapters?.class_slug ?? "",
      amount,
      paid: paidSet.has(`${p.chapter_id}|${payeeId}|${role}`),
    });
  };

  for (const p of (prod ?? []) as any[]) {
    const cls = p.chapters?.class_slug ?? "";
    if (p.concepteur_id) {
      push(p.concepteur_id, "concepteur", p, p.cost_xof ?? modulePrice(cls));
    }
  }
  for (const row of (mi ?? []) as any[]) {
    const p = prodByChapter.get(row.chapter_id);
    if (!p) continue;
    const cls = p.chapters?.class_slug ?? "";
    push(row.inspector_id, "inspecteur", p, p.inspector_cost_xof ?? inspectorPrice(cls));
  }

  const list = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Section>
      <Container>
        <Link href="/admin" className="text-sm text-togo-green-700 hover:underline">
          ← Administration
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Paie des contributeurs</h1>
        <p className="mt-1 max-w-2xl text-[var(--color-muted)]">
          Ce que vous devez à chaque enseignant-concepteur et inspecteur, par
          module. Marquez « payé » au fur et à mesure. Chaque contributeur voit,
          de son côté, uniquement sa propre part.
        </p>
        <div className="mt-6">
          <PayBoard groups={list} />
        </div>
      </Container>
    </Section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
