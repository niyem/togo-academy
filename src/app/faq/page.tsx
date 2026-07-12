// FAQ : accordeon editorial (details/summary natif, zero JS, rapide sur
// connexions lentes), questions groupees par theme, carte support en bas.

import type { Metadata } from "next";
import { Button, Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Questions fréquentes" };

type Faq = { q: string; a: string };
type FaqGroup = { theme: string; items: Faq[] };

const GROUPS: FaqGroup[] = [
  {
    theme: "La plateforme et les cours",
    items: [
      {
        q: "Puis-je essayer avant de payer ?",
        a: "Oui. Certaines leçons sont gratuites, avec vidéo, exercices et quiz, pour découvrir la plateforme sans abonnement ni carte bancaire. Elles portent le badge « Gratuit » dans le catalogue.",
      },
      {
        q: "Les cours suivent-ils le programme togolais ?",
        a: "Oui. Les leçons sont organisées par niveau et classe, du CP1 à la Terminale, et alignées sur le programme officiel : enseignement général (jusqu'au BEPC et au BAC) et enseignement technique (CET et lycée technique).",
      },
      {
        q: "De quoi se compose une leçon ?",
        a: "Chaque leçon comprend une vidéo courte (un concept à la fois) avec des questions intégrées, un cours écrit, un exemple résolu, des exercices interactifs et un quiz corrigé immédiatement. Les abonnés peuvent aussi télécharger la fiche PDF de la leçon.",
      },
      {
        q: "Comment fonctionnent les évaluations et les examens ?",
        a: "Chaque sous-chapitre se termine par une évaluation (70 % pour la valider) et chaque chapitre par un examen final (80 %). Rien n'est bloquant : vous pouvez continuer les leçons librement, mais valider toutes les épreuves d'un cours vous fait obtenir son certificat.",
      },
      {
        q: "Comment obtenir un certificat ?",
        a: "Les certificats sont délivrés par cours, c'est-à-dire par matière d'une classe (par exemple Mathématiques 3ème). Il faut valider toutes les évaluations (70 %) et tous les examens de chapitre (80 %) du cours. Votre progression vers chaque certificat est visible sur la page de la classe.",
      },
      {
        q: "La plateforme fonctionne-t-elle avec une connexion lente ?",
        a: "Oui. Le site est léger et pensé pour le mobile. Les fiches PDF permettent aussi de réviser hors ligne. Un téléphone et un simple navigateur suffisent, sans installation.",
      },
    ],
  },
  {
    theme: "Abonnements et paiements",
    items: [
      {
        q: "Comment payer l'abonnement ?",
        a: "Par Flooz (Moov Money) ou virement bancaire Orabank au Togo ; depuis l'étranger, Zelle ou virement international. Vous payez, soumettez la référence de paiement sur la page d'abonnement, et l'équipe active votre compte sous 24 h environ.",
      },
      {
        q: "L'abonnement est-il avec engagement ?",
        a: "Non. Les formules sont sans engagement : vous payez la période choisie (mois, trimestre ou année) et vous arrêtez quand vous voulez. Aucun prélèvement automatique.",
      },
      {
        q: "Que comprend l'abonnement ?",
        a: "Toutes les leçons de votre formule (une classe entière ou toute la plateforme selon le plan), les exercices et quiz corrigés, les fiches PDF téléchargeables, le tuteur IA dans chaque leçon et le suivi de progression.",
      },
    ],
  },
  {
    theme: "Comptes et suivi parental",
    items: [
      {
        q: "Les parents peuvent-ils suivre leur enfant ?",
        a: "Oui. Créez un compte parent, puis reliez vos enfants grâce au code de liaison (au format TG-XXXXXX) affiché sur le tableau de bord de chaque élève. Vous voyez alors leurs leçons terminées, leurs scores aux quiz et leur progression vers les certificats.",
      },
      {
        q: "Un parent peut-il suivre plusieurs enfants ?",
        a: "Oui. Un même compte parent peut être relié à plusieurs élèves : chaque enfant apparaît sur votre tableau de bord avec sa propre progression.",
      },
      {
        q: "Qu'est-ce que le tuteur IA ?",
        a: "Un assistant pédagogique disponible dans chaque leçon pour les abonnés. Il explique le cours autrement, donne des indices étape par étape sans jamais révéler la réponse, et propose des exercices supplémentaires. Il reste concentré sur la leçon en cours.",
      },
    ],
  },
  {
    theme: "Tutorat en direct",
    items: [
      {
        q: "Comment fonctionnera le tutorat en direct ?",
        a: "Bientôt disponible : des séances privées 1:1 avec des enseignants togolais validés par notre équipe. Vous voyez les tuteurs disponibles en ligne pour votre matière avant de payer, puis vous échangez en direct (audio et tableau partagé).",
      },
      {
        q: "Faut-il un abonnement pour le tutorat en direct ?",
        a: "Non. Le tutorat se paie à la séance et est ouvert à tout élève inscrit, avec ou sans abonnement. Si vous payez et qu'aucun tuteur ne se libère, le montant devient un crédit utilisable pour une prochaine séance.",
      },
      {
        q: "Comment devenir tuteur ?",
        a: "Les enseignants intéressés peuvent nous écrire via la page Contact. Les séances sont rémunérées, avec un versement hebdomadaire sur Flooz, et vous choisissez vos disponibilités.",
      },
    ],
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

      <div className="flex flex-col gap-10">
        {GROUPS.map((group) => (
          <section key={group.theme}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              {group.theme}
            </h2>
            <div className="border-t border-[var(--color-line)]">
              {group.items.map((f) => (
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
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-togo-green-100 bg-togo-green-50 p-7">
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
