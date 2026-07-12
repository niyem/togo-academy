"use client";

// Evaluation de sous-chapitre / examen final : toutes les questions, note a la
// fin (reussi si >= passPercent), tentative enregistree, possibilite de
// recommencer.

import { useState } from "react";
import { recordAssessmentAttempt } from "@/lib/progress/actions";
import type { Assessment } from "@/lib/content/types";

export function AssessmentQuiz({ assessment }: { assessment: Assessment }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const total = assessment.questions.length;
  const score = assessment.questions.filter(
    (q) => q.options.find((o) => o.id === answers[q.id])?.correct,
  ).length;
  const percent = total ? Math.round((100 * score) / total) : 0;
  const passed = percent >= assessment.passPercent;
  const allAnswered = Object.keys(answers).length === total;

  function submit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    recordAssessmentAttempt({
      assessmentId: assessment.id,
      score,
      total,
    }).catch(() => {});
  }

  function restart() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-5">
      {assessment.questions.map((q, idx) => (
        <div key={q.id} className="rounded-xl border border-[var(--color-line)] p-4">
          <p className="font-medium">
            <span className="text-togo-green-600">Q{idx + 1}.</span> {q.prompt}
          </p>
          <div className="mt-3 space-y-2">
            {q.options.map((o) => {
              const sel = answers[q.id] === o.id;
              let cls =
                "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ";
              if (!submitted) {
                cls += sel
                  ? "border-togo-green-500 bg-togo-green-50 font-semibold"
                  : "border-[var(--color-line)] hover:border-togo-green-500";
              } else if (o.correct) {
                cls += "border-togo-green-500 bg-togo-green-50 font-semibold";
              } else if (sel) {
                cls += "border-togo-red-500 bg-togo-red-100";
              } else {
                cls += "border-[var(--color-line)] opacity-60";
              }
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                  className={cls}
                >
                  {o.label}
                  {submitted && o.correct && " ✓"}
                  {submitted && sel && !o.correct && " ✗"}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className="mt-2 rounded-lg border border-togo-green-100 bg-white px-3 py-2 text-sm text-togo-green-700">
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          className="w-full rounded-full bg-togo-green-600 py-3 font-semibold text-white disabled:opacity-40"
        >
          {allAnswered
            ? "Valider mes réponses"
            : `Réponds à toutes les questions (${Object.keys(answers).length}/${total})`}
        </button>
      ) : (
        <div
          className={`rounded-xl p-5 text-center ${
            passed ? "bg-togo-green-600 text-white" : "bg-togo-yellow-100"
          }`}
        >
          <p className="text-2xl font-extrabold">
            {score}/{total} · {percent}%
          </p>
          <p className="mt-1 font-semibold">
            {passed
              ? assessment.kind === "examen"
                ? "🎉 Examen validé ! Il compte pour ton certificat de cours."
                : "✅ Évaluation validée pour ton certificat de cours !"
              : `Il te faut ${assessment.passPercent}% pour valider ${
                  assessment.kind === "examen" ? "l'examen" : "l'évaluation"
                }.`}
          </p>
          {!passed && (
            <p className="mt-2 text-sm">
              Tu peux continuer les leçons librement 👍 mais pense à revenir
              valider cette épreuve : toutes les évaluations (70%) et tous les
              examens de chapitre (80%) du cours sont nécessaires pour obtenir
              ton certificat de cours.
            </p>
          )}
          <button
            type="button"
            onClick={restart}
            className={`mt-4 rounded-full px-5 py-2 text-sm font-semibold ${
              passed
                ? "bg-white text-togo-green-700"
                : "bg-togo-green-600 text-white"
            }`}
          >
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}
