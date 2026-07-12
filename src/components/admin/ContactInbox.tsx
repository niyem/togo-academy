"use client";

// File des messages de contact dans /admin : lecture + "Marquer traité".

import { useActionState } from "react";
import { Badge } from "@/components/ui";
import { markContactHandled, type ContactState } from "@/lib/contact/actions";

export interface InboxItem {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
}

const TOPIC_LABEL: Record<string, string> = {
  question: "Question générale",
  abonnement: "Abonnement & paiement",
  tuteur: "Devenir tuteur",
  technique: "Problème technique",
  partenariat: "Partenariat",
  autre: "Autre",
};

export function ContactInbox({ items }: { items: InboxItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-3 text-sm text-[var(--color-muted)]">
        Aucun message en attente. ✓
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--color-line)]">
      {items.map((m) => (
        <InboxRow key={m.id} item={m} />
      ))}
    </ul>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    markContactHandled,
    {},
  );

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{item.name}</span>
          <Badge tone="yellow">{TOPIC_LABEL[item.topic] ?? item.topic}</Badge>
          <span className="text-xs text-[var(--color-muted)]">
            {new Date(item.createdAt).toLocaleString("fr-FR")}
          </span>
        </div>
        <form action={action}>
          <input type="hidden" name="message_id" value={item.id} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-togo-green-500 px-3 py-1.5 text-xs font-semibold text-togo-green-700 hover:bg-togo-green-50 disabled:opacity-50"
          >
            {pending ? "..." : "Marquer traité"}
          </button>
        </form>
      </div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">
        {item.email}
        {item.phone ? ` · ${item.phone}` : ""}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
        {item.message}
      </p>
      {state.error && (
        <p className="mt-2 text-xs text-togo-red-700">{state.error}</p>
      )}
    </li>
  );
}
