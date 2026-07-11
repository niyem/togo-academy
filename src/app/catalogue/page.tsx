import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card, Container, Section } from "@/components/ui";
import { getClasses, getLevels } from "@/lib/content";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Parcourez les niveaux, classes et matières couverts par Togo Academy.",
};

export const revalidate = 60;

export default async function CataloguePage() {
  const [levels, allClasses] = await Promise.all([getLevels(), getClasses()]);

  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Catalogue des cours</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          Du primaire au lycée. Choisissez une classe pour découvrir ses
          matières, chapitres et leçons.
        </p>

        <div className="mt-8 space-y-10">
          {levels.map((level) => {
            const classes = allClasses.filter((c) => c.levelSlug === level.slug);
            return (
              <div key={level.slug} id={level.slug} className="scroll-mt-24">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-togo-green-700">
                    {level.name}
                  </h2>
                  <span className="text-sm text-[var(--color-muted)]">
                    {classes.length} classes
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  {level.description}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {classes.map((c) => (
                    <Link key={c.slug} href={`/classes/${c.slug}`}>
                      <Card className="flex h-full items-center justify-center py-6 text-center font-bold transition-shadow hover:shadow-md hover:border-togo-green-500">
                        {c.name}
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <Badge tone="yellow">Astuce</Badge>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Les leçons marquées{" "}
            <Badge tone="green">Gratuit</Badge> sont accessibles sans
            abonnement.
          </p>
        </div>
      </Container>
    </Section>
  );
}
