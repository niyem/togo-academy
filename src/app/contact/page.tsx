// Contact & support : formulaire reel (messages stockes en base, traites
// depuis /admin) + panneau sombre d'informations. Style editorial du redesign.

import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact & support",
  description:
    "Une question sur les cours, les abonnements ou le tutorat ? Écrivez-nous, l'équipe Togo Academy répond sous 24 h.",
};

export default function ContactPage() {
  return (
    <Container className="pb-20 pt-12 sm:pt-16">
      <div className="mb-10 max-w-2xl">
        <Eyebrow>Contact & support</Eyebrow>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          Écrivez-nous.
        </h1>
        <p className="mt-4 text-[var(--color-muted)]">
          Une question sur les cours, les abonnements, un paiement ou le
          tutorat ? Notre équipe vous répond sous 24 h.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8 sm:p-10">
          <ContactForm />
        </div>

        <div className="flex flex-col gap-5">
          {/* Rejoindre l'equipe : raccourcis de candidature */}
          <div className="rounded-2xl border border-togo-green-100 bg-white p-7">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600">
              Rejoindre Togo Academy
            </div>
            <h2 className="font-semibold text-ink">
              Enseignant(e) ? Candidatez en ligne
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">
              Concevez les cours du programme togolais ou donnez des séances de
              tutorat en direct.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/rejoindre-production"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-togo-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-togo-green-700"
              >
                Concevoir des cours
              </Link>
              <Link
                href="/devenir-tuteur"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-togo-green-500 px-4 py-2.5 text-sm font-semibold text-togo-green-700 transition-colors hover:bg-togo-green-50"
              >
                Tutorat
              </Link>
            </div>
          </div>

          {/* Panneau clair : à savoir */}
          <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8 text-ink">
            <div className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600">
              Bon à savoir
            </div>
            <ul className="flex flex-col gap-4 text-sm leading-relaxed">
              <li className="flex items-start gap-3">
                <Check />
                <span>
                  Réponse sous <strong>24 h</strong>, du lundi au samedi.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check />
                <span>
                  Pour un paiement effectué, indiquez la{" "}
                  <strong>référence de paiement</strong> dans votre message :
                  l&apos;activation en sera plus rapide.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check />
                <span>
                  Enseignant(e) ? Choisissez le sujet{" "}
                  <strong>« Devenir tuteur »</strong> et précisez vos matières
                  et disponibilités.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check />
                <span>
                  Envie de <strong>concevoir des cours</strong> ou de{" "}
                  <strong>relire et valider</strong> des contenus ? Choisissez le
                  sujet correspondant, ou candidatez directement sur la page{" "}
                  <a
                    href="/rejoindre-production"
                    className="font-semibold text-togo-green-700 hover:underline"
                  >
                    Rejoindre l&apos;équipe de production
                  </a>
                  .
                </span>
              </li>
            </ul>
          </div>

          {/* Renvoi FAQ */}
          <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-7">
            <h2 className="font-semibold text-ink">
              Votre réponse est peut-être déjà là
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">
              Abonnements, paiements, certificats, comptes parents : les
              questions les plus courantes ont déjà leur réponse.
            </p>
            <Link
              href="/faq"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-togo-green-600 hover:text-togo-green-700"
            >
              Voir les questions fréquentes
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}

function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 flex-none text-togo-green-600"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
