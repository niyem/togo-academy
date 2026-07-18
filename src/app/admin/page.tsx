import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import { PaymentQueue, type PendingItem } from "@/components/admin/PaymentQueue";
import { ContactInbox, type InboxItem } from "@/components/admin/ContactInbox";
import { GrantRetakeForm } from "@/components/admin/GrantRetakeForm";
import { TutorReview } from "@/components/tutor/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  const [
    students,
    parents,
    activeSubs,
    published,
    attempts,
    pendingSubs,
    review,
    inbox,
    tutorApps,
  ] = await Promise.all([
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
      supabase
        .from("contact_messages")
        .select("id, created_at, name, email, phone, topic, message")
        .eq("status", "nouveau")
        .order("created_at", { ascending: true })
        .limit(50),
      supabase
        .from("tutor_profiles")
        .select(
          "user_id,full_name,headline,subject_keys,class_slugs,created_at,cv_path,proof_path",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
    ]);

  // URLs signees (1 h) des pieces justificatives des candidatures en attente.
  const adminClient = createSupabaseAdminClient();
  const tutorDocs = new Map<string, { cv?: string; proof?: string }>();
  for (const t of tutorApps.data ?? []) {
    const entry: { cv?: string; proof?: string } = {};
    if (adminClient && t.cv_path) {
      const { data } = await adminClient.storage
        .from("tutor-docs")
        .createSignedUrl(t.cv_path, 3600);
      entry.cv = data?.signedUrl ?? undefined;
    }
    if (adminClient && t.proof_path) {
      const { data } = await adminClient.storage
        .from("tutor-docs")
        .createSignedUrl(t.proof_path, 3600);
      entry.proof = data?.signedUrl ?? undefined;
    }
    tutorDocs.set(t.user_id, entry);
  }

  const messages: InboxItem[] = (inbox.data ?? []).map((m) => ({
    id: m.id,
    createdAt: m.created_at,
    name: m.name,
    email: m.email,
    phone: m.phone,
    topic: m.topic,
    message: m.message,
  }));

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Administration</h1>
            <p className="mt-1 text-[var(--color-muted)]">
              Vue d&apos;ensemble de Togo Academy.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/production"
              className="rounded-lg border border-togo-green-500 px-4 py-2 text-sm font-semibold text-togo-green-700 hover:bg-togo-green-50"
            >
              🏭 Production de contenu
            </Link>
            <Link
              href="/enseignant"
              className="rounded-lg bg-togo-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-togo-green-700"
            >
              📚 Tout le contenu (leçons)
            </Link>
          </div>
        </div>

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

        {(tutorApps.data ?? []).length > 0 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">🎓 Candidatures tuteurs</h2>
              <Badge tone="yellow">{(tutorApps.data ?? []).length}</Badge>
            </div>
            <ul className="mt-3 divide-y divide-[var(--color-line)]">
              {(tutorApps.data ?? []).map((t) => (
                <li
                  key={t.user_id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <span className="font-medium">
                      {t.full_name ?? "Candidat"}
                    </span>
                    {t.headline && (
                      <span className="block text-xs text-[var(--color-muted)]">
                        {t.headline}
                      </span>
                    )}
                    <span className="block text-xs text-[var(--color-muted)]">
                      Matières : {(t.subject_keys ?? []).join(", ") || "—"} ·
                      Classes : {(t.class_slugs ?? []).join(", ") || "—"}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-3 text-xs">
                      {tutorDocs.get(t.user_id)?.cv ? (
                        <a
                          href={tutorDocs.get(t.user_id)!.cv}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-togo-green-700 hover:underline"
                        >
                          ↓ CV
                        </a>
                      ) : (
                        <span className="text-[var(--color-muted)]">CV manquant</span>
                      )}
                      {tutorDocs.get(t.user_id)?.proof ? (
                        <a
                          href={tutorDocs.get(t.user_id)!.proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-togo-green-700 hover:underline"
                        >
                          ↓ Justificatif d&apos;emploi
                        </a>
                      ) : (
                        <span className="text-[var(--color-muted)]">
                          Justificatif manquant
                        </span>
                      )}
                    </span>
                  </div>
                  <TutorReview userId={t.user_id} />
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">📬 Messages de contact</h2>
            <Badge tone={messages.length ? "yellow" : "green"}>
              {messages.length}
            </Badge>
          </div>
          <div className="mt-3">
            <ContactInbox items={messages} />
          </div>
        </Card>

        <Card className="mt-6">
          <h2 className="font-bold">🎓 Tentatives d&apos;examen (après paiement)</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Un élève a droit à 4 tentatives par examen (12 h entre deux
            essais). Après un paiement vérifié, rouvre 4 tentatives ici.
          </p>
          <div className="mt-3">
            <GrantRetakeForm />
          </div>
        </Card>

        <p className="mt-6 text-xs text-[var(--color-muted)]">
          À venir : émission des certificats de cours, gestion des utilisateurs
          et statistiques détaillées.
        </p>
      </Container>
    </Section>
  );
}
