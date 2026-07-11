import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { getPlans } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tarifs & abonnements",
  description:
    "Des abonnements souples et abordables, payables par Flooz, TMoney ou virement bancaire.",
};

function formatXof(n: number) {
  return n === 0 ? "Gratuit" : `${n.toLocaleString("fr-FR")} FCFA`;
}

export default function PricingPage() {
  const plans = getPlans();

  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Abonnements</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          Choisissez la formule adaptée à votre enfant. Paiement par Flooz,
          TMoney ou virement bancaire.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.slug}
              className={
                plan.recommended
                  ? "border-togo-green-500 shadow-md ring-1 ring-togo-green-500"
                  : ""
              }
            >
              {plan.recommended && (
                <Badge tone="green">Le plus populaire</Badge>
              )}
              <h2 className="mt-2 text-lg font-bold">{plan.name}</h2>
              <p className="mt-1 text-3xl font-extrabold text-togo-green-600">
                {formatXof(plan.priceXof)}
                {plan.priceXof > 0 && (
                  <span className="text-sm font-normal text-[var(--color-muted)]">
                    {" "}
                    / {plan.cadence}
                  </span>
                )}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-togo-green-600">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <Button
                  href="/inscription"
                  variant={plan.recommended ? "primary" : "outline"}
                  className="w-full"
                >
                  {plan.priceXof === 0 ? "Commencer" : "S'abonner"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["📱", "Flooz", "Paiement mobile Moov Money."],
            ["📲", "TMoney", "Paiement mobile Togocom."],
            ["🏦", "Virement bancaire", "Confirmation par l'administration."],
          ].map(([icon, title, desc]) => (
            <Card key={title} className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">
                {icon}
              </span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-sm text-[var(--color-muted)]">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          Le paiement mobile (Flooz / TMoney) sera activé prochainement. Le
          virement bancaire est disponible dès le lancement, avec vérification
          par l&apos;équipe.
        </p>
      </Container>
    </Section>
  );
}
