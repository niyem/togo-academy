import Link from "next/link";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { getLevels, getStats, getSubjects } from "@/lib/content";

export default function HomePage() {
  const levels = getLevels();
  const subjects = getSubjects();
  const stats = getStats();

  return (
    <>
      {/* Hero */}
      <Section className="bg-gradient-to-b from-togo-green-50 to-white pt-14">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge tone="yellow">Éducation pour tous au Togo 🇹🇬</Badge>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Comprendre chaque leçon,{" "}
              <span className="text-togo-green-600">réussir chaque examen</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[var(--color-muted)]">
              Des cours vidéo courts, des exercices, des quiz corrigés et un
              tuteur IA, alignés sur le programme togolais. Du primaire au
              lycée, en sciences et bien plus.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/catalogue" variant="primary">
                Explorer le catalogue
              </Button>
              <Button href="/tarifs" variant="outline">
                Voir les abonnements
              </Button>
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              🎁 Des leçons d&apos;essai gratuites, sans carte bancaire.
            </p>
          </div>

          <Card className="bg-white/80 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <Stat value={`${stats.classes}`} label="Classes couvertes" />
              <Stat value={`${stats.subjects}`} label="Matières STEM" />
              <Stat value={`${stats.lessons}+`} label="Leçons" />
              <Stat value={`${stats.freeLessons}`} label="Leçons gratuites" />
            </div>
            <p className="mt-4 rounded-xl bg-togo-green-50 p-3 text-sm text-togo-green-700">
              Là où il manque des enseignants qualifiés en sciences, Togo
              Academy apporte des explications claires, partout.
            </p>
          </Card>
        </Container>
      </Section>

      {/* Levels */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold">Choisis ton niveau</h2>
          <p className="mt-1 text-[var(--color-muted)]">
            Niveau → Classe → Matière → Chapitre → Leçon.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {levels.map((level) => (
              <Link key={level.slug} href={`/catalogue#${level.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <h3 className="text-lg font-bold text-togo-green-700">
                    {level.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {level.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Subjects */}
      <Section className="bg-togo-green-50/40">
        <Container>
          <h2 className="text-2xl font-bold">Matières scientifiques</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {subjects.map((s) => (
              <Card key={s.key} className="flex items-start gap-3">
                <span aria-hidden className="text-2xl">
                  {s.icon}
                </span>
                <div>
                  <h3 className="font-bold">{s.name}</h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    {s.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold">Comment ça marche</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["1", "Regarde", "Une vidéo courte explique un concept à la fois."],
              ["2", "Comprends", "Le cours écrit et des exemples résolus."],
              ["3", "Pratique", "Des exercices et quiz avec correction immédiate."],
              ["4", "Progresse", "Suis tes scores et reçois des recommandations."],
            ].map(([n, t, d]) => (
              <Card key={n}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-togo-yellow-400 font-bold">
                  {n}
                </div>
                <h3 className="mt-3 font-bold">{t}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{d}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container>
          <Card className="bg-togo-green-600 text-center text-white">
            <h2 className="text-2xl font-bold">
              Commence gratuitement dès aujourd&apos;hui
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-togo-green-50">
              Crée un compte élève ou parent et découvre une première leçon
              complète, sans payer.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button
                href="/inscription"
                variant="primary"
                className="bg-white !text-togo-green-700 hover:bg-togo-green-50"
              >
                Créer un compte
              </Button>
              <Button
                href="/catalogue"
                variant="outline"
                className="!border-white !text-white hover:!bg-togo-green-700"
              >
                Voir une leçon
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] p-4 text-center">
      <div className="text-2xl font-extrabold text-togo-green-600">{value}</div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
