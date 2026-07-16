import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";
import { getClasses, getSubjects } from "@/lib/content";
import { TutorApplicationForm } from "@/components/tutor/forms";

export const metadata: Metadata = { title: "Devenir tuteur" };

export default async function BecomeTutorPage() {
  const [subjects, classes] = await Promise.all([getSubjects(), getClasses()]);
  const subjectOpts = subjects.map((s) => ({ value: s.key, label: s.name }));
  const classOpts = classes
    .filter((c) => c.track === "general")
    .map((c) => ({ value: c.slug, label: c.name }));

  return (
    <Section>
      <Container className="max-w-2xl">
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 px-6 py-8 sm:px-10">
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Devenir tuteur
          </h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Donnez des séances en direct aux élèves de Togo Academy. Remplissez
            votre candidature : notre équipe la vérifie avant de publier votre
            profil sur la place de marché du tutorat.
          </p>
          <div className="mt-7">
            <TutorApplicationForm subjects={subjectOpts} classes={classOpts} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
