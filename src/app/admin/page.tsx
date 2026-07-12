import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import { PaymentQueue, type PendingItem } from "@/components/admin/PaymentQueue";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
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

  const [students, parents, activeSubs, published, attempts, pendingSubs, review] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("role", "parent"),
      supabase.from("subscriptions").select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("lessons").select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
      supabase
        .from("subscriptions")
        .select(
          "id, created_at, plans(name), profiles(full_name), payments(method, reference, amount_xof, status)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("lessons")
        .select("slug,title,updated_at,chapters(title,class_slug)")
        .eq("status", "in_review")
        .order("updated_at", { ascending: true }),
    ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const queue: PendingItem[] = (pendingSubs.data ?? []).map((s: any) => {
    const pay = (s.payments ?? []).find((p: any) => p.status === "pending") ??
      s.payments?.[0] ?? { method: "?", reference: "", amount_xof: 0 };
    return {
      subscriptionId: s.id,
      planName: s.plans?.name ?? s.plan_slug,
      userName: s.profiles?.full_name ?? "Utilisateur",
      method: pay.method ?? "?",
      reference: pay.reference ?? "",
      amountXof: pay.amount_xof ?? 0,
      createdAt: s.created_at,
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const kpis: [string, number][] = [
    ["Élèves inscrits", students.count ?? 0],
    ["Parents", parents.count ?? 0],
    ["Abonnements actifs", activeSubs.count ?? 0],
    ["Leçons publiées", published.count ?? 0],
    ["Quiz réalisés", attempts.count ?? 0],
  ];

  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Administration</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Vue d&apos;ensemble de Togo Academy.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-5">
          {kpis.map(([labelText, value]) => (
            <Card key={labelText} className="text-center">
              <div className="text-2xl font-extrabold text-togo-green-600">
                {value}
              </div>
              <div className="text-xs text-[var(--color-muted)]">{labelText}</div>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">💳 Paiements à vérifier</h2>
              <Badge tone={queue.length ? "yellow" : "green"}>
                {queue.length}
              </Badge>
            </div>
            <div className="mt-3">
              <PaymentQueue items={queue} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">📝 Leçons en revue</h2>
              <Badge tone={(review.data ?? []).length ? "yellow" : "green"}>
                {(review.data ?? []).length}
              </Badge>
            </div>
            <ul className="mt-3 divide-y divide-[var(--color-line)]">
              {(review.data ?? []).map((l) => {
                const ch = l.chapters as unknown as {
                  title: string;
                  class_slug: string;
                } | null;
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
                      <span className="text-sm text-togo-green-700">
                        Relire →
                      </span>
                    </Link>
                  </li>
                );
              })}
              {(review.data ?? []).length === 0 && (
                <li className="py-3 text-sm text-[var(--color-muted)]">
                  Rien à relire. ✓
                </li>
              )}
            </ul>
          </Card>
        </div>

        <p className="mt-6 text-xs text-[var(--color-muted)]">
          À venir : émission des certificats de cours, gestion des utilisateurs
          et statistiques détaillées.
        </p>
      </Container>
    </Section>
  );
}
