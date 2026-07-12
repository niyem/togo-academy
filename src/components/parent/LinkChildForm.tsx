"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { linkStudent, type LinkState } from "@/lib/parent/actions";

// Formulaire "Ajouter un enfant" : le parent saisit le code TG-XXXXXX
// affiche sur le tableau de bord de l'eleve.
export function LinkChildForm() {
  const [state, action, pending] = useActionState<LinkState, FormData>(
    linkStudent,
    {},
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="grow">
        <label htmlFor="code" className="mb-1 block text-sm font-semibold">
          Code de liaison de l&apos;enfant
        </label>
        <input
          id="code"
          name="code"
          placeholder="TG-XXXXXX"
          required
          className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 font-mono uppercase focus:border-togo-green-500"
        />
      </div>
      <Button type="submit">{pending ? "Liaison..." : "Ajouter"}</Button>

      {state.error && (
        <p className="w-full rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
          {state.error}
        </p>
      )}
      {state.linkedName && (
        <p className="w-full rounded-lg border border-togo-green-100 bg-white px-3 py-2 text-sm text-togo-green-700">
          ✓ {state.linkedName} est maintenant relié à votre compte.
        </p>
      )}
    </form>
  );
}
