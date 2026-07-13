"use client";

// Epreuve format BAC (APC) : sujet en exercices (situations problemes,
// questions objectives, questions traditionnelles), correction COTE SERVEUR
// (les bonnes reponses ne sont jamais envoyees au navigateur), grille APC
// affichee pour les situations problemes, politique de tentatives d'examen.

import { useMemo, useState } from "react";
import { gradeAssessment } from "@/lib/assessments/grade";
import type { AttemptStatus, GradeResult } from "@/lib/assessments/types";

export interface PublicOption {
  id: string;
  label: string;
}

export interface PublicQuestion {
  id: string;
  prompt: string;
  qtype: string;
  points: number;
  section?: string;
  options: PublicOption[];
  /** Parties publiques du payload (jamais les reponses). */
  texte?: string;
  nbBlancs?: number;
  gauche?: string[];
  droite?: string[];
  contexte?: string;
  consigne?: string;
  competence?: string;
}

const SECTION_TITLES: Record<string, string> = {
  ex1: "Exercice 1 : Situations problèmes",
  ex2: "Exercice 2 : Questions objectives",
  ex3: "Exercice 3 : Questions traditionnelles",
};

function fmtPts(n: number): string {
  return `${String(n).replace(".", ",")} pt${n > 1 ? "s" : ""}`;
}

function CooldownNote({ status }: { status: AttemptStatus }) {
  if (status.exhausted) {
    return (
      <div className="rounded-xl border border-togo-red-500/40 bg-togo-red-100/50 p-4 text-sm">
        <p className="font-semibold">Tentatives épuisées ({status.used}/{status.allowed}).</p>
        <p className="mt-1">
          Un paiement permet de rouvrir 4 tentatives : écris-nous via{" "}
          <a href="/contact" className="font-semibold underline">/contact</a>{" "}
          (sujet « abonnement / paiement »).
        </p>
      </div>
    );
  }
  if (status.nextAllowedAt) {
    const d = new Date(status.nextAllowedAt);
    return (
      <div className="rounded-xl border border-togo-yellow-400 bg-togo-yellow-100/60 p-4 text-sm">
        <p className="font-semibold">Prochaine tentative possible le{" "}
          {d.toLocaleDateString("fr-FR")} à{" "}
          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
        </p>
        <p className="mt-1">
          Il faut 12 h entre deux tentatives d&apos;examen. Profites-en pour
          revoir les leçons et l&apos;évaluation du module !
        </p>
      </div>
    );
  }
  return null;
}

export function AssessmentExam({
  slug,
  kind,
  passPercent,
  questions,
  initialStatus,
}: {
  slug: string;
  kind: "evaluation" | "examen";
  passPercent: number;
  questions: PublicQuestion[];
  initialStatus: AttemptStatus | null;
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [status, setStatus] = useState<AttemptStatus | null>(initialStatus);

  const sections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, PublicQuestion[]>();
    for (const q of questions) {
      const key = q.section ?? "questions";
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(q);
    }
    return order.map((key) => ({
      key,
      title: SECTION_TITLES[key] ?? "Questions",
      points: map.get(key)!.reduce((s, q) => s + q.points, 0),
      questions: map.get(key)!,
    }));
  }, [questions]);

  const resultOf = (id: string) =>
    result?.results.find((r) => r.questionId === id);

  const locked =
    kind === "examen" &&
    !!status &&
    !result &&
    (status.exhausted || !!status.nextAllowedAt);

  async function submit() {
    if (busy || result) return;
    setBusy(true);
    setError(null);
    try {
      const res = await gradeAssessment({ assessmentSlug: slug, answers });
      if (!res.ok) {
        setError(res.error);
        if (res.status) setStatus(res.status);
      } else {
        setResult(res);
        setStatus(res.status);
      }
    } catch {
      setError("Une erreur est survenue. Réessaie dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  function setAnswer(id: string, value: unknown) {
    if (result) return;
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  return (
    <div className="space-y-6">
      {kind === "examen" && status && !result && (
        <p className="text-sm text-[var(--color-muted)]">
          Tentatives utilisées : {status.used}/{status.allowed}
          {status.passed && " · ✅ Examen déjà validé"}
        </p>
      )}
      {locked && status && <CooldownNote status={status} />}

      {!locked &&
        sections.map((sec) => (
          <section key={sec.key}>
            {sec.key !== "questions" && (
              <h2 className="mb-3 rounded-lg bg-togo-green-50 px-4 py-2 font-bold text-togo-green-700">
                {sec.title}{" "}
                <span className="font-normal">({fmtPts(sec.points)})</span>
              </h2>
            )}
            <div className="space-y-4">
              {sec.questions.map((q, idx) => {
                const r = resultOf(q.id);
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-[var(--color-line)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">
                        <span className="text-togo-green-600">
                          {idx + 1}.
                        </span>{" "}
                        {q.prompt}
                      </p>
                      <span className="flex-none rounded-full bg-togo-green-50 px-2 py-0.5 text-xs font-semibold text-togo-green-700">
                        {r ? `${String(r.earned).replace(".", ",")}/` : ""}
                        {fmtPts(q.points)}
                      </span>
                    </div>

                    {/* SITUATION PROBLEME */}
                    {q.qtype === "situation_probleme" && (
                      <div className="mt-3 space-y-2 text-sm">
                        {q.competence && (
                          <p className="italic text-[var(--color-muted)]">
                            Compétence : {q.competence}
                          </p>
                        )}
                        {q.contexte && (
                          <p className="whitespace-pre-line">{q.contexte}</p>
                        )}
                        {q.consigne && (
                          <p>
                            <strong>Consigne :</strong> {q.consigne}
                          </p>
                        )}
                        <textarea
                          rows={6}
                          disabled={!!result}
                          value={String(answers[q.id] ?? "")}
                          onChange={(e) => setAnswer(q.id, e.target.value)}
                          placeholder="Rédige ta réponse ici (démarche, calculs, conclusion)..."
                          className="w-full rounded-lg border border-[var(--color-line)] p-3 text-sm focus:border-togo-green-500 focus:outline-none"
                        />
                        {r?.grid && (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(
                              [
                                ["Pertinence", r.grid.pertinence, 1],
                                ["Correction", r.grid.correction, 1.5],
                                ["Cohérence", r.grid.coherence, 1],
                                ["Perfectionnement", r.grid.perfectionnement, 0.5],
                              ] as const
                            ).map(([label, v, max]) => (
                              <div
                                key={label}
                                className="rounded-lg bg-togo-green-50 px-2 py-1.5 text-center text-xs"
                              >
                                <div className="font-semibold">{label}</div>
                                <div>
                                  {String(v).replace(".", ",")} /{" "}
                                  {String(max).replace(".", ",")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* QCM */}
                    {q.qtype === "qcm" && (
                      <div className="mt-3 space-y-2">
                        {q.options.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            disabled={!!result}
                            onClick={() => setAnswer(q.id, o.id)}
                            className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm ${
                              answers[q.id] === o.id
                                ? "border-togo-green-500 bg-togo-green-50 font-semibold"
                                : "border-[var(--color-line)] hover:border-togo-green-500"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* VRAI / FAUX */}
                    {q.qtype === "vrai_faux" && (
                      <div className="mt-3 flex gap-2">
                        {[
                          [true, "Vrai"],
                          [false, "Faux"],
                        ].map(([v, label]) => (
                          <button
                            key={String(v)}
                            type="button"
                            disabled={!!result}
                            onClick={() => setAnswer(q.id, v)}
                            className={`rounded-full border px-5 py-2 text-sm font-semibold ${
                              answers[q.id] === v
                                ? "border-togo-green-500 bg-togo-green-50"
                                : "border-[var(--color-line)] hover:border-togo-green-500"
                            }`}
                          >
                            {label as string}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* TEXTE A TROUS */}
                    {q.qtype === "texte_trous" && (
                      <div className="mt-3 space-y-2 text-sm">
                        {q.texte && (
                          <p className="whitespace-pre-line rounded-lg bg-togo-green-50/60 p-3">
                            {q.texte}
                          </p>
                        )}
                        <div className="grid gap-2 sm:grid-cols-2">
                          {Array.from({ length: q.nbBlancs ?? 0 }).map((_, i) => (
                            <label key={i} className="flex items-center gap-2">
                              <span className="flex-none text-xs font-semibold text-togo-green-700">
                                ({i + 1})
                              </span>
                              <input
                                type="text"
                                disabled={!!result}
                                value={
                                  ((answers[q.id] as string[]) ?? [])[i] ?? ""
                                }
                                onChange={(e) => {
                                  const arr = [
                                    ...((answers[q.id] as string[]) ?? []),
                                  ];
                                  arr[i] = e.target.value;
                                  setAnswer(q.id, arr);
                                }}
                                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-1.5 focus:border-togo-green-500 focus:outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* APPARIEMENT */}
                    {q.qtype === "appariement" && (
                      <div className="mt-3 space-y-2 text-sm">
                        {(q.gauche ?? []).map((g, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-1/2">{i + 1}) {g}</span>
                            <select
                              disabled={!!result}
                              value={
                                ((answers[q.id] as Record<string, string>) ?? {})[
                                  String(i)
                                ] ?? ""
                              }
                              onChange={(e) => {
                                const cur = {
                                  ...((answers[q.id] as Record<string, string>) ??
                                    {}),
                                };
                                cur[String(i)] = e.target.value;
                                setAnswer(q.id, cur);
                              }}
                              className="w-1/2 rounded-lg border border-[var(--color-line)] px-2 py-1.5"
                            >
                              <option value="">Choisis...</option>
                              {(q.droite ?? []).map((d, j) => (
                                <option key={j} value={String(j)}>
                                  {String.fromCharCode(97 + j)}) {d}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* QUESTION TRADITIONNELLE */}
                    {q.qtype === "traditionnelle" && (
                      <input
                        type="text"
                        disabled={!!result}
                        value={String(answers[q.id] ?? "")}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Ta réponse (avec l'unité)"
                        className="mt-3 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none"
                      />
                    )}

                    {r && (
                      <p className="mt-3 rounded-lg border border-togo-green-100 bg-white px-3 py-2 text-sm text-togo-green-700">
                        {r.feedback}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

      {error && (
        <div className="rounded-xl border border-togo-red-500/40 bg-togo-red-100/50 p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {!locked && !result && (
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="w-full rounded-full bg-togo-green-600 py-3 font-semibold text-white disabled:opacity-40"
        >
          {busy
            ? "Correction de ta copie en cours..."
            : "Remettre ma copie pour correction"}
        </button>
      )}

      {result && (
        <div
          className={`rounded-xl p-5 text-center ${
            result.passed ? "bg-togo-green-600 text-white" : "bg-togo-yellow-100"
          }`}
        >
          <p className="text-2xl font-extrabold">
            {String(result.earned).replace(".", ",")}/{result.max} ·{" "}
            {result.percent}%
          </p>
          <p className="mt-1 font-semibold">
            {result.passed
              ? kind === "examen"
                ? "🎉 Examen validé ! Il compte pour ton certificat de cours."
                : "✅ Évaluation validée pour ton certificat de cours !"
              : `Il te faut ${passPercent}% pour valider. Courage, revois les leçons !`}
          </p>
          {kind === "examen" && !result.passed && status && (
            <p className="mt-2 text-sm">
              Tentatives utilisées : {status.used}/{status.allowed}
              {status.nextAllowedAt &&
                " · prochaine tentative possible dans 12 h"}
              {status.exhausted &&
                " · pour rouvrir des tentatives, contacte-nous via /contact"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
