"use client";

// Formulaires de l'espace enseignant (metadonnees, activites, statut).

import { useActionState } from "react";
import {
  deleteActivity,
  saveActivity,
  saveLessonMeta,
  setLessonStatus,
  type TeacherState,
} from "@/lib/teacher/actions";
import type { Activity } from "@/lib/content/types";

const input =
  "w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500";
const label = "mb-1 block text-sm font-semibold";
const btn =
  "rounded-full bg-togo-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50";

function Feedback({ state }: { state: TeacherState }) {
  if (state.error)
    return (
      <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className="rounded-lg border border-togo-green-100 bg-white px-3 py-2 text-sm text-togo-green-700">
        ✓ Enregistré
      </p>
    );
  return null;
}

export function LessonMetaForm({
  isNew,
  lesson,
  chapters,
}: {
  isNew: boolean;
  lesson?: {
    slug: string;
    title: string;
    summary: string | null;
    chapter_id: string;
    is_free_preview: boolean;
  };
  chapters: { id: string; title: string; class_slug: string }[];
}) {
  const [state, action, pending] = useActionState<TeacherState, FormData>(
    saveLessonMeta,
    {},
  );
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="is_new" value={isNew ? "1" : "0"} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Slug (URL)</label>
          <input
            name="slug"
            defaultValue={lesson?.slug}
            readOnly={!isNew}
            placeholder="ma-nouvelle-lecon"
            className={input + (!isNew ? " bg-togo-green-50/50" : "")}
            required
          />
        </div>
        <div>
          <label className={label}>Chapitre</label>
          <select
            name="chapter_id"
            defaultValue={lesson?.chapter_id ?? ""}
            className={input}
            required
          >
            <option value="" disabled>
              Choisir...
            </option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.class_slug}] {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Titre</label>
        <input name="title" defaultValue={lesson?.title} className={input} required />
      </div>
      <div>
        <label className={label}>Résumé</label>
        <textarea
          name="summary"
          defaultValue={lesson?.summary ?? ""}
          rows={2}
          className={input}
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          name="is_free_preview"
          defaultChecked={lesson?.is_free_preview}
        />
        Leçon d&apos;essai gratuite
      </label>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={btn + " w-fit"}>
        {pending ? "..." : isNew ? "Créer la leçon" : "Enregistrer"}
      </button>
    </form>
  );
}

export function StatusForm({
  slug,
  status,
  isAdmin,
}: {
  slug: string;
  status: string;
  isAdmin: boolean;
}) {
  const [state, action, pending] = useActionState<TeacherState, FormData>(
    setLessonStatus,
    {},
  );
  const options = [
    ["draft", "Brouillon"],
    ["in_review", "Soumettre à la revue"],
    ...(isAdmin ? [["published", "Publier ✓"]] : []),
  ];
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      {options.map(([value, text]) => (
        <button
          key={value}
          type="submit"
          name="status"
          value={value}
          disabled={pending || status === value}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold disabled:opacity-40 ${
            status === value
              ? "border-togo-green-500 bg-togo-green-50 text-togo-green-700"
              : "border-[var(--color-line)] hover:border-togo-green-500"
          }`}
        >
          {text}
        </button>
      ))}
      {!isAdmin && (
        <span className="text-xs text-[var(--color-muted)]">
          La publication finale est validée par l&apos;administration.
        </span>
      )}
      <Feedback state={state} />
    </form>
  );
}

export function ActivityForm({
  lessonSlug,
  activity,
}: {
  lessonSlug: string;
  activity?: Activity & { sortOrder?: number };
}) {
  const [state, action, pending] = useActionState<TeacherState, FormData>(
    saveActivity,
    {},
  );
  const isNew = !activity;
  return (
    <form
      action={action}
      className="grid gap-3 rounded-xl border border-[var(--color-line)] p-4"
    >
      <input type="hidden" name="lesson_slug" value={lessonSlug} />
      <input type="hidden" name="id" value={activity?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={label}>Type</label>
          <select name="type" defaultValue={activity?.type ?? "lecture"} className={input}>
            <option value="video">Vidéo</option>
            <option value="lecture">Cours écrit</option>
            <option value="exemple">Exemple résolu</option>
            <option value="exercice">Exercice</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Titre</label>
          <input name="title" defaultValue={activity?.title} className={input} required />
        </div>
      </div>
      <div>
        <label className={label}>Contenu (markdown simple : ## titre, **gras**)</label>
        <textarea name="body" defaultValue={activity?.body ?? ""} rows={5} className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Indice (exercice)</label>
          <input name="hint" defaultValue={activity?.hint ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>Solution (exercice / exemple)</label>
          <input name="solution" defaultValue={activity?.solution ?? ""} className={input} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Hébergeur vidéo</label>
          <select
            name="video_provider"
            defaultValue={activity?.videoProvider ?? ""}
            className={input}
          >
            <option value="">Aucun (placeholder)</option>
            <option value="youtube">YouTube (gratuit)</option>
            <option value="supabase">Supabase (payant)</option>
            <option value="bunny">Bunny</option>
            <option value="cloudflare">Cloudflare</option>
          </select>
        </div>
        <div>
          <label className={label}>Réf. vidéo (ID / URL)</label>
          <input name="video_ref" defaultValue={activity?.videoRef ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>Durée (sec)</label>
          <input
            name="duration_sec"
            type="number"
            defaultValue={activity?.durationSec ?? ""}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Ordre</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={activity?.sortOrder ?? 0}
            className={input}
          />
        </div>
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={btn + " w-fit"}>
        {pending ? "..." : isNew ? "Ajouter l'activité" : "Enregistrer"}
      </button>
    </form>
  );
}

export function DeleteActivityButton({
  id,
  lessonSlug,
}: {
  id: string;
  lessonSlug: string;
}) {
  const [, action, pending] = useActionState<TeacherState, FormData>(
    deleteActivity,
    {},
  );
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Supprimer cette activité ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lesson_slug" value={lessonSlug} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-togo-red-500 px-3 py-1 text-xs font-semibold text-togo-red-700 hover:bg-togo-red-100"
      >
        Supprimer
      </button>
    </form>
  );
}
