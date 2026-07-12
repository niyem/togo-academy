// Accueil : structure editoriale (design Claude Design "Menu Redesign"),
// couleurs Togo inchangees. Donnees reelles (niveaux, classes, stats).

import Link from "next/link";
import { Button, Container, Eyebrow, LevelDot } from "@/components/ui";
import { getClasses, getLevels, getStats } from "@/lib/content";

export const revalidate = 60;

const LEVEL_DOT: Record<string, string> = {
  primaire: "bg-togo-green-500",
  college: "bg-togo-yellow-400",
  lycee: "bg-togo-red-500",
};

export default async function HomePage() {
  const [levels, classes, stats] = await Promise.all([
    getLevels(),
    getClasses(),
    getStats(),
  ]);

  const statItems = [
    { value: `${stats.classes}`, label: "classes couvertes" },
    { value: `${stats.subjects}`, label: "matières" },
    { value: `${stats.lessons}+`, label: "leçons & exercices" },
    { value: "100%", label: "programme togolais" },
  ];

  const features = [
    {
      title: "Cours structurés",
      body: "Chaque matière suit le programme officiel, découpée en chapitres et leçons claires : vidéo courte, cours écrit, exercices corrigés.",
      icon: (
        <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM14 3v6h6M8 13h8M8 17h5" />
      ),
    },
    {
      title: "Un tuteur quand vous bloquez",
      body: "Le tuteur IA explique autrement dans chaque leçon. Et bientôt : des séances privées avec des enseignants togolais.",
      icon: (
        <path d="M21 12a8 8 0 0 1-11.3 7.3L3 21l1.7-6.7A8 8 0 1 1 21 12zM8 12h.01M12 12h.01M16 12h.01" />
      ),
    },
    {
      title: "Suivez vos progrès",
      body: "Quiz corrigés immédiatement, évaluations, examens et certificats de cours. Reprenez là où vous vous êtes arrêté.",
      icon: <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />,
    },
  ];

  const heroLessons = [
    { title: "Limites et continuité", time: "12 min", done: true },
    { title: "Dérivées : introduction", time: "18 min", done: false },
    { title: "Fonctions exponentielles", time: "15 min", done: false },
    { title: "Exercices corrigés", time: "24 min", done: false },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section>
        <Container className="grid items-center gap-12 pb-10 pt-14 md:grid-cols-[1.05fr_0.95fr] md:pt-20">
          <div>
            <Eyebrow>Plateforme d&apos;apprentissage</Eyebrow>
            <h1 className="mt-4 font-display text-4xl leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Apprenez à votre rythme, du primaire au bac.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[var(--color-muted)]">
              Tout le programme togolais en cours vidéo et leçons écrites, avec
              un tuteur quand vous êtes bloqué. Une éducation de qualité,
              accessible partout au Togo.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/inscription" variant="primary">
                Commencer gratuitement
              </Button>
              <Button href="/catalogue" variant="secondary">
                Voir le catalogue
              </Button>
            </div>
          </div>

          {/* Maquette de leçon sur carte claire */}
          <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                Terminale · Mathématiques
              </span>
              <span className="rounded-full bg-togo-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-togo-yellow-600">
                En cours
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {heroLessons.map((l) => (
                <div
                  key={l.title}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                    l.done
                      ? "border-togo-green-500 bg-white"
                      : "border-[var(--color-line)] bg-white"
                  }`}
                >
                  <span
                    aria-hidden
                    className={
                      l.done ? "text-togo-green-600" : "text-[var(--color-muted)]"
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d={l.done ? "M9 12l2 2 4-4" : "M8 12h8"} />
                    </svg>
                  </span>
                  <span className="flex-1 text-sm text-ink">{l.title}</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {l.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Bande de statistiques ─────────────────────────── */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface-soft)]">
        <Container className="grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* ── Ce qu'il faut pour réussir ───────────────────── */}
      <section>
        <Container className="pb-10 pt-16 md:pt-20">
          <h2 className="max-w-xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Tout ce qu&apos;il faut pour réussir.
          </h2>
          <p className="mt-3 max-w-lg text-[var(--color-muted)]">
            Une plateforme pensée pour les élèves togolais, du CP1 à la
            Terminale, enseignement général et technique.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-7"
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-togo-green-600">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {f.icon}
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Niveaux ──────────────────────────────────────── */}
      <section>
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-3xl tracking-tight text-ink">
              Trois niveaux, un seul parcours.
            </h2>
            <Link
              href="/catalogue"
              className="text-sm font-medium text-togo-green-600 hover:text-togo-green-700"
            >
              Tout le catalogue →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {levels.map((level) => {
              const count = classes.filter(
                (c) => c.levelSlug === level.slug,
              ).length;
              return (
                <Link
                  key={level.slug}
                  href={`/catalogue#${level.slug}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-togo-green-100 bg-togo-green-50 p-7 transition-shadow hover:shadow-md"
                >
                  <LevelDot color={LEVEL_DOT[level.slug]} />
                  <h3 className="mt-2 font-display text-2xl tracking-tight text-ink group-hover:text-togo-green-700">
                    {level.name}
                  </h3>
                  <div className="text-xs font-medium text-[var(--color-muted)]">
                    {count} classes
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {level.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Témoignage ───────────────────────────────────── */}
      <section>
        <Container className="pb-16 pt-4">
          <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 px-8 py-12 sm:px-12">
            <div className="max-w-2xl">
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-togo-green-600">
                Témoignage
              </div>
              <p className="font-display text-2xl leading-snug tracking-tight text-ink sm:text-[26px]">
                « Ma fille a repris confiance en mathématiques. Elle révise
                seule le soir et pose ses questions au tuteur quand elle
                bloque. »
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-togo-green-600 font-semibold text-white">
                  A
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">Awa D.</div>
                  <div className="text-xs text-[var(--color-muted)]">
                    Parent d&apos;élève, Lomé
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── CTA (carte claire) ───────────────────────────── */}
      <section>
        <Container className="pb-6">
          <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 px-8 py-12 text-center">
            <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
              Prêt à commencer ?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted)]">
              Créez un compte gratuit et débloquez vos premières leçons dès
              aujourd&apos;hui. Sans carte bancaire.
            </p>
            <div className="mt-7 flex justify-center">
              <Button href="/inscription" variant="primary">
                Créer un compte gratuit
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
