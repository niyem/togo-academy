// FAQ : accordeon editorial (details/summary natif, zero JS, rapide sur
// connexions lentes), chevron rotatif, carte support en bas.

import type { Metadata } from "next";
import { Button, Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Questions fréquentes" };

const faqs = [
  {
    q: "Puis-je essayer avant de payer ?",
    a: "Oui. Certaines leçons sont gratuites, avec vidéo, exercices et quiz, pour découvrir la plateforme sans abonnement ni carte bancaire.",
  },
  {
    q: "Les cours suivent-ils le programme togolais ?",
    a: "Oui. Les leçons sont organisées par niveau et classe (du CP1 à la Terminale) et alignées sur le programme officiel, enseignement général et technique.",
  },
  {
    q: "Comment payer l'abonnement ?",
    a: "Par Flooz (Moov Money) ou virement bancaire ; depuis l'étranger, Zelle ou virement international. Vous payez, soumettez la référence, et l'équipe active l'abonnement sous 24 h environ.",
  },
  {
    q: "Comment fonctionne le tutorat en direct ?",
    a: "Bientôt disponible : vous voyez les tuteurs en ligne pour votre matière, payez à la séance (sans abonnement) et échangez en privé 1:1. Si aucun tuteur ne se libère, le montant devient un crédit.",
  },
  {
    q: "La plateforme fonctionne-t-elle avec une connexion lente ?",
    a: "Oui. Le site est léger et les vidéos s'adaptent à votre débit. Les fiches PDF permettent aussi de réviser hors ligne.",
  },
  {
    q: "Les parents peuvent-ils suivre leur enfant ?",
    a: "Oui. Un compte parent permet de relier un ou plusieurs élèves grâce à un code de liaison, et de suivre leurs progrès, leurs scores et leurs certificats.",
  },
];

export default function FaqPage() {
  return (
    <Container className="max-w-3xl pb-20 pt-14 sm:pt-20">
      <div className="mb-10">
        <Eyebrow>Questions fréquentes</Eyebrow>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          On répond à vos questions.
        </h1>
      </div>

      <div className="border-t border-[var(--color-line)]">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group border-b border-[var(--color-line)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
              <span className="text-lg font-medium text-ink">{f.q}</span>
              <span
                aria-hidden
                className="flex-none text-[var(--color-muted)] transition-transform duration-200 group-open:rotate-180"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <p className="pb-6 pr-10 leading-relaxed text-[var(--color-muted)]">
              {f.a}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-line)] bg-white p-7">
        <div>
          <h2 className="font-semibold text-ink">Une autre question ?</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Notre équipe support vous répond sous 24 h.
          </p>
        </div>
        <Button href="/contact" variant="secondary">
          Contacter le support
        </Button>
      </div>
    </Container>
  );
}
