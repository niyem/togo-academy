// Catalogue : recherche + filtres par niveau (redesign editorial),
// donnees reelles chargees cote serveur, exploration cote client.

import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui";
import {
  CatalogueExplorer,
  type ExplorerClass,
} from "@/components/catalogue/CatalogueExplorer";
import { getClasses, getLevels, getSubjectsByClass } from "@/lib/content";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Parcourez les niveaux, classes et matières couverts par Togo Academy.",
};

export const revalidate = 60;

export default async function CataloguePage() {
  const [levels, allClasses, subjectsByClass] = await Promise.all([
    getLevels(),
    getClasses(),
    getSubjectsByClass(),
  ]);

  const classes: ExplorerClass[] = allClasses.map((c) => {
    const subjects = subjectsByClass[c.slug] ?? [];
    return {
      slug: c.slug,
      name: c.name,
      levelSlug: c.levelSlug,
      track: c.track,
      subjects,
      hasContent: subjects.length > 0,
    };
  });

  return (
    <Container className="pb-20 pt-12 sm:pt-16">
      <div className="mb-8 max-w-2xl">
        <Eyebrow>Catalogue des cours</Eyebrow>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          Trouvez votre classe.
        </h1>
        <p className="mt-4 text-[var(--color-muted)]">
          Du primaire au lycée, enseignement général et technique. Cherchez une
          matière ou choisissez directement votre classe pour découvrir ses
          chapitres et ses leçons.
        </p>
      </div>

      <CatalogueExplorer
        levels={levels.map((l) => ({
          slug: l.slug,
          name: l.name,
          description: l.description,
        }))}
        classes={classes}
      />
    </Container>
  );
}
