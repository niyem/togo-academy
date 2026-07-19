import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { ParentApplyForm } from "@/components/parent/ParentApplyForm";

export const metadata: Metadata = {
  title: "Demander un compte parent",
  description:
    "Créez un compte parent avec l'identifiant unique de votre enfant. Le compte est activé après approbation de l'administration.",
};

const STEPS = [
  "Votre enfant vous communique son identifiant unique (TG-XXXXXX), visible sur son tableau de bord.",
  "Vous remplissez cette demande avec vos coordonnées et cet identifiant.",
  "L'administration vérifie et approuve votre demande.",
  "Vous recevez un e-mail avec un lien pour vous connecter à votre espace parent.",
];

export default function ParentRequestPage() {
  return (
    <Container className="pb-20 pt-12 sm:pt-14">
      <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8 sm:p-10">
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Demander un compte parent.
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Suivez la progression de votre enfant. Votre compte sera activé dès
            qu&apos;un administrateur aura approuvé votre demande.
          </p>

          <div className="mt-6">
            <ParentApplyForm />
          </div>

          <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
            Déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="font-semibold text-togo-green-700 hover:underline"
            >
              Connexion
            </Link>
          </p>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8 sm:p-10">
          <div className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600">
            Comment ça marche
          </div>
          <ol className="flex flex-col gap-5">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-togo-green-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-base text-ink">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Container>
  );
}
