"use client";

// Tableau de bord editorial : suit chaque MODULE (chapitre) dans la chaine de
// production, mesure le temps par module et estime le cout par le bareme (prix
// de la classe). Un module contient plusieurs lecons/capacites.

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
import { modulePrice, inspectorPrice } from "@/lib/production/bareme";
import { assignConcepteur, type CollabState } from "@/lib/collab/actions";

export type Concepteur = { id: string; name: string };

export type ProdRow = {
  moduleId: string; // chapter_id
  title: string; // titre du module (chapitre)
  slug: string;
  subjectKey: string;
  classSlug: string;
  lessonCount: number;
  stage: Stage;
  inspector: string | null;
  concepteurId: string | null;
  concepteurName: string | null;
  costXof: number | null;
  createdAt: string;
  atEnLigne: string | null;
};

const initial: ProdState = {};
const collabInit: CollabState = {};
const input =
  "rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none";
const fmt = (n: number) => n.toLocaleString("fr-FR");

function daysBetween(a: string, b: string | null): number {
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(a).getTime()) / 86400000));
}

function AssignForm({ row, concepteurs }: { row: ProdRow; concepteurs: Concepteur[] }) {
  const [state, action, pending] = useActionState(assignConcepteur, collabInit);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="chapter_id" value={row.moduleId} />
      <label className="text-xs font-semibold text-[var(--color-muted)]">
        Concepteur attribué
      </label>
      <select name="concepteur_id" defaultValue={row.concepteurId ?? ""} className={input}>
        <option value="">— Aucun —</option>
        {concepteurs.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold hover:border-togo-green-500 disabled:opacity-40"
      >
        Attribuer
      </button>
      {state.ok && <span className="text-xs text-togo-green-700">✓</span>}
      {state.error && <span className="text-xs text-togo-red-700">{state.error}</span>}
    </form>
  );
}

function StageForm({ row }: { row: ProdRow }) {
  const [state, action, pending] = useActionState(setStage, initial);
  const next = nextStage(row.stage);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && (
        <form action={action}>
          <input type="hidden" name="chapter_id" value={row.moduleId} />
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
        <input type="hidden" name="chapter_id" value={row.moduleId} />
        <select name="stage" defaultValue={row.stage} className={input}>
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
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
      {state.error && <span className="text-xs text-togo-red-700">{state.error}</span>}
    </div>
  );
}

function EditPanel({ row }: { row: ProdRow }) {
  const [state, action, pending] = useActionState(updateProduction, initial);
  return (
    <form action={action} className="mt-3 space-y-3 border-t border-[var(--color-line)] pt-3">
      <input type="hidden" name="chapter_id" value={row.moduleId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Inspecteur (nom)
          <input name="inspector_name" defaultValue={row.inspector ?? ""} className={`${input} mt-1 w-full`} />
        </label>
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Coût final retenu (FCFA, vide = prix de la classe)
          <input type="number" min={0} name="cost_xof" defaultValue={row.costXof ?? ""} className={`${input} mt-1 w-full`} />
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

function RemoveForm({ moduleId }: { moduleId: string }) {
  const [, action, pending] = useActionState(stopTracking, initial);
  return (
    <form action={action}>
      <input type="hidden" name="chapter_id" value={moduleId} />
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

function Row({ row, concepteurs }: { row: ProdRow; concepteurs: Concepteur[] }) {
  const [open, setOpen] = useState(false);
  const suggested = modulePrice(row.classSlug);
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
            [{row.classSlug}] {row.subjectKey} · {row.lessonCount} leçon(s) dans le module
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            Concepteur : {row.concepteurName ?? "non attribué"} · Inspecteur : {row.inspector ?? "—"} ·{" "}
            {row.atEnLigne ? `${days} j au total` : `${days} j en cours`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-togo-green-700">
            {fmt(row.costXof ?? suggested)} FCFA
          </div>
          <div className="text-[11px] text-[var(--color-muted)]">
            {row.costXof != null ? `grille : ${fmt(suggested)}` : "prix du module"}
          </div>
          <div className="text-[11px] text-[var(--color-muted)]">inspecteur ~ {fmt(insp)}</div>
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
          <RemoveForm moduleId={row.moduleId} />
        </div>
      </div>
      <div className="mt-2">
        <AssignForm row={row} concepteurs={concepteurs} />
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
        <input name="slug" required placeholder="Slug du module (chapitre)" className={input} />
        <input name="inspector_name" placeholder="Inspecteur (facultatif)" className={input} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Ajout..." : "Suivre ce module"}
        </button>
        {state.ok && <span className="text-sm font-medium text-togo-green-700">✓ Ajouté.</span>}
        {state.error && <span className="text-sm text-togo-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

export function ProductionBoard({
  rows,
  concepteurs,
}: {
  rows: ProdRow[];
  concepteurs: Concepteur[];
}) {
  const published = rows.filter((r) => r.atEnLigne);
  const avgDays = published.length
    ? Math.round(
        published.reduce((s, r) => s + daysBetween(r.createdAt, r.atEnLigne), 0) /
          published.length,
      )
    : null;
  const totalCost = rows.reduce(
    (s, r) => s + (r.costXof ?? modulePrice(r.classSlug)),
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
          <div className="text-xs text-[var(--color-muted)]">modules suivis</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-green-600">{published.length}</div>
          <div className="text-xs text-[var(--color-muted)]">en ligne</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-green-600">
            {avgDays == null ? "—" : `${avgDays} j`}
          </div>
          <div className="text-xs text-[var(--color-muted)]">temps moyen / module</div>
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
        <h2 className="font-bold">➕ Suivre un nouveau module</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Entre le slug d&apos;un module (chapitre, ex. « PHY 1 ») pour le faire
          entrer dans la chaîne de production.
        </p>
        <div className="mt-3">
          <AddForm />
        </div>
      </div>

      <ul className="divide-y divide-[var(--color-line)]">
        {rows.map((r) => (
          <Row key={r.moduleId} row={r} concepteurs={concepteurs} />
        ))}
        {rows.length === 0 && (
          <li className="py-6 text-sm text-[var(--color-muted)]">
            Aucun module suivi pour l&apos;instant. Ajoute-en un ci-dessus pour
            lancer le pilote.
          </li>
        )}
      </ul>
    </div>
  );
}
