import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container, Section } from "@/components/ui";
import { PayBoard, type PayGroup } from "@/components/admin/PayBoard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { subjectPrice, inspectorSubjectPrice } from "@/lib/production/bareme";

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

  const [{ data: prod }, { data: mi }, { data: people }, { data: payments }, { data: subjects }] =
    await Promise.all([
      supabase
        .from("content_production")
        .select("chapter_id, concepteur_id, chapters(class_slug, subject_key)"),
      supabase.from("module_inspectors").select("chapter_id, inspector_id"),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["concepteur", "inspecteur"]),
      supabase.from("collab_payments").select("chapter_id, payee_id, role"),
      supabase.from("subjects").select("key, name"),
    ]);

  const nameById = new Map<string, string>(
    ((people ?? []) as any[]).map((p) => [p.id, p.full_name ?? "Contributeur"]),
  );
  const subjectName = new Map<string, string>(
    ((subjects ?? []) as any[]).map((s) => [s.key, s.name]),
  );
  const paidSet = new Set(
    ((payments ?? []) as any[]).map((p) => `${p.chapter_id}|${p.payee_id}|${p.role}`),
  );
  const prodByChapter = new Map<string, any>();
  for (const p of (prod ?? []) as any[]) prodByChapter.set(p.chapter_id, p);

  // Accumulateur par MATIERE : (beneficiaire, role, matiere, classe) -> modules.
  type Mat = {
    payeeId: string;
    role: "concepteur" | "inspecteur";
    subjectKey: string;
    classSlug: string;
    chapterIds: string[];
  };
  const mats = new Map<string, Mat>();
  const addMat = (payeeId: string, role: "concepteur" | "inspecteur", p: any) => {
    const subjectKey = p.chapters?.subject_key ?? "";
    const classSlug = p.chapters?.class_slug ?? "";
    const k = `${payeeId}|${role}|${subjectKey}|${classSlug}`;
    let m = mats.get(k);
    if (!m) {
      m = { payeeId, role, subjectKey, classSlug, chapterIds: [] };
      mats.set(k, m);
    }
    m.chapterIds.push(p.chapter_id);
  };

  for (const p of (prod ?? []) as any[]) {
    if (p.concepteur_id) addMat(p.concepteur_id, "concepteur", p);
  }
  for (const row of (mi ?? []) as any[]) {
    const p = prodByChapter.get(row.chapter_id);
    if (p) addMat(row.inspector_id, "inspecteur", p);
  }

  // Une entree = UNE matiere (tous ses modules), prix forfaitaire du bareme.
  const groups = new Map<string, PayGroup>();
  for (const m of mats.values()) {
    const amount =
      m.role === "concepteur"
        ? subjectPrice(m.classSlug)
        : inspectorSubjectPrice(m.classSlug);
    const gkey = `${m.payeeId}|${m.role}`;
    let g = groups.get(gkey);
    if (!g) {
      g = { payeeId: m.payeeId, name: nameById.get(m.payeeId) ?? "Contributeur", role: m.role, entries: [] };
      groups.set(gkey, g);
    }
    const paid =
      m.chapterIds.length > 0 &&
      m.chapterIds.every((cid) => paidSet.has(`${cid}|${m.payeeId}|${m.role}`));
    g.entries.push({
      key: `${m.subjectKey}|${m.classSlug}`,
      matiere: subjectName.get(m.subjectKey) ?? m.subjectKey,
      className: m.classSlug,
      amount,
      chapterIds: m.chapterIds,
      paid,
    });
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
          matière (montant forfaitaire couvrant tous les modules de la matière).
          L&apos;inspecteur reçoit 50 % du prix du concepteur. Marquez « payé »
          au fur et à mesure. Les contributeurs ne voient aucun montant.
        </p>
        <div className="mt-6">
          <PayBoard groups={list} />
        </div>
      </Container>
    </Section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
