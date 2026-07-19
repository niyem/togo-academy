import type { Metadata } from "next";
import { Button, Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Candidature reçue" };

export default function TutorThanksPage() {
  return (
    <Section>
      <Container className="max-w-lg text-center">
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 px-6 py-12 sm:px-10">
          <div className="text-4xl">🎓</div>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">
            Candidature reçue
          </h1>
          <p className="mt-3 text-[var(--color-muted)]">
            Merci ! Votre compte est créé et votre candidature de tuteur est en
            cours d&apos;examen. Dès qu&apos;elle sera validée par l&apos;équipe,
            vous recevrez un e-mail avec un lien de connexion. Vous vous
            connecterez alors avec l&apos;adresse e-mail et le mot de passe que
            vous avez choisis, pour accéder à votre espace tuteur.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button href="/">Accueil</Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
