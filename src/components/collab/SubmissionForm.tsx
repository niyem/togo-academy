"use client";

import { useActionState } from "react";
import { submitVersion, type CollabState } from "@/lib/collab/actions";

const initial: CollabState = {};

export function SubmissionForm({ lessonId }: { lessonId: string }) {
  const [state, action, pending] = useActionState(submitVersion, initial);
  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl border border-togo-green-100 bg-white p-4">
      <input type="hidden" name="lesson_id" value={lessonId} />
      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">
          Fichier du cours (PDF, Word, PowerPoint, images ou ZIP · 25 Mo max)
        </label>
        <input type="file" name="file" required accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip" className="text-sm" />
      </div>
      <input
        name="note"
        placeholder="Note pour l'inspecteur (facultatif)"
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Envoi..." : "Soumettre une version"}
        </button>
        {state.ok && <span className="text-sm font-medium text-togo-green-700">✓ Version soumise.</span>}
        {state.error && <span className="text-sm text-togo-red-700">{state.error}</span>}
      </div>
    </form>
  );
}
