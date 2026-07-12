// Tutorat en direct : hero avec maquette de conversation sur panneau sombre,
// etapes "comment ca marche", matieres couvertes. Realite conservee :
// bientot disponible, sans abonnement, credit si aucun tuteur.

import type { Metadata } from "next";
import { Button, Card, Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Tutorat en direct",
  description:
    "Bientôt : des séances privées 1:1 avec de vrais enseignants togolais, payables à la séance, sans abonnement.",
};

const STEPS: [string, string, string][] = [
  [
    "01",
    "Choisissez votre tuteur",
    "Voyez les tuteurs disponibles en ligne pour votre classe et votre matière : profil, note et séances données.",
  ],
  [
    "02",
    "Payez à la séance",
    "Par Flooz ou les autres moyens habituels. Aucun abonnement requis. Si aucun tuteur ne se libère, le montant devient un crédit à utiliser plus tard.",
  ],
  [
    "03",
    "Apprenez en direct",
    "Une séance privée 1:1 : audio, tableau partagé et explications adaptées à votre rythme, alignées sur le programme togolais.",
  ],
];

const SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "SVT",
  "Technologie",
  "Informatique",
  "Français",
  "Anglais",
  "Philosophie",
];

export default function TutoratPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <Container className="grid items-center gap-12 pb-10 pt-14 md:grid-cols-[1.05fr_0.95fr] md:pt-20">
        <div>
          <Eyebrow>Tutorat · Bientôt disponible</Eyebrow>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Un vrai tuteur, quand vous en avez besoin.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-[var(--color-muted)]">
            Bloqué sur un exercice ? En plus du tuteur IA inclus dans chaque
            leçon, réservez une séance privée 1:1 avec un enseignant togolais
            validé par notre équipe, payable à la séance, sans abonnement.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/inscription" variant="primary">
              Créer mon compte
            </Button>
            <Button href="/catalogue" variant="secondary">
              Découvrir les leçons
            </Button>
          </div>
        </div>

        {/* Maquette de conversation */}
        <div className="flex flex-col gap-3 rounded-2xl bg-ink p-6 text-[var(--color-on-dark)]">
          <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md bg-[var(--color-ink-800)] px-4 py-3 text-sm">
            Je ne comprends pas les limites en maths…
          </div>
          <div className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-togo-green-600 px-4 py-3 text-sm text-white">
            Pas de souci ! On reprend ensemble avec un exemple simple.
          </div>
          <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md bg-[var(--color-ink-800)] px-4 py-3 text-sm">
            Merci, c&apos;est beaucoup plus clair !
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-togo-yellow-400">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-togo-green-500"
            />
            Tuteur en ligne · Mathématiques
          </div>
        </div>
      </Container>

      {/* ── Comment ça marche ────────────────────────────── */}
      <Container className="py-10">
        <h2 className="mb-8 font-display text-3xl tracking-tight text-ink">
          Comment ça marche
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {STEPS.map(([num, title, body]) => (
            <div
              key={num}
              className="rounded-2xl border border-[var(--color-line)] bg-white p-7"
            >
              <div className="mb-3 font-display text-2xl tracking-tight text-togo-green-600">
                {num}
              </div>
              <h3 className="text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </Container>

      {/* ── Matières couvertes ───────────────────────────── */}
      <Container className="pb-10 pt-4">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] p-8">
          <h3 className="mb-4 text-lg font-semibold text-ink">
            Matières couvertes au lancement
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 text-sm text-ink"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </Container>

      {/* ── Devenir tuteur ───────────────────────────────── */}
      <Container className="pb-20 pt-2">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-7">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-ink">
              👩🏾‍🏫 Vous êtes enseignant(e) ?
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Rejoignez les premiers tuteurs de Togo Academy : séances
              rémunérées, versements hebdomadaires sur Flooz, vous choisissez
              vos disponibilités.
            </p>
          </div>
          <Button href="/contact" variant="secondary">
            Devenir tuteur
          </Button>
        </Card>
      </Container>
    </>
  );
}
