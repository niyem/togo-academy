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
  const { data: lessons } = await supabase
    .from("lessons")
    .select("slug,title,status,updated_at,chapters(title,class_slug)")
    .order("updated_at", { ascending: false });

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
          <h2 className="font-bold">Leçons</h2>
          <ul className="mt-3 divide-y divide-[var(--color-line)]">
            {(lessons ?? []).map((l) => {
              const ch = l.chapters as unknown as {
                title: string;
                class_slug: string;
              } | null;
              const s = statusBadge[l.status] ?? statusBadge.draft;
              return (
                <li key={l.slug}>
                  <Link
                    href={`/enseignant/lecon/${l.slug}`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-togo-green-700"
                  >
                    <span>
                      <span className="font-medium">{l.title}</span>
                      <span className="block text-xs text-[var(--color-muted)]">
                        [{ch?.class_slug}] {ch?.title}
                      </span>
                    </span>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </Link>
                </li>
              );
            })}
            {(lessons ?? []).length === 0 && (
              <li className="py-3 text-sm text-[var(--color-muted)]">
                Aucune leçon visible. Créez votre première leçon !
              </li>
            )}
          </ul>
        </Card>

        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Workflow : Brouillon → En revue → Publication (validée par
          l&apos;administration). Les quiz et vidéos hébergées arrivent dans une
          prochaine version de cet espace.
        </p>
      </Container>
    </Section>
  );
}
