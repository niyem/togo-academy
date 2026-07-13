"use client";

// Rouvre 4 tentatives d'examen pour un eleve qui a paye, apres que
// l'equipe a encaisse le paiement (meme logique manuelle que les
// abonnements : paiement verifie -> action admin).

import { useActionState } from "react";
import { grantExamRetake, type AdminState } from "@/lib/admin/actions";

const initial: AdminState = {};

export function GrantRetakeForm() {
  const [state, action, pending] = useActionState(grantExamRetake, initial);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          name="email"
          required
          placeholder="Email de l'élève"
          className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none"
        />
        <input
          type="text"
          name="assessment_slug"
          required
          placeholder="Slug de l'examen (ex. examen-propagation-onde-nature-lumiere)"
          className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none"
        />
      </div>
      <input
        type="text"
        name="note"
        placeholder="Note (référence du paiement)"
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Enregistrement..." : "Rouvrir 4 tentatives"}
        </button>
        {state.ok && (
          <span className="text-sm font-medium text-togo-green-700">
            ✓ Tentatives rouvertes.
          </span>
        )}
        {state.error && (
          <span className="text-sm font-medium text-togo-red-700">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
