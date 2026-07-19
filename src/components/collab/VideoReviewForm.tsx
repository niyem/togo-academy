"use client";

import { useActionState } from "react";
import { submitVideoReview, type CollabState } from "@/lib/collab/actions";

const initial: CollabState = {};

export function VideoReviewForm({
  moduleId,
  videoUrl,
}: {
  moduleId: string;
  videoUrl: string;
}) {
  const [state, action, pending] = useActionState(submitVideoReview, initial);
  return (
    <div className="mt-3 rounded-xl border border-togo-yellow-400/60 bg-togo-yellow-100 p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-togo-green-700">
        Contrôle qualité de la vidéo
      </div>
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm font-semibold text-togo-green-700 hover:underline"
      >
        ▶ Regarder la vidéo produite
      </a>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="chapter_id" value={moduleId} />
        <textarea
          name="comment"
          required
          rows={2}
          placeholder="Vos observations sur la vidéo (erreurs à corriger, validation…)"
          className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            name="decision"
            value="changes_requested"
            disabled={pending}
            className="rounded-full border border-togo-red-200 bg-white px-4 py-2 text-xs font-semibold text-togo-red-700 disabled:opacity-40"
          >
            Signaler une erreur
          </button>
          <button
            type="submit"
            name="decision"
            value="approved"
            disabled={pending}
            className="rounded-full bg-togo-green-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            Valider la version définitive
          </button>
          {state.ok && <span className="text-xs font-medium text-togo-green-700">✓ Envoyé.</span>}
          {state.error && <span className="text-xs text-togo-red-700">{state.error}</span>}
        </div>
      </form>
    </div>
  );
}
