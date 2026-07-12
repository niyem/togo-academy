"use client";

// File de verification des paiements : activer ou rejeter une souscription.

import { useActionState } from "react";
import {
  activateSubscription,
  rejectSubscription,
  type AdminState,
} from "@/lib/admin/actions";

export type PendingItem = {
  subscriptionId: string;
  planName: string;
  userName: string;
  method: string;
  reference: string;
  amountXof: number;
  createdAt: string;
};

function Row({ item }: { item: PendingItem }) {
  const [okState, activate, activating] = useActionState<AdminState, FormData>(
    activateSubscription,
    {},
  );
  const [koState, reject, rejecting] = useActionState<AdminState, FormData>(
    rejectSubscription,
    {},
  );
  const busy = activating || rejecting;
  const error = okState.error || koState.error;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-semibold">
          {item.userName} · {item.planName} ·{" "}
          {item.amountXof.toLocaleString("fr-FR")} FCFA
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          {item.method.toUpperCase()} · réf. « {item.reference} » ·{" "}
          {new Date(item.createdAt).toLocaleDateString("fr-FR")}
        </p>
        {error && <p className="text-xs text-togo-red-700">{error}</p>}
      </div>
      <div className="flex gap-2">
        <form action={activate}>
          <input type="hidden" name="subscription_id" value={item.subscriptionId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-togo-green-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {activating ? "..." : "✓ Activer"}
          </button>
        </form>
        <form
          action={reject}
          onSubmit={(e) => {
            if (!confirm("Rejeter ce paiement ?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="subscription_id" value={item.subscriptionId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full border border-togo-red-500 px-4 py-1.5 text-sm font-semibold text-togo-red-700 disabled:opacity-50"
          >
            Rejeter
          </button>
        </form>
      </div>
    </li>
  );
}

export function PaymentQueue({ items }: { items: PendingItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Aucun paiement en attente de vérification. ✓
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--color-line)]">
      {items.map((i) => (
        <Row key={i.subscriptionId} item={i} />
      ))}
    </ul>
  );
}
