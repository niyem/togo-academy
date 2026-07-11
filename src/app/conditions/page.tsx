import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function TermsPage() {
  return (
    <Section>
      <Container className="max-w-3xl prose-lesson">
        <h1 className="text-3xl font-extrabold">Conditions d&apos;utilisation</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Document préliminaire. La version définitive sera validée avant le
          lancement commercial.
        </p>
        <h2>1. Objet</h2>
        <p>
          Togo Academy fournit des contenus éducatifs en ligne destinés aux
          élèves du Togo, du primaire au lycée.
        </p>
        <h2>2. Comptes</h2>
        <p>
          L&apos;utilisateur est responsable de la confidentialité de ses
          identifiants. Les comptes parent peuvent être reliés à des comptes
          élève.
        </p>
        <h2>3. Abonnements et paiements</h2>
        <p>
          Les abonnements donnent accès aux contenus payants. Les paiements
          s&apos;effectuent par Flooz, TMoney ou virement bancaire.
        </p>
        <h2>4. Propriété intellectuelle</h2>
        <p>
          Les cours, vidéos et fiches restent la propriété de Togo Academy et ne
          peuvent être redistribués sans autorisation.
        </p>
      </Container>
    </Section>
  );
}
