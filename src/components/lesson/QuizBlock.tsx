"use client";

import { useState } from "react";
import type { Activity, QuizQuestion } from "@/lib/content/types";

// Quiz with immediate, per-question feedback. Local-state only in Phase 0;
// Phase 1 persists attempts to the quiz_attempts / quiz_answers tables to feed
// the progress dashboard.
export function QuizBlock({ activity }: { activity: Activity }) {
  const questions = activity.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter(
    (q) => q.options.find((o) => o.id === answers[q.id])?.correct,
  ).length;

  return (
    <div className="space-y-5">
      {questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          index={idx + 1}
          question={q}
          selected={answers[q.id]}
          onSelect={(optId) => setAnswers((a) => ({ ...a, [q.id]: optId }))}
        />
      ))}

      {answeredCount === questions.length && questions.length > 0 && (
        <div className="rounded-lg bg-togo-green-600 px-4 py-3 font-semibold text-white">
          Score : {correctCount} / {questions.length}
          {correctCount === questions.length
            ? " — Excellent ! 🎉"
            : " — Revois les explications ci-dessus."}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  question,
  selected,
  onSelect,
}: {
  index: number;
  question: QuizQuestion;
  selected?: string;
  onSelect: (optId: string) => void;
}) {
  const answered = selected !== undefined;
  const selectedOption = question.options.find((o) => o.id === selected);

  return (
    <div className="rounded-xl border border-[var(--color-line)] p-4">
      <p className="font-medium">
        <span className="text-togo-green-600">Q{index}.</span> {question.prompt}
      </p>
      <div className="mt-3 space-y-2">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id;
          let cls =
            "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ";
          if (!answered) {
            cls += "border-[var(--color-line)] hover:border-togo-green-500";
          } else if (opt.correct) {
            cls += "border-togo-green-500 bg-togo-green-50 font-semibold";
          } else if (isSelected) {
            cls += "border-togo-red-500 bg-togo-red-100";
          } else {
            cls += "border-[var(--color-line)] opacity-70";
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={answered}
              onClick={() => onSelect(opt.id)}
              className={cls}
            >
              {opt.label}
              {answered && opt.correct && " ✓"}
              {answered && isSelected && !opt.correct && " ✗"}
            </button>
          );
        })}
      </div>

      {answered && (
        <p
          className={`mt-3 rounded-lg px-4 py-2 text-sm ${
            selectedOption?.correct
              ? "bg-togo-green-50 text-togo-green-700"
              : "bg-togo-red-100 text-togo-red-700"
          }`}
        >
          {selectedOption?.correct ? "Bonne réponse ! " : "Pas tout à fait. "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}
