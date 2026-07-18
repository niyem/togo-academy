"use client";

import { useActionState } from "react";
import { reviewCollaborator, type CollabState } from "@/lib/collab/actions";

const initial: CollabState = {};

export function CollabReview({
  userId,
  desiredRole,
}: {
  userId: string;
  desiredRole: string;
}) {
  const [state, action, pending] = useActionState(reviewCollaborator, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="desired_role" value={desiredRole} />
      <button
        type="submit"
        name="decision"
        value="approved"
        disabled={pending}
        className="rounded-full bg-togo-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        Approuver
      </button>
      <button
        type="submit"
        name="decision"
        value="rejected"
        disabled={pending}
        className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold hover:border-togo-red-500 disabled:opacity-40"
      >
        Refuser
      </button>
      {state.error && <span className="text-xs text-togo-red-700">{state.error}</span>}
    </form>
  );
}
