import type { Metadata } from "next";
import { Button, Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Demande envoyée" };

export default function ParentMerciPage() {
  return (
    <Section>
      <Container className="max-w-xl text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
          Demande envoyée
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Merci. Votre compte parent est créé et votre demande est en attente de
          validation par l&apos;administration de Togo Academy. Dès qu&apos;elle
          sera approuvée, vous recevrez un e-mail avec un lien de connexion et
          vous pourrez suivre la progression de votre enfant.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/" variant="primary">
            Accueil
          </Button>
        </div>
      </Container>
    </Section>
  );
}
