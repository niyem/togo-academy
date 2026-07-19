"use client";

import { useActionState } from "react";
import { deleteContributor, type AdminState } from "@/lib/admin/actions";

const initial: AdminState = {};

// Bouton de suppression avec confirmation navigateur (action irreversible).
export function DeleteContributor({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(deleteContributor, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Supprimer définitivement le compte de ${name} ?\n\nCette action est irréversible. Les modules qu'il tenait redeviendront non attribués. L'adresse e-mail redeviendra libre.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-togo-red-500 px-3 py-1.5 text-xs font-semibold text-togo-red-700 hover:bg-togo-red-100 disabled:opacity-40"
      >
        {pending ? "Suppression..." : "🗑 Supprimer"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-togo-red-700">{state.error}</span>
      )}
    </form>
  );
}
