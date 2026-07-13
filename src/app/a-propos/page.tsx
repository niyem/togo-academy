// A propos : mise en page editoriale du redesign, en conservant le contenu
// existant (mission, methode, Groupe BM). Couleurs Togo inchangees.

import type { Metadata } from "next";
import { Button, Container, Eyebrow } from "@/components/ui";
import { getStats } from "@/lib/content";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Togo Academy : la plateforme d'apprentissage en ligne du programme scolaire togolais, un département de Groupe BM.",
};

export const revalidate = 60;

const FEATURES: [string, string][] = [
  [
    "🎬 Des leçons complètes",
    "Vidéos courtes (un concept à la fois), cours écrit, exemples résolus, exercices interactifs et fiches PDF téléchargeables.",
  ],
  [
    "📝 Des épreuves comme en classe",
    "Quiz pendant les vidéos, évaluations par sous-chapitre (70%) et examens de chapitre (80%) qui mènent au certificat de cours.",
  ],
  [
    "🤖 Un tuteur IA",
    "Dans chaque leçon : il explique autrement, donne des indices sans jamais révéler la réponse, et propose des exercices en plus.",
  ],
  [
    "👨🏾‍🏫 Bientôt : le tutorat en direct",
    "Des séances privées 1:1 avec des enseignants togolais, payables à la séance, sans abonnement.",
  ],
  [
    "👪 Un suivi pour les parents",
    "Un compte parent relié à ses enfants : leçons terminées, scores aux quiz, progression vers les certificats.",
  ],
  [
    "📶 Pensé pour le Togo",
    "Site léger et rapide sur connexions lentes, paiements par Flooz et virement bancaire, contenu 100 % aligné sur le programme officiel.",
  ],
];

export default async function AboutPage() {
  const stats = await getStats();
  const statItems = [
    { value: `${stats.classes}`, label: "classes couvertes" },
    { value: `${stats.subjects}`, label: "matières" },
    { value: `${stats.lessons}+`, label: "leçons & exercices" },
    { value: "100%", label: "programme togolais" },
  ];

  return (
    <>
      {/* ── Récit éditorial ──────────────────────────────── */}
      <Container className="max-w-3xl pb-10 pt-14 sm:pt-20">
        <Eyebrow>À propos</Eyebrow>
        <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl">
          L&apos;éducation de qualité, accessible partout au Togo.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink/90">
          Au Togo, beaucoup d&apos;établissements manquent d&apos;enseignants
          qualifiés, en particulier en sciences. Trop d&apos;élèves abordent
          les mathématiques, la physique ou la SVT sans explications claires,
          et leurs chances aux examens s&apos;en ressentent. Togo Academy est
          née pour réduire cette inégalité : offrir à chaque élève, quel que
          soit son établissement ou sa ville, les mêmes leçons de qualité et le
          même accompagnement.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink/90">
          Nous travaillons avec des enseignants togolais pour produire des
          leçons fidèles au programme officiel, du CP1 à la Terminale de
          l&apos;enseignement général, avant d&apos;ouvrir les filières
          techniques. Une partie du contenu reste
          gratuite, pour que l&apos;apprentissage ne s&apos;arrête jamais à une
          question d&apos;argent.
        </p>
      </Container>

      {/* ── Ce que vous trouvez ici ──────────────────────── */}
      <Container className="pb-12 pt-4">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([title, body]) => (
            <div
              key={title}
              className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-7"
            >
              <h3 className="font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </Container>

      {/* ── Notre méthode ────────────────────────────────── */}
      <Container className="max-w-3xl pb-12">
        <h2 className="font-display text-3xl tracking-tight text-ink">
          Notre méthode
        </h2>
        <ul className="mt-5 space-y-3 text-[var(--color-muted)]">
          <li>
            ➗ <strong className="text-ink">Un concept à la fois</strong> :
            chaque vidéo explique une seule idée, simplement.
          </li>
          <li>
            ✍️ <strong className="text-ink">La pratique avant tout</strong> :
            comprendre ne suffit pas, on s&apos;entraîne jusqu&apos;à réussir.
          </li>
          <li>
            🎓 <strong className="text-ink">Des repères clairs</strong> :
            évaluations, examens et certificats de cours pour mesurer les
            progrès réels.
          </li>
          <li>
            🇹🇬 <strong className="text-ink">Le programme togolais</strong> : du
            CEPD au BEPC et au BAC, filières générale et technique.
          </li>
        </ul>

        <h2 className="mt-12 font-display text-3xl tracking-tight text-ink">
          Qui sommes-nous
        </h2>
        <div className="mt-5 flex flex-col gap-5 rounded-2xl border border-togo-green-100 bg-togo-green-50 p-7 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gbm-logo.png"
            alt="Sceau officiel de Groupe BM"
            width={72}
            height={72}
            loading="lazy"
            className="flex-none"
          />
          <p className="leading-relaxed text-[var(--color-muted)]">
            Togo Academy est le département « Académie en ligne » de{" "}
            <a
              href="https://groupebm.net"
              className="font-semibold text-togo-green-700 hover:underline"
            >
              Groupe BM
            </a>{" "}
            (« Bâtir et Moderniser »), un groupe de services et de technologie
            qui connecte les talents à l&apos;excellence mondiale : éducation,
            immigration, services professionnels, recherche et ingénierie. Togo Academy est à la fois
            une entreprise éducative durable et un outil de démocratisation de
            l&apos;éducation de qualité au Togo : les abonnements financent la
            production de nouveaux cours et leur accessibilité au plus grand
            nombre.
          </p>
        </div>
      </Container>

      {/* ── Bande de statistiques ────────────────────────── */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface-soft)]">
        <Container className="grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
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

      {/* ── CTA ──────────────────────────────────────────── */}
      <Container className="pb-6 pt-14">
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 px-8 py-12 text-center">
          <h2 className="font-display text-3xl tracking-tight text-ink">
            Prêt à essayer ?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-muted)]">
            Des leçons d&apos;essai sont gratuites, sans carte bancaire.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/catalogue" variant="primary">
              Découvrir les leçons
            </Button>
            <Button href="/contact" variant="secondary">
              Nous contacter
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
