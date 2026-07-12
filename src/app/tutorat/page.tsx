import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Tutorat en direct",
  description:
    "Bientôt : des séances privées 1:1 avec de vrais enseignants togolais, payables à la séance, sans abonnement.",
};

const STEPS: [string, string, string][] = [
  [
    "1",
    "Choisis ton tuteur",
    "Vois les tuteurs disponibles en ligne pour ta classe et ta matière : leur profil, leur note et leurs séances données.",
  ],
  [
    "2",
    "Paie ta séance",
    "À la séance, par Flooz ou les autres moyens habituels. Aucun abonnement requis. Si aucun tuteur ne se libère, le montant devient un crédit à utiliser plus tard.",
  ],
  [
    "3",
    "Apprends en direct",
    "Une séance privée 1:1 : audio, tableau partagé et explications adaptées à ton rythme, alignées sur le programme togolais.",
  ],
];

export default function TutoratPage() {
  return (
    <>
      <Section className="bg-gradient-to-b from-togo-green-50 to-white">
        <Container className="max-w-3xl text-center">
          <Badge tone="yellow">Bientôt disponible</Badge>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight">
            Tutorat en direct avec de{" "}
            <span className="text-togo-green-600">vrais enseignants</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-muted)]">
            En plus du tuteur IA, des séances privées 1:1 avec des enseignants
            togolais validés par notre équipe : pour débloquer un chapitre
            difficile ou préparer un examen.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-4xl">
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map(([n, title, desc]) => (
              <Card key={n}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-togo-yellow-400 font-bold">
                  {n}
                </div>
                <h2 className="mt-3 font-bold">{title}</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{desc}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-togo-green-50/50 text-center">
            <h2 className="text-xl font-bold">Sois prêt pour le lancement</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-muted)]">
              Crée ton compte dès maintenant : tu profites déjà des leçons, des
              quiz et du tuteur IA, et tu seras informé dès l&apos;ouverture du
              tutorat en direct.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button href="/inscription">Créer mon compte</Button>
              <Button href="/catalogue" variant="outline">
                Découvrir les leçons
              </Button>
            </div>
          </Card>

          <Card className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">👩🏾‍🏫 Vous êtes enseignant(e) ?</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Rejoignez les premiers tuteurs de Togo Academy : séances
                  rémunérées, versements hebdomadaires sur Flooz, vous
                  choisissez vos disponibilités.
                </p>
              </div>
              <Button href="/contact" variant="outline">
                Devenir tuteur
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
