// Tarifs : cartes de plans avec formule vedette sur panneau sombre
// ("Le plus choisi"), donnees reelles, couleurs Togo inchangees.

import type { Metadata } from "next";
import { Button, Card, Container, Eyebrow } from "@/components/ui";
import { getPlans } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tarifs & abonnements",
  description:
    "Des abonnements souples et abordables, payables par Flooz ou virement bancaire.",
};

function formatXof(n: number) {
  return n === 0 ? "0" : n.toLocaleString("fr-FR");
}

const CADENCE_UNIT: Record<string, string> = {
  hebdomadaire: "semaine",
  mensuel: "mois",
  trimestriel: "trimestre",
  annuel: "an",
};

const SCOPE_TAGLINE: Record<string, string> = {
  plateforme: "Accès à toute la plateforme.",
  classe: "Toutes les matières d'une classe.",
  matiere: "Une matière, à fond.",
};

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <Container className="pb-20 pt-14 sm:pt-16">
      <div className="mx-auto mb-11 max-w-2xl text-center">
        <Eyebrow>Tarifs</Eyebrow>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          Des tarifs simples et accessibles.
        </h1>
        <p className="mt-4 text-[var(--color-muted)]">
          Commencez gratuitement. Passez à un abonnement quand vous êtes prêt.
          Sans engagement.
        </p>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-3 xl:grid-cols-5">
        {plans.map((plan) => {
          const featured = plan.recommended;
          return (
            <div
              key={plan.slug}
              className={`flex flex-col rounded-2xl bg-togo-green-50 p-6 ${
                featured
                  ? "border-2 border-togo-green-600 shadow-md"
                  : "border border-togo-green-100"
              }`}
            >
              {featured && (
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600">
                  Le plus choisi
                </div>
              )}
              <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {plan.priceXof === 0
                  ? "Pour découvrir la plateforme."
                  : SCOPE_TAGLINE[plan.scope]}
              </p>
              <div className="mb-6 mt-5 flex items-baseline gap-2">
                <span className="font-display text-4xl tracking-tight text-ink">
                  {formatXof(plan.priceXof)}
                </span>
                <span className="text-sm text-[var(--color-muted)]">
                  FCFA{plan.priceXof > 0 && ` / ${CADENCE_UNIT[plan.cadence]}`}
                </span>
              </div>
              <ul className="mb-7 space-y-2.5 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5">
                    <svg
                      width="17"
                      height="17"
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
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button
                  href={
                    plan.priceXof === 0
                      ? "/inscription"
                      : `/abonnement/${plan.slug}`
                  }
                  variant={featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  {plan.priceXof === 0 ? "Créer un compte" : "S'abonner"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border-2 border-togo-yellow-400 bg-togo-yellow-400/10 p-6 text-center">
        <p className="font-semibold text-ink">
          🎁 Le primaire (CP1 → CM1) sera entièrement gratuit.
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Pour tous, sans abonnement : les leçons du primaire arrivent sur la
          plateforme et sur notre chaîne YouTube. L&apos;éducation de base est
          notre mission sociale.
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
        Prix en francs CFA (FCFA). Paiement par Flooz (Moov Money) ou virement
        bancaire, avec vérification par l&apos;équipe sous 24 h.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ["📱", "Flooz", "Paiement mobile Moov Money, vérifié sous 24 h."],
          ["🏦", "Virement bancaire", "Orabank Togo, détails sur la page de paiement."],
          ["🌍", "Depuis l'étranger", "Zelle ou virement international (diaspora)."],
        ].map(([icon, title, desc]) => (
          <Card key={title} className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">
              {icon}
            </span>
            <div>
              <p className="font-semibold text-ink">{title}</p>
              <p className="text-sm text-[var(--color-muted)]">{desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
