import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import { DeleteContributor } from "@/components/admin/DeleteContributor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Contributeurs" };

const ROLE_LABEL: Record<string, string> = {
  concepteur: "Concepteur",
  inspecteur: "Inspecteur",
  tutor: "Tuteur",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ContributorsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/tableau-de-bord");

  const { data: rows } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .in("role", ["concepteur", "inspecteur", "tutor"])
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  // Adresses e-mail (via la cle service) pour identifier chaque compte.
  const admin = createSupabaseAdminClient();
  const emailById = new Map<string, string>();
  if (admin) {
    for (const r of rows ?? []) {
      const { data } = await admin.auth.admin.getUserById(r.id);
      if (data.user?.email) emailById.set(r.id, data.user.email);
    }
  }

  const contributors = (rows ?? []) as any[];

  return (
    <Section>
      <Container>
        <Link href="/admin" className="text-sm text-togo-green-700 hover:underline">
          ← Administration
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Contributeurs</h1>
        <p className="mt-1 max-w-2xl text-[var(--color-muted)]">
          Concepteurs, inspecteurs et tuteurs validés. Supprimer un compte est
          irréversible : les modules qu&apos;il tenait redeviennent non
          attribués, ses affectations et sa paie sont retirées, et son adresse
          e-mail redevient libre pour une nouvelle inscription.
        </p>

        <Card className="mt-6">
          {contributors.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Aucun contributeur validé pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {contributors.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {c.full_name ?? "Contributeur"}
                      </span>
                      <Badge tone="neutral">{ROLE_LABEL[c.role] ?? c.role}</Badge>
                    </div>
                    <span className="block text-xs text-[var(--color-muted)]">
                      {emailById.get(c.id) ?? "—"}
                    </span>
                  </div>
                  <DeleteContributor
                    userId={c.id}
                    name={c.full_name ?? "ce contributeur"}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Container>
    </Section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
