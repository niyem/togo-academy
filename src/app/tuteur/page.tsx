import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClasses, getSubjects } from "@/lib/content";
import { TutorProfileForm, SessionActions } from "@/components/tutor/forms";

export const metadata: Metadata = { title: "Espace tuteur" };

const statusBadge: Record<
  string,
  { label: string; tone: "green" | "yellow" | "red" | "neutral" }
> = {
  requested: { label: "En attente", tone: "yellow" },
  accepted: { label: "Acceptée", tone: "green" },
  declined: { label: "Refusée", tone: "neutral" },
  cancelled: { label: "Annulée", tone: "neutral" },
  completed: { label: "Terminée", tone: "green" },
};

export default async function TutorSpacePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("tutor_profiles")
    .select(
      "status,headline,bio,availability,phone,rate_xof,subject_keys,class_slugs",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // Pas de candidature : inviter a postuler.
  if (!profile) {
    return (
      <Section>
        <Container className="max-w-lg">
          <Card>
            <h1 className="text-2xl font-extrabold">Espace tuteur</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Vous n&apos;avez pas encore de profil tuteur. Postulez pour donner
              des séances aux élèves.
            </p>
            <Button href="/devenir-tuteur" className="mt-4">
              Devenir tuteur
            </Button>
          </Card>
        </Container>
      </Section>
    );
  }

  if (profile.status !== "approved") {
    const pending = profile.status === "pending";
    return (
      <Section>
        <Container className="max-w-lg">
          <Card className={pending ? "bg-togo-yellow-100/60" : ""}>
            <h1 className="text-2xl font-extrabold">Espace tuteur</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {pending
                ? "Votre candidature est en cours d'examen. Vous aurez accès à votre espace dès qu'elle sera validée."
                : "Votre candidature n'a pas été retenue pour le moment. Contactez-nous pour en savoir plus."}
            </p>
            <Button href="/tableau-de-bord" variant="secondary" className="mt-4">
              Mon tableau de bord
            </Button>
          </Card>
        </Container>
      </Section>
    );
  }

  // Tuteur approuve : profil editable + demandes de seance.
  const [subjects, classes, { data: sessions }] = await Promise.all([
    getSubjects(),
    getClasses(),
    supabase
      .from("tutor_sessions")
      .select(
        "id,subject_key,class_slug,message,preferred_time,status,created_at,student:profiles!student_id(full_name,phone)",
      )
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const subjectName = new Map(subjects.map((s) => [s.key, s.name]));
  const className = new Map(classes.map((c) => [c.slug, c.name]));
  const subjectOpts = subjects.map((s) => ({ value: s.key, label: s.name }));
  const classOpts = classes
    .filter((c) => c.track === "general")
    .map((c) => ({ value: c.slug, label: c.name }));

  const rows = sessions ?? [];
  const pendingCount = rows.filter((s) => s.status === "requested").length;

  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-extrabold">Espace tuteur</h1>
        <p className="text-[var(--color-muted)]">
          Gérez votre profil et répondez aux demandes de séance.
        </p>

        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Demandes de séance</h2>
            <Badge tone={pendingCount ? "yellow" : "green"}>
              {pendingCount} en attente
            </Badge>
          </div>
          <ul className="mt-3 divide-y divide-[var(--color-line)]">
            {rows.map((s) => {
              const student = s.student as unknown as {
                full_name: string | null;
                phone: string | null;
              } | null;
              const b = statusBadge[s.status] ?? statusBadge.requested;
              return (
                <li key={s.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {student?.full_name ?? "Élève"}
                      {s.subject_key && (
                        <span className="text-[var(--color-muted)]">
                          {" "}
                          · {subjectName.get(s.subject_key) ?? s.subject_key}
                        </span>
                      )}
                      {s.class_slug && (
                        <span className="text-[var(--color-muted)]">
                          {" "}
                          ({className.get(s.class_slug) ?? s.class_slug})
                        </span>
                      )}
                    </span>
                    <Badge tone={b.tone}>{b.label}</Badge>
                  </div>
                  {s.preferred_time && (
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Créneau souhaité : {s.preferred_time}
                    </p>
                  )}
                  {s.message && (
                    <p className="mt-1 text-sm text-ink">« {s.message} »</p>
                  )}
                  {s.status === "accepted" && student?.phone && (
                    <p className="mt-1 text-sm text-togo-green-700">
                      Contact : {student.phone}
                    </p>
                  )}
                  {s.status === "requested" && (
                    <div className="mt-2">
                      <SessionActions id={s.id} />
                    </div>
                  )}
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="py-3 text-sm text-[var(--color-muted)]">
                Aucune demande pour l&apos;instant.
              </li>
            )}
          </ul>
        </Card>

        <Card className="mt-6">
          <h2 className="font-bold">Mon profil</h2>
          <p className="mb-4 text-xs text-[var(--color-muted)]">
            Ces informations sont visibles par les élèves sur la page Tutorat.
          </p>
          <TutorProfileForm
            profile={profile}
            subjects={subjectOpts}
            classes={classOpts}
          />
        </Card>

        <p className="mt-4 text-center text-sm">
          <Link href="/tutorat" className="text-togo-green-700 hover:underline">
            Voir la page Tutorat
          </Link>
        </p>
      </Container>
    </Section>
  );
}
