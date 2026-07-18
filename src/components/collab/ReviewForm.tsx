"use client";

import { useActionState } from "react";
import { submitReview, type CollabState } from "@/lib/collab/actions";

const initial: CollabState = {};

export function ReviewForm({
  moduleId,
  version,
}: {
  moduleId: string;
  version: number;
}) {
  const [state, action, pending] = useActionState(submitReview, initial);
  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl border border-togo-green-100 bg-white p-4">
      <input type="hidden" name="chapter_id" value={moduleId} />
      <input type="hidden" name="version" value={version} />
      <label className="block text-xs font-semibold text-[var(--color-muted)]">
        Vos observations sur la version {version}
        <textarea
          name="comment"
          required
          rows={3}
          placeholder="Points à corriger, remarques, améliorations proposées…"
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          name="decision"
          value="changes_requested"
          disabled={pending}
          className="rounded-full border border-togo-yellow-400 bg-togo-yellow-100 px-4 py-2 text-xs font-semibold text-ink disabled:opacity-40"
        >
          Demander des corrections
        </button>
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          Valider cette version
        </button>
        {state.ok && <span className="text-xs font-medium text-togo-green-700">✓ Relecture envoyée.</span>}
        {state.error && <span className="text-xs text-togo-red-700">{state.error}</span>}
      </div>
    </form>
  );
}
