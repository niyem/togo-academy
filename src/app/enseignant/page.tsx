import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Espace enseignant" };

const statusBadge: Record<string, { label: string; tone: "green" | "yellow" | "neutral" }> = {
  published: { label: "Publiée", tone: "green" },
  in_review: { label: "En revue", tone: "yellow" },
  draft: { label: "Brouillon", tone: "neutral" },
};

export default async function TeacherHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    redirect("/tableau-de-bord");
  }

  // RLS : lecons publiees + ses propres brouillons (tout pour l'admin).
  // Le catalogue de placeholders est volumineux : on groupe par classe puis
  // par chapitre (module) pour rester navigable et attacher les videos une a une.
  // PostgREST plafonne a 1000 lignes par requete : on pagine par 'slug' (unique,
  // donc pagination stable) pour tout recuperer, l'ordre d'affichage etant
  // recalcule ensuite via sort_order.
  const LESSON_SELECT =
    "slug,title,status,sort_order,chapters(title,class_slug,subject_key,sort_order)";
  type LessonRow = {
    slug: string;
    title: string;
    status: string;
    sort_order: number;
    chapters: unknown;
  };
  const lessons: LessonRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("lessons")
      .select(LESSON_SELECT)
      .order("slug")
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    lessons.push(...(data as unknown as LessonRow[]));
    if (data.length < PAGE) break;
  }
  const [{ data: classRows }, { data: subjectRows }, { data: levelRows }] =
    await Promise.all([
      supabase
        .from("classes")
        .select("slug,name,sort_order,level_slug")
        .order("sort_order"),
      supabase.from("subjects").select("key,name"),
      supabase
        .from("education_levels")
        .select("slug,name,sort_order")
        .order("sort_order"),
    ]);

  const className = new Map(
    (classRows ?? []).map((c) => [c.slug as string, c.name as string]),
  );
  const classOrder = new Map(
    (classRows ?? []).map((c) => [c.slug as string, c.sort_order as number]),
  );
  const classLevel = new Map(
    (classRows ?? []).map((c) => [c.slug as string, c.level_slug as string]),
  );
  const levelName = new Map(
    (levelRows ?? []).map((l) => [l.slug as string, l.name as string]),
  );
  const levelRank = new Map(
    (levelRows ?? []).map((l) => [l.slug as string, l.sort_order as number]),
  );
  const subjectName = new Map(
    (subjectRows ?? []).map((s) => [s.key as string, s.name as string]),
  );
  // Ordre d'affichage des matieres dans une classe.
  const SUBJECT_ORDER = [
    "mathematiques",
    "physique",
    "chimie",
    "spt",
    "svt",
    "technologie",
    "informatique",
  ];
  const subjectRank = (k: string) => {
    const i = SUBJECT_ORDER.indexOf(k);
    return i === -1 ? 99 : i;
  };

  type Row = {
    slug: string;
    title: string;
    status: string;
    sort_order: number;
    ch: { title: string; class_slug: string; subject_key: string; sort_order: number } | null;
  };
  const rows: Row[] = (lessons ?? []).map((l) => ({
    slug: l.slug,
    title: l.title,
    status: l.status,
    sort_order: l.sort_order,
    ch: l.chapters as unknown as Row["ch"],
  }));

  // classe -> matiere -> chapitre -> lecons, avec compteurs de statut.
  type Chap = { title: string; order: number; lessons: Row[] };
  const byClass = new Map<string, Map<string, Map<string, Chap>>>();
  for (const r of rows) {
    const cls = r.ch?.class_slug ?? "(sans classe)";
    const subj = r.ch?.subject_key ?? "(matiere)";
    const chKey = r.ch?.title ?? "(sans chapitre)";
    const subjMap = byClass.get(cls) ?? byClass.set(cls, new Map()).get(cls)!;
    const chapMap =
      subjMap.get(subj) ?? subjMap.set(subj, new Map()).get(subj)!;
    const chap =
      chapMap.get(chKey) ??
      chapMap
        .set(chKey, { title: chKey, order: r.ch?.sort_order ?? 0, lessons: [] })
        .get(chKey)!;
    chap.lessons.push(r);
  }

  // Regroupement par niveau (Primaire / College / Lycee) -> classes ordonnees.
  const classesByLevel = new Map<string, string[]>();
  for (const cls of byClass.keys()) {
    const lvl = classLevel.get(cls) ?? "(niveau)";
    (
      classesByLevel.get(lvl) ?? classesByLevel.set(lvl, []).get(lvl)!
    ).push(cls);
  }
  for (const list of classesByLevel.values()) {
    list.sort((a, b) => (classOrder.get(a) ?? 99) - (classOrder.get(b) ?? 99));
  }
  const sortedLevels = [...classesByLevel.keys()].sort(
    (a, b) => (levelRank.get(a) ?? 99) - (levelRank.get(b) ?? 99),
  );

  const total = rows.length;
  const published = rows.filter((r) => r.status === "published").length;
  const drafts = total - published;

  return (
    <Section>
      <Container className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Espace enseignant</h1>
            <p className="text-[var(--color-muted)]">
              {profile.full_name} ·{" "}
              {profile.role === "admin" ? "Administrateur" : "Enseignant"}
            </p>
          </div>
          <Button href="/enseignant/lecon/nouvelle">+ Nouvelle leçon</Button>
        </div>

        <Card className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-bold">Leçons</h2>
            <p className="text-xs text-[var(--color-muted)]">
              {total} leçon(s) · {published} publiée(s) · {drafts} en attente
            </p>
          </div>

          <div className="mt-3 space-y-5">
            {sortedLevels.map((lvl) => (
              <div key={lvl}>
                <p className="mb-2 border-b border-[var(--color-line)] pb-1 text-sm font-extrabold uppercase tracking-wide text-togo-green-700">
                  {levelName.get(lvl) ?? lvl}
                </p>
                <div className="space-y-2">
                  {classesByLevel.get(lvl)!.map((cls) => {
              const subjMap = byClass.get(cls)!;
              const subjects = [...subjMap.keys()].sort(
                (a, b) =>
                  subjectRank(a) - subjectRank(b) ||
                  (subjectName.get(a) ?? a).localeCompare(
                    subjectName.get(b) ?? b,
                  ),
              );
              const allChaps = subjects.flatMap((sk) => [
                ...subjMap.get(sk)!.values(),
              ]);
              const clsLessons = allChaps.reduce(
                (n, c) => n + c.lessons.length,
                0,
              );
              const clsPublished = allChaps.reduce(
                (n, c) =>
                  n + c.lessons.filter((l) => l.status === "published").length,
                0,
              );

              const renderChapter = (chap: Chap) => (
                <details key={chap.title} className="pl-1">
                  <summary className="cursor-pointer py-2 text-sm font-medium text-togo-green-700">
                    {chap.title}{" "}
                    <span className="text-xs font-normal text-[var(--color-muted)]">
                      ({chap.lessons.length})
                    </span>
                  </summary>
                  <ul className="divide-y divide-[var(--color-line)] pl-2">
                    {chap.lessons
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((l) => {
                        const s = statusBadge[l.status] ?? statusBadge.draft;
                        return (
                          <li key={l.slug}>
                            <Link
                              href={`/enseignant/lecon/${l.slug}`}
                              className="flex items-center justify-between gap-3 py-2.5 hover:text-togo-green-700"
                            >
                              <span className="text-sm">{l.title}</span>
                              <Badge tone={s.tone}>{s.label}</Badge>
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </details>
              );

              return (
                <details
                  key={cls}
                  className="rounded-lg border border-[var(--color-line)]"
                >
                  <summary className="cursor-pointer px-4 py-3 font-semibold">
                    {className.get(cls) ?? cls}{" "}
                    <span className="text-xs font-normal text-[var(--color-muted)]">
                      · {clsPublished}/{clsLessons} publiées
                    </span>
                  </summary>
                  <div className="space-y-4 px-4 pb-4">
                    {subjects.map((sk) => {
                      const chapters = [...subjMap.get(sk)!.values()].sort(
                        (a, b) => a.order - b.order,
                      );
                      return (
                        <div key={sk}>
                          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink">
                            {subjectName.get(sk) ?? sk}
                          </p>
                          <div className="space-y-1">
                            {chapters.map(renderChapter)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
                  })}
                </div>
              </div>
            ))}
            {total === 0 && (
              <p className="py-3 text-sm text-[var(--color-muted)]">
                Aucune leçon visible. Créez votre première leçon !
              </p>
            )}
          </div>
        </Card>

        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Workflow : Brouillon → En revue → Publication (validée par
          l&apos;administration). Les leçons en attente sont des placeholders :
          ouvrez-en une, collez le lien de la vidéo, puis publiez-la.
        </p>
      </Container>
    </Section>
  );
}
