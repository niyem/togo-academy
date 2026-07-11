import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <Section>
      <Container className="max-w-3xl prose-lesson">
        <h1 className="text-3xl font-extrabold">
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Document préliminaire. La version définitive sera validée avant le
          lancement commercial.
        </p>
        <h2>Données collectées</h2>
        <p>
          Nom, numéro de téléphone, email éventuel, classe, et données de
          progression (leçons suivies, scores).
        </p>
        <h2>Utilisation</h2>
        <p>
          Ces données servent à fournir le service, suivre la progression,
          informer les parents reliés et améliorer les contenus.
        </p>
        <h2>Mineurs</h2>
        <p>
          Pour les élèves mineurs, un parent ou tuteur peut créer et superviser
          le compte.
        </p>
        <h2>Partage</h2>
        <p>
          Les données ne sont pas vendues. Elles peuvent être traitées par des
          prestataires techniques (hébergement, paiement) strictement pour le
          fonctionnement du service.
        </p>
      </Container>
    </Section>
  );
}
