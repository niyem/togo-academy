import type { Metadata } from "next";
import { Button, Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Candidature envoyée" };

export default function MerciPage() {
  return (
    <Section>
      <Container className="max-w-xl text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
          Candidature envoyée
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Merci. Votre compte est créé et votre candidature est en attente de
          validation par l&apos;administration de Togo Academy. Dès qu&apos;elle
          sera approuvée, vous pourrez accéder à votre espace de production et
          recevoir vos premières leçons.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/connexion" variant="primary">
            Se connecter
          </Button>
          <Button href="/" variant="secondary">
            Accueil
          </Button>
        </div>
      </Container>
    </Section>
  );
}
