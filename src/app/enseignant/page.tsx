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
  const { data: classRows } = await supabase
    .from("classes")
    .select("slug,name,sort_order")
    .order("sort_order");

  const className = new Map(
    (classRows ?? []).map((c) => [c.slug as string, c.name as string]),
  );
  const classOrder = new Map(
    (classRows ?? []).map((c) => [c.slug as string, c.sort_order as number]),
  );

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

  // classe -> chapitre -> lecons (ordonnees), avec compteurs de statut.
  const byClass = new Map<
    string,
    Map<string, { title: string; order: number; lessons: Row[] }>
  >();
  for (const r of rows) {
    const cls = r.ch?.class_slug ?? "(sans classe)";
    const chKey = r.ch?.title ?? "(sans chapitre)";
    const chapMap = byClass.get(cls) ?? byClass.set(cls, new Map()).get(cls)!;
    const chap =
      chapMap.get(chKey) ??
      chapMap
        .set(chKey, { title: chKey, order: r.ch?.sort_order ?? 0, lessons: [] })
        .get(chKey)!;
    chap.lessons.push(r);
  }

  const sortedClasses = [...byClass.keys()].sort(
    (a, b) => (classOrder.get(a) ?? 99) - (classOrder.get(b) ?? 99),
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

          <div className="mt-3 space-y-2">
            {sortedClasses.map((cls) => {
              const chapMap = byClass.get(cls)!;
              const chapters = [...chapMap.values()].sort(
                (a, b) => a.order - b.order,
              );
              const clsLessons = chapters.reduce(
                (n, c) => n + c.lessons.length,
                0,
              );
              const clsPublished = chapters.reduce(
                (n, c) =>
                  n + c.lessons.filter((l) => l.status === "published").length,
                0,
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
                  <div className="space-y-3 px-4 pb-4">
                    {chapters.map((chap) => (
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
                              const s =
                                statusBadge[l.status] ?? statusBadge.draft;
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
                    ))}
                  </div>
                </details>
              );
            })}
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
