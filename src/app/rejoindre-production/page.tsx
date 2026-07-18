import type { Metadata } from "next";
import { Container, Eyebrow, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApplyForm } from "@/components/collab/ApplyForm";
import { ConfidentialNotice } from "@/lib/collab/notice";

export const metadata: Metadata = {
  title: "Rejoindre l'équipe de production",
  description:
    "Enseignants-concepteurs et inspecteurs : rejoignez l'équipe qui produit les cours de Togo Academy.",
};

export default async function JoinProductionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("key, name")
    .order("name");

  return (
    <Section>
      <Container className="max-w-2xl">
        <Eyebrow>Espace de production</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Concevez et validez les cours de Togo Academy
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Enseignants-concepteurs et inspecteurs collaborent ici pour produire
          des leçons fidèles au programme officiel. Créez votre compte : après
          validation par l&apos;administration, on vous attribuera vos premières
          leçons.
        </p>

        <ConfidentialNotice className="mt-5" />

        <div className="mt-6">
          <ApplyForm subjects={subjects ?? []} />
        </div>
      </Container>
    </Section>
  );
}
