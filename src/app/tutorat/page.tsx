// Tutorat en direct : place de marche des tuteurs humains (profils approuves)
// + reservation d'une seance. Sections marketing conservees.

import type { Metadata } from "next";
import { Button, Card, Container, Eyebrow } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClasses, getSubjects } from "@/lib/content";
import { BookTutorForm } from "@/components/tutor/forms";

export const metadata: Metadata = {
  title: "Tutorat en direct",
  description:
    "Des séances privées 1:1 avec des tuteurs togolais, payables à la séance, sans abonnement.",
};

const STEPS: [string, string, string][] = [
  [
    "01",
    "Choisissez votre tuteur",
    "Parcourez les tuteurs validés par notre équipe pour votre classe et votre matière : accroche, présentation, disponibilités.",
  ],
  [
    "02",
    "Demandez une séance",
    "Envoyez votre demande en un clic. Le tuteur la confirme, puis vous convenez du créneau et du paiement (Flooz ou autre).",
  ],
  [
    "03",
    "Apprenez en direct",
    "Une séance privée 1:1 adaptée à votre rythme, alignée sur le programme togolais.",
  ],
];

export default async function TutoratPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: { user } }, subjects, classes, { data: tutors }] =
    await Promise.all([
      supabase.auth.getUser(),
      getSubjects(),
      getClasses(),
      supabase
        .from("tutor_profiles")
        .select(
          "user_id,full_name,headline,bio,subject_keys,class_slugs,availability,rate_xof",
        )
        .eq("status", "approved")
        .order("updated_at", { ascending: false }),
    ]);

  const subjectName = new Map<string, string>(
    subjects.map((s) => [s.key, s.name]),
  );
  const className = new Map<string, string>(
    classes.map((c) => [c.slug, c.name]),
  );
  const tutorList = tutors ?? [];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <Container className="grid items-center gap-12 pb-10 pt-14 md:grid-cols-[1.05fr_0.95fr] md:pt-20">
        <div>
          <Eyebrow>Tutorat en direct</Eyebrow>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Un tuteur, quand vous en avez besoin.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-[var(--color-muted)]">
            Bloqué sur un exercice ? En plus du tuteur IA inclus dans chaque
            leçon, réservez une séance privée 1:1 avec un tuteur togolais validé
            par notre équipe, payable à la séance, sans abonnement.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="#tuteurs" variant="primary">
              Voir les tuteurs
            </Button>
            <Button href="/devenir-tuteur" variant="secondary">
              Devenir tuteur
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-togo-green-100 bg-togo-green-50 p-6">
          <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-ink">
            Je ne comprends pas les limites en maths…
          </div>
          <div className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-togo-green-600 px-4 py-3 text-sm text-white">
            Pas de souci ! On reprend ensemble avec un exemple simple.
          </div>
          <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-ink">
            Merci, c&apos;est beaucoup plus clair !
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-togo-green-700">
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
              className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-7"
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

      {/* ── Tuteurs disponibles ──────────────────────────── */}
      <Container className="py-10">
        <div id="tuteurs" className="scroll-mt-24" />
        <h2 className="mb-8 font-display text-3xl tracking-tight text-ink">
          Nos tuteurs
        </h2>

        {tutorList.length === 0 ? (
          <Card className="bg-togo-yellow-100/60">
            <p className="font-semibold">Bientôt disponible</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Nos premiers tuteurs arrivent. Vous êtes enseignant(e) ?{" "}
              <a
                href="/devenir-tuteur"
                className="font-semibold text-togo-green-700 hover:underline"
              >
                Proposez-vous comme tuteur.
              </a>
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {tutorList.map((t) => {
              const subjOpts: { value: string; label: string }[] = (
                t.subject_keys ?? []
              ).map((k: string) => ({ value: k, label: subjectName.get(k) ?? k }));
              const classOpts: { value: string; label: string }[] = (
                t.class_slugs ?? []
              ).map((s: string) => ({ value: s, label: className.get(s) ?? s }));
              return (
                <Card key={t.user_id}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-ink">
                      {t.full_name ?? "Tuteur"}
                    </h3>
                    {t.rate_xof ? (
                      <span className="whitespace-nowrap text-sm font-semibold text-togo-green-700">
                        {t.rate_xof} FCFA / séance
                      </span>
                    ) : null}
                  </div>
                  {t.headline && (
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {t.headline}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {subjOpts.map((o) => (
                      <span
                        key={o.value}
                        className="rounded-full bg-togo-green-50 px-2.5 py-1 text-xs font-medium text-togo-green-700"
                      >
                        {o.label}
                      </span>
                    ))}
                  </div>
                  {t.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-ink">
                      {t.bio}
                    </p>
                  )}
                  {t.availability && (
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      Disponibilités : {t.availability}
                    </p>
                  )}

                  {user ? (
                    <BookTutorForm
                      tutorId={t.user_id}
                      subjects={subjOpts}
                      classes={classOpts}
                    />
                  ) : (
                    <Button href="/connexion" variant="secondary" className="mt-4">
                      Se connecter pour réserver
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Container>

      {/* ── Devenir tuteur ───────────────────────────────── */}
      <Container className="pb-20 pt-2">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-7">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-ink">
              👩🏾‍🏫 Vous êtes enseignant(e) ?
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Rejoignez les tuteurs de Togo Academy : séances rémunérées, vous
              choisissez vos matières et vos disponibilités.
            </p>
          </div>
          <Button href="/devenir-tuteur" variant="secondary">
            Devenir tuteur
          </Button>
        </Card>
      </Container>
    </>
  );
}
