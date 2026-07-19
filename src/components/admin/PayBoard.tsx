"use client";

import { useActionState } from "react";
import { Badge, Card } from "@/components/ui";
import { markPaid, unmarkPaid, type CollabState } from "@/lib/collab/actions";

const initial: CollabState = {};
const fmt = (n: number) => n.toLocaleString("fr-FR");

export type PayEntry = {
  chapterId: string;
  title: string;
  className: string;
  amount: number;
  paid: boolean;
};
export type PayGroup = {
  payeeId: string;
  name: string;
  role: "concepteur" | "inspecteur";
  entries: PayEntry[];
};

function PayRow({ payeeId, role, e }: { payeeId: string; role: string; e: PayEntry }) {
  const [, payAction, payPending] = useActionState(markPaid, initial);
  const [, unpayAction] = useActionState(unmarkPaid, initial);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span>
        <span className="font-medium">{e.title}</span>
        <span className="ml-2 text-xs text-[var(--color-muted)]">[{e.className}]</span>
      </span>
      <span className="flex items-center gap-3">
        <span className="font-bold text-togo-green-700">{fmt(e.amount)} FCFA</span>
        {e.paid ? (
          <form action={unpayAction} className="flex items-center gap-2">
            <input type="hidden" name="chapter_id" value={e.chapterId} />
            <input type="hidden" name="payee_id" value={payeeId} />
            <input type="hidden" name="role" value={role} />
            <Badge tone="green">Payé ✓</Badge>
            <button type="submit" className="text-xs text-[var(--color-muted)] hover:text-togo-red-700">annuler</button>
          </form>
        ) : (
          <form action={payAction}>
            <input type="hidden" name="chapter_id" value={e.chapterId} />
            <input type="hidden" name="payee_id" value={payeeId} />
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="amount_xof" value={e.amount} />
            <button
              type="submit"
              disabled={payPending}
              className="rounded-full bg-togo-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Marquer payé
            </button>
          </form>
        )}
      </span>
    </li>
  );
}

export function PayBoard({ groups }: { groups: PayGroup[] }) {
  const dueTotal = groups.reduce(
    (s, g) => s + g.entries.filter((e) => !e.paid).reduce((a, e) => a + e.amount, 0),
    0,
  );
  const paidTotal = groups.reduce(
    (s, g) => s + g.entries.filter((e) => e.paid).reduce((a, e) => a + e.amount, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-red-700">{fmt(dueTotal)}</div>
          <div className="text-xs text-[var(--color-muted)]">reste à payer (FCFA)</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-togo-green-600">{fmt(paidTotal)}</div>
          <div className="text-xs text-[var(--color-muted)]">déjà payé (FCFA)</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-togo-green-100 bg-white p-4 text-center">
          <div className="text-2xl font-extrabold text-ink">{groups.length}</div>
          <div className="text-xs text-[var(--color-muted)]">contributeurs</div>
        </div>
      </div>

      {groups.length === 0 && (
        <Card>
          <p className="text-sm text-[var(--color-muted)]">
            Aucun contributeur attribué pour l&apos;instant. Attribuez des modules
            depuis « Production de contenu ».
          </p>
        </Card>
      )}

      {groups.map((g) => {
        const due = g.entries.filter((e) => !e.paid).reduce((a, e) => a + e.amount, 0);
        const paid = g.entries.filter((e) => e.paid).reduce((a, e) => a + e.amount, 0);
        return (
          <Card key={`${g.payeeId}-${g.role}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">{g.name}</span>
                <Badge tone="neutral">{g.role}</Badge>
              </div>
              <div className="text-sm">
                <span className="font-bold text-togo-red-700">{fmt(due)} FCFA dû</span>
                <span className="ml-3 text-[var(--color-muted)]">{fmt(paid)} payé</span>
              </div>
            </div>
            <ul className="mt-2 divide-y divide-[var(--color-line)]">
              {g.entries.map((e) => (
                <PayRow key={e.chapterId} payeeId={g.payeeId} role={g.role} e={e} />
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
