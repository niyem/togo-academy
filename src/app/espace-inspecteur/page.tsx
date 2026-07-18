import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConfidentialNotice } from "@/lib/collab/notice";

export const metadata: Metadata = { title: "Espace inspecteur" };

export default async function InspecteurSpace() {
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
  if (profile?.role !== "inspecteur") redirect("/tableau-de-bord");

  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Espace inspecteur</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Bonjour {profile?.full_name ?? ""}. Vous verrez ici les modules à
          relire dès que l&apos;administration vous en assignera.
        </p>

        <ConfidentialNotice className="mt-5" />

        <Card className="mt-6">
          <p className="text-sm text-[var(--color-muted)]">
            Aucun module ne vous est encore attribué pour relecture. Vous
            recevrez ici les contenus soumis par les concepteurs, avec la
            possibilité de laisser vos observations et vos demandes de
            correction.
          </p>
        </Card>
      </Container>
    </Section>
  );
}
