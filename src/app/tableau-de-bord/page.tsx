import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Tableau de bord" };

// Tableau de bord derriere authentification. Les metriques passeront sur
// lesson_progress / quiz_attempts a l'etape suivante de la Phase 1.
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, class_slug")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "toi";

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Bonjour {firstName} 👋</h1>
            <p className="text-[var(--color-muted)]">
              {profile?.role === "parent"
                ? "Compte parent"
                : profile?.class_slug
                  ? `Classe de ${profile.class_slug}`
                  : "Élève"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="yellow">Progression : bientôt en temps réel</Badge>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Se déconnecter
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Metric value="1" label="Cours suivis" />
          <Metric value="1" label="Leçons terminées" />
          <Metric value="75%" label="Score moyen quiz" />
          <Metric value="20 min" label="Temps d'étude" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="font-bold">Continuer l&apos;apprentissage</h2>
            <div className="mt-4 space-y-3">
              <ProgressRow
                title="Découvrir le théorème de Thalès"
                subject="Mathématiques"
                pct={100}
                href="/lecon/decouvrir-le-theoreme-de-thales"
              />
              <ProgressRow
                title="La réciproque du théorème de Thalès"
                subject="Mathématiques"
                pct={20}
                href="/lecon/reciproque-du-theoreme-de-thales"
              />
            </div>
          </Card>

          <Card>
            <h2 className="font-bold">Recommandé pour toi</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              À revoir : la proportionnalité, base du théorème de Thalès.
            </p>
            <div className="mt-4">
              <Button href="/catalogue" variant="outline" className="w-full">
                Explorer le catalogue
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <Card className="text-center">
      <div className="text-2xl font-extrabold text-togo-green-600">{value}</div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
    </Card>
  );
}

function ProgressRow({
  title,
  subject,
  pct,
  href,
}: {
  title: string;
  subject: string;
  pct: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-[var(--color-line)] p-3 hover:border-togo-green-500"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-[var(--color-muted)]">{pct}%</span>
      </div>
      <p className="text-xs text-[var(--color-muted)]">{subject}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-togo-green-50">
        <div
          className="h-full bg-togo-green-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
