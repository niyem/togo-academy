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
import { subjectPrice, inspectorSubjectPrice } from "@/lib/production/bareme";
import {
  assignConcepteur,
  assignInspector,
  unassignInspector,
  startVideoQA,
  publishModule,
  closeCollaboration,
  reopenCycle,
  type CollabState,
} from "@/lib/collab/actions";

export type Person = { id: string; name: string };
export type Concepteur = Person;
export type Module = {
  slug: string;
  title: string;
  classSlug: string;
  className: string;
  subjectKey: string;
  subjectName: string;
  tracked: boolean;
};

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
  inspectors: Person[]; // inspecteurs attribues (comptes)
  costXof: number | null;
  inspectorCostXof: number | null;
  videoUrl: string | null;
  locked: boolean;
  videoReviews: { by: string; decision: string; comment: string }[];
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

function InspectorAssign({ row, inspectors }: { row: ProdRow; inspectors: Person[] }) {
  const [addState, addAction, addPending] = useActionState(assignInspector, collabInit);
  const [, removeAction] = useActionState(unassignInspector, collabInit);
  const assignedIds = new Set(row.inspectors.map((i) => i.id));
  const available = inspectors.filter((i) => !assignedIds.has(i.id));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-[var(--color-muted)]">
        Inspecteurs attribués :
      </span>
      {row.inspectors.length === 0 && (
        <span className="text-xs text-[var(--color-muted)]">aucun</span>
      )}
      {row.inspectors.map((ins) => (
        <form key={ins.id} action={removeAction} className="inline-flex">
          <input type="hidden" name="chapter_id" value={row.moduleId} />
          <input type="hidden" name="inspector_id" value={ins.id} />
          <button
            type="submit"
            title="Retirer"
            className="inline-flex items-center gap-1 rounded-full bg-togo-green-100 px-2.5 py-1 text-xs font-semibold text-togo-green-700 hover:bg-togo-red-100 hover:text-togo-red-700"
          >
            {ins.name} ✕
          </button>
        </form>
      ))}
      {available.length > 0 && (
        <form action={addAction} className="flex items-center gap-1">
          <input type="hidden" name="chapter_id" value={row.moduleId} />
          <select name="inspector_id" defaultValue="" className={input} required>
            <option value="" disabled>+ ajouter…</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={addPending}
            className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold hover:border-togo-green-500 disabled:opacity-40"
          >
            Attribuer
          </button>
        </form>
      )}
      {addState.error && <span className="text-xs text-togo-red-700">{addState.error}</span>}
    </div>
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
      <p className="text-xs text-[var(--color-muted)]">
        🔒 La rémunération suit le barème PAR MATIÈRE (montant forfaitaire pour
        toute la matière ; inspecteur = 50 %). Elle est gérée uniquement par
        l&apos;administration et n&apos;est jamais visible par les contributeurs.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Inspecteur (note libre, facultatif)
          <input name="inspector_name" defaultValue={row.inspector ?? ""} className={`${input} mt-1 w-full`} />
        </label>
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          Notes internes
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

function RemoveForm({ moduleId, title }: { moduleId: string; title: string }) {
  const [, action, pending] = useActionState(stopTracking, initial);
  return (
    <form action={action}>
      <input type="hidden" name="chapter_id" value={moduleId} />
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (
            !window.confirm(
              `Retirer « ${title} » de la chaîne de production ?\n\nLe module lui-même n'est pas supprimé du programme ; il est seulement retiré du suivi (attribution, versions et relectures liées seront perdues).`,
            )
          ) {
            e.preventDefault();
          }
        }}
        className="rounded-full border border-togo-red-200 px-3 py-1.5 text-xs font-semibold text-togo-red-700 hover:bg-togo-red-50 disabled:opacity-40"
      >
        🗑 Retirer de la chaîne
      </button>
    </form>
  );
}

function VideoLockControls({ row }: { row: ProdRow }) {
  const [vs, vAction, vPending] = useActionState(startVideoQA, collabInit);
  const [ps, pAction, pPending] = useActionState(publishModule, collabInit);
  const [, cAction] = useActionState(closeCollaboration, collabInit);
  const [, rAction] = useActionState(reopenCycle, collabInit);
  const afterProd = ["en_production", "verification", "en_ligne"].includes(row.stage);

  if (row.locked) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-togo-green-100 bg-togo-green-50 p-3">
        <Badge tone="green">🔒 Verrouillé — sous contrôle exclusif de l&apos;administration</Badge>
        <form action={rAction}>
          <input type="hidden" name="chapter_id" value={row.moduleId} />
          <button
            type="submit"
            onClick={(e) => { if (!window.confirm("Rouvrir un cycle de révision ? Le concepteur retrouvera l'accès au module.")) e.preventDefault(); }}
            className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold hover:border-togo-green-500"
          >
            🔓 Rouvrir un cycle
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-togo-green-100 bg-white p-3">
      <div className="text-xs font-bold uppercase tracking-widest text-togo-green-700">
        Vidéo & clôture
      </div>
      {afterProd && (
        <form action={vAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="chapter_id" value={row.moduleId} />
          <input
            name="video_url"
            defaultValue={row.videoUrl ?? ""}
            placeholder="Lien de la vidéo produite"
            className={`${input} min-w-0 flex-1`}
          />
          <button type="submit" disabled={vPending} className="rounded-full bg-togo-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
            Envoyer en vérification
          </button>
          {vs.error && <span className="text-xs text-togo-red-700">{vs.error}</span>}
        </form>
      )}
      {row.videoUrl && (
        <a href={row.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-togo-green-700 hover:underline">
          ▶ Voir la vidéo attachée
        </a>
      )}
      {row.videoReviews.length > 0 && (
        <div className="space-y-1">
          {row.videoReviews.map((r, i) => (
            <div key={i} className="text-xs">
              <Badge tone={r.decision === "approved" ? "green" : "yellow"}>
                {r.by} · {r.decision === "approved" ? "Validé" : "Erreur signalée"}
              </Badge>{" "}
              <span className="text-[var(--color-muted)]">{r.comment}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {row.stage === "verification" && (
          <form action={pAction}>
            <input type="hidden" name="chapter_id" value={row.moduleId} />
            <button type="submit" disabled={pPending} className="rounded-full bg-togo-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
              ✅ Publier (en ligne)
            </button>
          </form>
        )}
        {row.stage === "en_ligne" && (
          <form action={cAction}>
            <input type="hidden" name="chapter_id" value={row.moduleId} />
            <button
              type="submit"
              onClick={(e) => { if (!window.confirm("Clôturer et verrouiller ce module ? Le concepteur et les inspecteurs perdront tout droit d'accès et de modification ; le contenu passera sous contrôle exclusif de l'administration.")) e.preventDefault(); }}
              className="rounded-full border border-togo-red-200 px-3 py-1.5 text-xs font-semibold text-togo-red-700 hover:bg-togo-red-50"
            >
              🔒 Clôturer et verrouiller
            </button>
          </form>
        )}
        {ps.error && <span className="text-xs text-togo-red-700">{ps.error}</span>}
      </div>
    </div>
  );
}

function Row({
  row,
  concepteurs,
  inspectors,
}: {
  row: ProdRow;
  concepteurs: Concepteur[];
  inspectors: Person[];
}) {
  const [open, setOpen] = useState(false);
  const matiere = subjectPrice(row.classSlug); // prix forfaitaire de la matiere
  const insp = inspectorSubjectPrice(row.classSlug);
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
          {matiere == null ? (
            <div className="text-sm font-semibold text-[var(--color-muted)]">tarif à définir</div>
          ) : (
            <>
              <div className="text-sm font-bold text-togo-green-700">{fmt(matiere)} FCFA</div>
              <div className="text-[11px] text-[var(--color-muted)]">
                matière entière (tous les modules)
              </div>
              {insp != null && (
                <div className="text-[11px] text-[var(--color-muted)]">inspecteur {fmt(insp)}</div>
              )}
            </>
          )}
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
          <RemoveForm moduleId={row.moduleId} title={row.title} />
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        <AssignForm row={row} concepteurs={concepteurs} />
        <InspectorAssign row={row} inspectors={inspectors} />
      </div>
      <VideoLockControls row={row} />
      {open && <EditPanel row={row} />}
    </li>
  );
}

function AddForm({ modules, concepteurs }: { modules: Module[]; concepteurs: Concepteur[] }) {
  const [state, action, pending] = useActionState(startTracking, initial);
  const [cls, setCls] = useState("");
  // Classes uniques dans l'ordre d'apparition (deja triees par ordre scolaire).
  const classes: { slug: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const m of modules) {
    if (!seen.has(m.classSlug)) {
      seen.add(m.classSlug);
      classes.push({ slug: m.classSlug, name: m.className });
    }
  }
  const filtered = cls ? modules.filter((m) => m.classSlug === cls) : [];
  // Regroupe les modules par matiere (cluster) pour s'y retrouver.
  const groups: { name: string; items: Module[] }[] = [];
  const gIdx = new Map<string, number>();
  for (const m of filtered) {
    if (!gIdx.has(m.subjectKey)) {
      gIdx.set(m.subjectKey, groups.length);
      groups.push({ name: m.subjectName, items: [] });
    }
    groups[gIdx.get(m.subjectKey)!].items.push(m);
  }
  groups.sort((a, b) => a.name.localeCompare(b.name));
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          1. Classe
          <select value={cls} onChange={(e) => setCls(e.target.value)} className={`${input} mt-1 w-full`}>
            <option value="">— choisir —</option>
            {classes.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          2. Module
          <select name="slug" required disabled={!cls} className={`${input} mt-1 w-full`}>
            <option value="">{cls ? "— choisir —" : "choisir une classe"}</option>
            {groups.map((g) => (
              <optgroup key={g.name} label={g.name}>
                {g.items.map((m) => (
                  <option key={m.slug} value={m.slug} disabled={m.tracked}>
                    {m.title}{m.tracked ? " (déjà suivi)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--color-muted)]">
          3. Concepteur (enseignant)
          <select name="concepteur_id" className={`${input} mt-1 w-full`}>
            <option value="">— attribuer plus tard —</option>
            {concepteurs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Ajout..." : "Ajouter et attribuer ce module"}
        </button>
        {concepteurs.length === 0 && (
          <span className="text-xs text-togo-red-700">
            Aucun concepteur approuvé — approuvez d&apos;abord une candidature.
          </span>
        )}
        {state.ok && <span className="text-sm font-medium text-togo-green-700">✓ Ajouté.</span>}
        {state.error && <span className="text-sm text-togo-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

export function ProductionBoard({
  rows,
  concepteurs,
  inspectors,
  modules,
}: {
  rows: ProdRow[];
  concepteurs: Concepteur[];
  inspectors: Person[];
  modules: Module[];
}) {
  const published = rows.filter((r) => r.atEnLigne);
  const avgDays = published.length
    ? Math.round(
        published.reduce((s, r) => s + daysBetween(r.createdAt, r.atEnLigne), 0) /
          published.length,
      )
    : null;
  // Coût = somme des MATIERES distinctes (subject x classe) au forfait, pas
  // par module (une matiere = un seul prix, quel que soit le nombre de modules).
  const seenMatiere = new Set<string>();
  let totalCost = 0;
  for (const r of rows) {
    const k = `${r.subjectKey}|${r.classSlug}`;
    if (seenMatiere.has(k)) continue;
    seenMatiere.add(k);
    totalCost += subjectPrice(r.classSlug) ?? 0;
  }
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
        <h2 className="font-bold">➕ Attribuer un module à un concepteur</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Choisissez une classe, puis le module (ex. « PHY 1 »), puis
          l&apos;enseignant qui le développera. Il apparaîtra aussitôt dans son
          espace. (Vous pouvez aussi attribuer plus tard depuis la ligne du module.)
        </p>
        <div className="mt-3">
          <AddForm modules={modules} concepteurs={concepteurs} />
        </div>
      </div>

      <ul className="divide-y divide-[var(--color-line)]">
        {rows.map((r) => (
          <Row key={r.moduleId} row={r} concepteurs={concepteurs} inspectors={inspectors} />
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
