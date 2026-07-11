import type { Metadata } from "next";
import { Card, Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Notre mission",
  description:
    "Démocratiser l'accès à une éducation de qualité au Togo, en particulier en sciences.",
};

export default function AboutPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-extrabold">Notre mission</h1>
        <p className="mt-4 text-lg text-[var(--color-muted)]">
          Au Togo, beaucoup d&apos;établissements manquent d&apos;enseignants
          qualifiés en sciences. Trop d&apos;élèves abordent les
          mathématiques, la physique ou la SVT sans explications claires. Togo
          Academy existe pour réduire cette inégalité.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="font-bold text-togo-green-700">
              Une entreprise éducative durable
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Des abonnements abordables financent la production de cours de
              qualité et la pérennité de la plateforme.
            </p>
          </Card>
          <Card>
            <h2 className="font-bold text-togo-green-700">
              Un outil de démocratisation
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Où que vivent les élèves, ils accèdent aux mêmes leçons,
              exercices et à un accompagnement personnalisé.
            </p>
          </Card>
        </div>

        <h2 className="mt-10 text-xl font-bold">Nos principes</h2>
        <ul className="mt-3 space-y-2 text-[var(--color-muted)]">
          <li>➗ Une vidéo courte explique un seul concept à la fois.</li>
          <li>✍️ Beaucoup de pratique : comprendre, ce n&apos;est pas seulement lire.</li>
          <li>📶 Un site rapide, pensé pour les connexions lentes.</li>
          <li>🇹🇬 Aligné sur le programme officiel togolais, en français.</li>
        </ul>
      </Container>
    </Section>
  );
}
