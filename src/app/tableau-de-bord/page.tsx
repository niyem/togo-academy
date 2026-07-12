import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { LinkChildForm } from "@/components/parent/LinkChildForm";

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
    .select("full_name, role, class_slug, link_code")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "toi";

  // Dernier abonnement de l'utilisateur (RLS : les siens uniquement).
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("plan_slug, status, period_end")
    .order("created_at", { ascending: false })
    .limit(1);
  const sub = subs?.[0];

  // Progression reelle de l'eleve (RLS : ses lignes uniquement).
  type ProgressRowData = {
    state: string;
    percent: number;
    lessons: { slug: string; title: string } | null;
  };
  let progressRows: ProgressRowData[] = [];
  let attempts: { score: number; total: number }[] = [];
  if (profile?.role !== "parent") {
    const [p, a] = await Promise.all([
      supabase
        .from("lesson_progress")
        .select("state, percent, updated_at, lessons(slug, title)")
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase.from("quiz_attempts").select("score, total"),
    ]);
    progressRows = (p.data ?? []) as unknown as ProgressRowData[];
    attempts = a.data ?? [];
  }
  const completedCount = progressRows.filter(
    (r) => r.state === "completed",
  ).length;
  const totalPts = attempts.reduce((s, x) => s + x.total, 0);
  const avgScore = totalPts
    ? Math.round(
        (100 * attempts.reduce((s, x) => s + x.score, 0)) / totalPts,
      )
    : null;

  // Enfants relies (comptes parent) + leur progression (RLS parent).
  let children: {
    id: string;
    full_name: string | null;
    class_slug: string | null;
    completed: number;
    avgScore: number | null;
  }[] = [];
  if (profile?.role === "parent") {
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_id");
    const ids = (links ?? []).map((l) => l.student_id);
    if (ids.length) {
      const { data: kids } = await supabase
        .from("profiles")
        .select("id, full_name, class_slug")
        .in("id", ids);
      children = await Promise.all(
        (kids ?? []).map(async (kid) => {
          const [p, a] = await Promise.all([
            supabase
              .from("lesson_progress")
              .select("state")
              .eq("student_id", kid.id)
              .eq("state", "completed"),
            supabase
              .from("quiz_attempts")
              .select("score, total")
              .eq("student_id", kid.id),
          ]);
          const pts = (a.data ?? []).reduce((s, x) => s + x.total, 0);
          return {
            ...kid,
            completed: p.data?.length ?? 0,
            avgScore: pts
              ? Math.round(
                  (100 * (a.data ?? []).reduce((s, x) => s + x.score, 0)) /
                    pts,
                )
              : null,
          };
        }),
      );
    }
  }

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

        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">💳 Mon abonnement</p>
            <p className="text-sm text-[var(--color-muted)]">
              {!sub && "Aucun abonnement actif."}
              {sub?.status === "pending" &&
                "Paiement en cours de vérification par notre équipe."}
              {sub?.status === "active" &&
                `Actif${sub.period_end ? ` jusqu'au ${sub.period_end}` : ""}.`}
              {(sub?.status === "expired" || sub?.status === "cancelled") &&
                "Abonnement expiré."}
            </p>
          </div>
          {sub?.status === "active" ? (
            <Badge tone="green">Actif ✓</Badge>
          ) : sub?.status === "pending" ? (
            <Badge tone="yellow">En vérification</Badge>
          ) : (
            <Button href="/tarifs" variant="outline">
              Voir les formules
            </Button>
          )}
        </Card>

        {profile?.role !== "parent" && (
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 border-togo-green-500 bg-togo-green-50/40">
            <div>
              <p className="font-semibold">🤖 Ton tuteur IA t&apos;attend</p>
              <p className="text-sm text-[var(--color-muted)]">
                Dans chaque leçon, pose tes questions : il explique autrement,
                donne des indices et propose des exercices en plus.
              </p>
            </div>
            <Button href="/lecon/decouvrir-le-theoreme-de-thales#tuteur">
              Essayer le tuteur
            </Button>
          </Card>
        )}

        {profile?.role === "student" && profile.link_code && (
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-togo-green-50/60">
            <div>
              <p className="font-semibold">👨‍👩‍👧 Code de liaison parent</p>
              <p className="text-sm text-[var(--color-muted)]">
                Donne ce code à ton parent pour qu&apos;il suive ta progression.
              </p>
            </div>
            <span className="rounded-lg border border-togo-green-500 bg-white px-4 py-2 font-mono text-lg font-bold text-togo-green-700">
              {profile.link_code}
            </span>
          </Card>
        )}

        {profile?.role === "parent" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="font-bold">Mes enfants</h2>
              {children.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  Aucun enfant relié pour l&apos;instant. Demandez à votre
                  enfant le code affiché sur son tableau de bord, puis
                  ajoutez-le ci-contre.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {children.map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--color-line)] p-3"
                    >
                      <div>
                        <p className="font-semibold">{child.full_name}</p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {child.class_slug
                            ? `Classe de ${child.class_slug}`
                            : "Classe non renseignée"}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-togo-green-700">
                          {child.completed} leçon
                          {child.completed > 1 ? "s" : ""} terminée
                          {child.completed > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          Score moyen :{" "}
                          {child.avgScore === null
                            ? "pas encore de quiz"
                            : `${child.avgScore}%`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-[var(--color-muted)]">
                Les rapports de progression détaillés arrivent avec le suivi en
                temps réel.
              </p>
            </Card>
            <Card>
              <h2 className="font-bold">Ajouter un enfant</h2>
              <div className="mt-4">
                <LinkChildForm />
              </div>
            </Card>
          </div>
        )}

        {profile?.role !== "parent" && (
          <>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Metric value={`${completedCount}`} label="Leçons terminées" />
          <Metric
            value={`${progressRows.length - completedCount}`}
            label="Leçons en cours"
          />
          <Metric
            value={avgScore === null ? "—" : `${avgScore}%`}
            label="Score moyen quiz"
          />
          <Metric value={`${attempts.length}`} label="Quiz réalisés" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="font-bold">Continuer l&apos;apprentissage</h2>
            <div className="mt-4 space-y-3">
              {progressRows.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">
                  Commence une leçon : ta progression s&apos;affichera ici.
                </p>
              )}
              {progressRows.map(
                (r) =>
                  r.lessons && (
                    <ProgressRow
                      key={r.lessons.slug}
                      title={r.lessons.title}
                      subject={
                        r.state === "completed" ? "Terminée ✓" : "En cours"
                      }
                      pct={r.percent}
                      href={`/lecon/${r.lessons.slug}`}
                    />
                  ),
              )}
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
          </>
        )}
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
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full bg-togo-green-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
