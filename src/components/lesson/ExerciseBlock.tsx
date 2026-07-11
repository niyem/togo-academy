"use client";

import { useState } from "react";
import { LessonProse } from "./LessonProse";
import type { Activity } from "@/lib/content/types";

// Interactive exercise: statement first, hint on demand, solution revealed only
// when the student chooses. Mirrors the "give hints without revealing the answer"
// requirement for the AI tutor, applied to static exercises.
export function ExerciseBlock({ activity }: { activity: Activity }) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div>
      {activity.body && <LessonProse text={activity.body} />}

      <div className="mt-4 flex flex-wrap gap-2">
        {activity.hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="rounded-full border border-togo-yellow-400 px-4 py-2 text-sm font-semibold text-togo-yellow-600 hover:bg-togo-yellow-100"
          >
            {showHint ? "Masquer l'indice" : "💡 Voir un indice"}
          </button>
        )}
        {activity.solution && (
          <button
            type="button"
            onClick={() => setShowSolution((v) => !v)}
            className="rounded-full border border-togo-green-500 px-4 py-2 text-sm font-semibold text-togo-green-700 hover:bg-togo-green-50"
          >
            {showSolution ? "Masquer la correction" : "Voir la correction"}
          </button>
        )}
      </div>

      {showHint && activity.hint && (
        <p className="mt-3 rounded-lg bg-togo-yellow-100 px-4 py-3 text-sm">
          <strong>Indice :</strong> {activity.hint}
        </p>
      )}
      {showSolution && activity.solution && (
        <div className="mt-3 rounded-lg bg-togo-green-50 px-4 py-3 text-sm">
          <strong>Correction :</strong>
          <div className="mt-1">
            <LessonProse text={activity.solution} />
          </div>
        </div>
      )}
    </div>
  );
}
