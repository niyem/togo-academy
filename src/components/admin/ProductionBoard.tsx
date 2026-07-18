"use client";

// Tableau de bord editorial : suit chaque lecon dans la chaine de production et
// mesure le temps par lecon. Alimente le calcul de cout par le bareme.

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui";
import {
  startTracking,
  updateProduction,
  setStage,
  stopTracking,
  type ProdState,
} from "@/lib/production/actions";
import {
  STAGES,
  STAGE_LABEL,
  STAGE_TONE,
  nextStage,
  type Stage,
} from "@/lib/production/stages";
import { lessonPrice, inspectorPrice } from "@/lib/production/bareme";

export type ProdRow = {
  lessonId: string;
  title: string;
  slug: string;
  chapterTitle: string;
  classSlug: string;
  subjectKey: string;
  stage: Stage;
  mode: "creation" | "adaptation";
  teacher: string | null;
  inspector: string | null;
  n_examples: number;
  n_exercises: number;
  n_figures: number;
  n_quiz: number;
  costXof: number | null;
  createdAt: string;
  atEnLigne: string | null;
};

const initial: ProdState = {};
const input =
  "rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none";
const fmt = (n: number) => n.toLocaleString("fr-FR");

function daysBetween(a: string, b: string | null): number {
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(a).getTime()) / 86400000));
}

function StageForm({ row }: { row: ProdRow }) {
  const [state, action, pending] = useActionState(setStage, initial);
  const next = nextStage(row.stage);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && (
        <form action={action}>
          <input type="hidden" name="lesson_id" value={row.lessonId} />
          <input type="hidden" name="stage" value={next} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-togo-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            → {STAGE_LABEL[next]}
          </button>
        </form>
      )}
      <form action={action} className="flex items-center gap-1">
        <input type="hidden" name="lesson_id" value={row.lessonId} />
        <select name="stage" defaultValue={row.stage} className={input}>
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold hover:border-togo-green-500 disabled:opacity-40"
        >
          Fixer
        </button>
      </form>
      {state.error && (
        <span className="text-xs text-togo-red-700">{state.error}</span>
      )}
    </div>
  );
}

function EditPanel({ row }: { row: ProdRow }) {
  const [state, action, pending] = useActionState(updateProduction, initial);
  return (
    <form action={action} className="mt-3 space-y-3 border-t border-[var(--color-line)] pt-3">
      <input type="hidden" name="lesson_id" value={row.lessonId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Enseignant
          <input name="teacher_name" defaultValue={row.teacher ?? ""} className={`${input} mt-1 w-full`} />
        </label>
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Inspecteur
          <input name="inspector_name" defaultValue={row.inspector ?? ""} className={`${input} mt-1 w-full`} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["n_examples", "Exemples", row.n_examples],
            ["n_exercises", "Exercices", row.n_exercises],
            ["n_figures", "Figures", row.n_figures],
            ["n_quiz", "Quiz (Q)", row.n_quiz],
          ] as const
        ).map(([name, label, val]) => (
          <label key={name} className="text-xs font-semibold text-[var(--color-muted)]">
            {label}
            <input
              type="number"
              min={0}
              name={name}
              defaultValue={val}
              className={`${input} mt-1 w-full`}
            />
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Coût final retenu (FCFA, vide = prix de la classe)
          <input
            type="number"
            min={0}
            name="cost_xof"
            defaultValue={row.costXof ?? ""}
            className={`${input} mt-1 w-full`}
          />
        </label>
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Notes
          <input name="notes" className={`${input} mt-1 w-full`} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {state.ok && <span className="text-xs font-medium text-togo-green-700">✓ Enregistré.</span>}
        {state.error && <span className="text-xs text-togo-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

function RemoveForm({ lessonId }: { lessonId: string }) {
  const [, action, pending] = useActionState(stopTracking, initial);
  return (
    <form action={action}>
      <input type="hidden" name="lesson_id" value={lessonId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-[var(--color-muted)] hover:text-togo-red-700 disabled:opacity-40"
      >
        Retirer du suivi
      </button>
    </form>
  );
}

function Row({ row }: { row: ProdRow }) {
  const [open, setOpen] = useState(false);
  const suggested = lessonPrice(row.classSlug);
  const insp = inspectorPrice(row.classSlug);
  const days = daysBetween(row.createdAt, row.atEnLigne);
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STAGE_TONE[row.stage]}>{STAGE_LABEL[row.stage]}</Badge>
            <span className="font-semibold">{row.title}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            [{row.classSlug}] {row.chapterTitle} · {row.subjectKey}
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            Enseignant : {row.teacher ?? "—"} · Inspecteur : {row.inspector ?? "—"} ·{" "}
            {row.atEnLigne ? `${days} j au total` : `${days} j en cours`}
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            {row.n_examples} ex. résolus · {row.n_exercises} exercices ·{" "}
            {row.n_figures} figures · {row.n_quiz} Q quiz
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-togo-green-700">
            {fmt(row.costXof ?? suggested)} FCFA
          </div>
          <div className="text-[11px] text-[var(--color-muted)]">
            {row.costXof != null
              ? `grille : ${fmt(suggested)}`
              : "prix de la classe"}
          </div>
          <div className="text-[11px] text-[var(--color-muted)]">
            inspecteur ~ {fmt(insp)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <StageForm row={row} />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-semibold text-togo-green-700 hover:underline"
          >
            {open ? "Fermer" : "Modifier"}
          </button>
          <RemoveForm lessonId={row.lessonId} />
        </div>
      </div>
      {open && <EditPanel row={row} />}
    </li>
  );
}

function AddForm() {
  const [state, action, pending] = useActionState(startTracking, initial);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="slug" required placeholder="Slug de la leçon" className={input} />
        <input name="teacher_name" placeholder="Enseignant" className={input} />
        <input name="inspector_name" placeholder="Inspecteur" className={input} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Ajout..." : "Suivre cette leçon"}
        </button>
        {state.ok && <span className="text-sm font-medium text-togo-green-700">✓ Ajoutée.</span>}
        {state.error && <span className="text-sm text-togo-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

export function ProductionBoard({ rows }: { rows: ProdRow[] }) {
  const published = rows.filter((r) => r.atEnLigne);
  const avgDays = published.length
    ? Math.round(
        published.reduce((s, r) => s + daysBetween(r.createdAt, r.atEnLigne), 0) /
          published.length,
      )
    : null;
  const totalCost = rows.reduce(
    (s, r) => s + (r.costXof ?? lessonPrice(r.classSlug)),
    0,
  );
  const perStage = STAGES.map((s) => ({
    ...s,
    count: rows.filter((r) => r.stage === s.key).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-green-600">{rows.length}</div>
          <div className="text-xs text-[var(--color-muted)]">leçons suivies</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-green-600">{published.length}</div>
          <div className="text-xs text-[var(--color-muted)]">en ligne</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-green-600">
            {avgDays == null ? "—" : `${avgDays} j`}
          </div>
          <div className="text-xs text-[var(--color-muted)]">temps moyen / leçon</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-green-600">{fmt(totalCost)}</div>
          <div className="text-xs text-[var(--color-muted)]">coût total (FCFA)</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {perStage.map((s) => (
          <Badge key={s.key} tone={s.count ? s.tone : "neutral"}>
            {s.label} : {s.count}
          </Badge>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-togo-green-50 p-5">
        <h2 className="font-bold">➕ Suivre une nouvelle leçon</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Entre le slug d&apos;une leçon existante pour la faire entrer dans la
          chaîne de production.
        </p>
        <div className="mt-3">
          <AddForm />
        </div>
      </div>

      <ul className="divide-y divide-[var(--color-line)]">
        {rows.map((r) => (
          <Row key={r.lessonId} row={r} />
        ))}
        {rows.length === 0 && (
          <li className="py-6 text-sm text-[var(--color-muted)]">
            Aucune leçon suivie pour l&apos;instant. Ajoute-en une ci-dessus pour
            lancer le pilote.
          </li>
        )}
      </ul>
    </div>
  );
}
