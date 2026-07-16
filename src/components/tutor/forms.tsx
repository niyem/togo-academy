"use client";

// Formulaires client du tutorat en direct.

import { useActionState } from "react";
import { Button } from "@/components/ui";
import {
  applyAsTutor,
  updateTutorProfile,
  requestSession,
  respondSession,
  reviewTutor,
  type TutorState,
} from "@/lib/tutor/actions";

type Opt = { value: string; label: string };

const input =
  "w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-togo-green-500";
const label = "mb-1.5 block text-sm font-medium text-ink";

function CheckGroup({
  name,
  options,
  selected = [],
}: {
  name: string;
  options: Opt[];
  selected?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm has-[:checked]:border-togo-green-500 has-[:checked]:bg-togo-green-50"
        >
          <input
            type="checkbox"
            name={name}
            value={o.value}
            defaultChecked={selected.includes(o.value)}
            className="accent-togo-green-600"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Err({ state }: { state: TutorState }) {
  if (!state.error) return null;
  return (
    <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
      {state.error}
    </p>
  );
}

export function TutorApplicationForm({
  subjects,
  classes,
}: {
  subjects: Opt[];
  classes: Opt[];
}) {
  const [state, action, pending] = useActionState<TutorState, FormData>(
    applyAsTutor,
    {},
  );
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Nom complet</label>
          <input name="name" required className={input} />
        </div>
        <div>
          <label className={label}>Téléphone</label>
          <input name="phone" className={input} placeholder="+228 ..." />
        </div>
        <div>
          <label className={label}>Adresse e-mail</label>
          <input name="email" type="email" required className={input} />
        </div>
        <div>
          <label className={label}>Mot de passe</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className={input}
            placeholder="Au moins 8 caractères"
          />
        </div>
      </div>

      <div>
        <label className={label}>Matières enseignées</label>
        <CheckGroup name="subjects" options={subjects} />
      </div>
      <div>
        <label className={label}>Classes couvertes</label>
        <CheckGroup name="classes" options={classes} />
      </div>

      <div>
        <label className={label}>Accroche (une phrase)</label>
        <input
          name="headline"
          className={input}
          placeholder="Ex : Professeur de maths, 8 ans d'expérience au collège."
        />
      </div>
      <div>
        <label className={label}>Présentation</label>
        <textarea name="bio" rows={4} className={input} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Disponibilités</label>
          <input
            name="availability"
            className={input}
            placeholder="Ex : soirs en semaine, week-end"
          />
        </div>
        <div>
          <label className={label}>Tarif indicatif / séance (FCFA)</label>
          <input name="rate" type="number" className={input} />
        </div>
      </div>

      <div className="rounded-xl border border-togo-green-100 bg-white p-4">
        <p className="text-sm font-semibold">Pièces justificatives</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Obligatoires pour valider votre candidature. PDF, Word, JPG ou PNG
          (8 Mo max par fichier).
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>CV</label>
            <input
              name="cv"
              type="file"
              required
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-togo-green-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-togo-green-700"
            />
          </div>
          <div>
            <label className={label}>Justificatif d&apos;emploi</label>
            <input
              name="proof"
              type="file"
              required
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-togo-green-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-togo-green-700"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Attestation de travail, contrat ou bulletin de salaire.
            </p>
          </div>
        </div>
      </div>

      <Err state={state} />
      <Button type="submit" className="w-fit">
        {pending ? "Envoi..." : "Envoyer ma candidature"}
      </Button>
      <p className="text-xs text-[var(--color-muted)]">
        Votre candidature est examinée par l&apos;équipe avant publication.
      </p>
    </form>
  );
}

export function TutorProfileForm({
  profile,
  subjects,
  classes,
}: {
  profile: {
    headline?: string | null;
    bio?: string | null;
    availability?: string | null;
    phone?: string | null;
    rate_xof?: number | null;
    subject_keys?: string[];
    class_slugs?: string[];
  };
  subjects: Opt[];
  classes: Opt[];
}) {
  const [state, action, pending] = useActionState<TutorState, FormData>(
    updateTutorProfile,
    {},
  );
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className={label}>Matières enseignées</label>
        <CheckGroup
          name="subjects"
          options={subjects}
          selected={profile.subject_keys ?? []}
        />
      </div>
      <div>
        <label className={label}>Classes couvertes</label>
        <CheckGroup
          name="classes"
          options={classes}
          selected={profile.class_slugs ?? []}
        />
      </div>
      <div>
        <label className={label}>Accroche</label>
        <input
          name="headline"
          defaultValue={profile.headline ?? ""}
          className={input}
        />
      </div>
      <div>
        <label className={label}>Présentation</label>
        <textarea
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          className={input}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>Disponibilités</label>
          <input
            name="availability"
            defaultValue={profile.availability ?? ""}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Téléphone</label>
          <input
            name="phone"
            defaultValue={profile.phone ?? ""}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Tarif / séance (FCFA)</label>
          <input
            name="rate"
            type="number"
            defaultValue={profile.rate_xof ?? ""}
            className={input}
          />
        </div>
      </div>
      <Err state={state} />
      <div className="flex items-center gap-3">
        <Button type="submit" className="w-fit">
          {pending ? "..." : "Enregistrer"}
        </Button>
        {state.ok && (
          <span className="text-sm text-togo-green-700">Enregistré.</span>
        )}
      </div>
    </form>
  );
}

export function BookTutorForm({
  tutorId,
  subjects,
  classes,
}: {
  tutorId: string;
  subjects: Opt[];
  classes: Opt[];
}) {
  const [state, action, pending] = useActionState<TutorState, FormData>(
    requestSession,
    {},
  );
  if (state.ok) {
    return (
      <p className="rounded-lg bg-togo-green-50 px-3 py-2 text-sm text-togo-green-700">
        Demande envoyée. Le tuteur vous répondra bientôt.
      </p>
    );
  }
  return (
    <form action={action} className="mt-3 grid gap-3">
      <input type="hidden" name="tutor_id" value={tutorId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="subject" className={input} defaultValue="">
          <option value="" disabled>
            Matière
          </option>
          {subjects.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select name="class" className={input} defaultValue="">
          <option value="" disabled>
            Classe
          </option>
          {classes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <input
        name="preferred_time"
        className={input}
        placeholder="Créneau souhaité (ex : samedi après-midi)"
      />
      <textarea
        name="message"
        rows={2}
        className={input}
        placeholder="Votre besoin en quelques mots"
      />
      <Err state={state} />
      <Button type="submit" className="w-fit">
        {pending ? "Envoi..." : "Demander une séance"}
      </Button>
    </form>
  );
}

export function SessionActions({ id }: { id: string }) {
  const [state, action, pending] = useActionState<TutorState, FormData>(
    respondSession,
    {},
  );
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        name="decision"
        value="accepted"
        disabled={pending}
        className="rounded-lg bg-togo-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-togo-green-700"
      >
        Accepter
      </button>
      <button
        name="decision"
        value="declined"
        disabled={pending}
        className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--color-line)]"
      >
        Refuser
      </button>
      {state.error && (
        <span className="text-xs text-togo-red-700">{state.error}</span>
      )}
    </form>
  );
}

export function TutorReview({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<TutorState, FormData>(
    reviewTutor,
    {},
  );
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <button
        name="decision"
        value="approved"
        disabled={pending}
        className="rounded-lg bg-togo-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-togo-green-700"
      >
        Approuver
      </button>
      <button
        name="decision"
        value="rejected"
        disabled={pending}
        className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--color-line)]"
      >
        Refuser
      </button>
      {state.error && (
        <span className="text-xs text-togo-red-700">{state.error}</span>
      )}
    </form>
  );
}
