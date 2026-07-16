"use server";

// Correction des examens format BAC, cote serveur (les bonnes reponses ne
// quittent jamais le serveur pour un examen).
//
// - Types deterministes (vrai/faux, QCM, texte a trous, appariement,
//   questions traditionnelles) : notes par comparaison normalisee.
// - Situations problemes : corrigees par Claude avec la grille officielle
//   APC (Pertinence 1 / Correction 1,5 / Coherence 1 / Perfectionnement 0,5),
//   une seule requete pour toutes les situations de la copie.
//
// Politique de repassage (examens uniquement) :
// 4 tentatives incluses + celles accordees apres paiement (exam_retake_grants),
// minimum 12 h entre deux tentatives.

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAssessment } from "@/lib/content";
import type { QuizQuestion } from "@/lib/content/types";
import {
  BASE_EXAM_ATTEMPTS,
  EXAM_COOLDOWN_HOURS,
  type AttemptStatus,
  type GradeError,
  type GradeResult,
  type QuestionResult,
} from "./types";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9,.]/g, "");
}

function matches(answer: string, accepted: string[]): boolean {
  const a = norm(answer);
  return accepted.some((x) => norm(x) === a);
}

/**
 * Lit une reponse numerique d'eleve, y compris en notation scientifique :
 * "0,004", "4 ms" (non convertie : l'unite attendue est dans l'enonce),
 * "5×10¹⁴", "5 x 10^14", "5e14", "3,31.10^-19"...
 */
function parseNumeric(s: string): number | null {
  const sup: Record<string, string> = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
    "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-",
  };
  let t = s
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => sup[c] ?? "");
  // retire une unite finale (lettres apres le nombre)
  t = t.replace(/[a-z/·]+$/g, "");
  const m = t.match(/^(-?\d+(?:\.\d+)?)(?:(?:[x×*·.]?10\^?|e)(-?\d+))?$/);
  if (!m) return null;
  const mantissa = parseFloat(m[1]);
  const exp = m[2] !== undefined ? parseInt(m[2], 10) : 0;
  return mantissa * Math.pow(10, exp);
}

/** Statut des tentatives d'un eleve sur un examen. */
export async function examAttemptStatus(
  assessmentId: string,
  userId: string,
): Promise<AttemptStatus> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      used: 0,
      allowed: BASE_EXAM_ATTEMPTS,
      nextAllowedAt: null,
      exhausted: false,
      passed: false,
    };
  }
  const [{ data: attempts }, { data: grants }] = await Promise.all([
    admin
      .from("quiz_attempts")
      .select("score,total,submitted_at")
      .eq("assessment_id", assessmentId)
      .eq("student_id", userId)
      .order("submitted_at", { ascending: false }),
    admin
      .from("exam_retake_grants")
      .select("extra_attempts")
      .eq("assessment_id", assessmentId)
      .eq("student_id", userId),
  ]);
  const used = attempts?.length ?? 0;
  const allowed =
    BASE_EXAM_ATTEMPTS +
    (grants ?? []).reduce((s, g) => s + (g.extra_attempts ?? 0), 0);
  const passed = (attempts ?? []).some(
    (a) => a.total > 0 && (100 * a.score) / a.total >= 80,
  );
  let nextAllowedAt: string | null = null;
  if (used > 0) {
    const last = new Date(attempts![0].submitted_at).getTime();
    const next = last + EXAM_COOLDOWN_HOURS * 3600 * 1000;
    if (next > Date.now()) nextAllowedAt = new Date(next).toISOString();
  }
  return { used, allowed, nextAllowedAt, exhausted: used >= allowed, passed };
}

const GRADER_PROMPT = `Tu es correcteur officiel de sciences physiques au BAC
togolais (série A4). Tu corriges des SITUATIONS PROBLÈMES selon la grille APC :
- Pertinence (1 pt) : la production répond à la consigne, dans le contexte.
- Correction (1,5 pt) : les outils, formules et calculs sont justes.
- Cohérence (1 pt) : la démarche est logique et bien enchaînée.
- Perfectionnement (0,5 pt) : soin, unités, esprit critique, qualité d'expression.
Note chaque critère avec des demi-quarts autorisés (0, 0.25, 0.5...), sans
dépasser son maximum. Sois exigeant mais juste ; une copie vide ou hors sujet
vaut 0. Réponds UNIQUEMENT avec un objet JSON de la forme :
{"corrections":[{"id":"...","pertinence":0.75,"correction":1.0,"coherence":0.75,
"perfectionnement":0.25,"commentaire":"2 phrases max, en français, tutoiement,
constructif"}]}`;

async function gradeSituations(
  items: { id: string; enonce: string; attendu: string; reponse: string }[],
): Promise<Map<string, QuestionResult["grid"] & { commentaire: string }>> {
  const out = new Map();
  if (items.length === 0) return out;
  const client = new Anthropic();
  const user = items
    .map(
      (it) =>
        `### Situation ${it.id}\nÉNONCÉ ET CONSIGNE :\n${it.enonce}\n\n` +
        `ÉLÉMENTS DE RÉPONSE ATTENDUS (confidentiels) :\n${it.attendu}\n\n` +
        `COPIE DE L'ÉLÈVE :\n${it.reponse || "(aucune réponse)"}`,
    )
    .join("\n\n");
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1500,
    thinking: { type: "adaptive" },
    system: GRADER_PROMPT,
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  for (const c of json.corrections ?? []) {
    const clamp = (v: unknown, max: number) =>
      Math.max(0, Math.min(max, Number(v) || 0));
    out.set(String(c.id), {
      pertinence: clamp(c.pertinence, 1),
      correction: clamp(c.correction, 1.5),
      coherence: clamp(c.coherence, 1),
      perfectionnement: clamp(c.perfectionnement, 0.5),
      commentaire: String(c.commentaire ?? ""),
    });
  }
  return out;
}

function gradeDeterministic(
  q: QuizQuestion,
  answer: unknown,
): QuestionResult {
  const max = q.points ?? 1;
  const p = (q.payload ?? {}) as Record<string, unknown>;
  switch (q.qtype ?? "qcm") {
    case "qcm": {
      const correct = q.options.find((o) => o.correct);
      const ok = typeof answer === "string" && answer === correct?.id;
      return {
        questionId: q.id,
        earned: ok ? max : 0,
        max,
        feedback: ok ? "Bonne réponse." : q.explanation,
      };
    }
    case "vrai_faux": {
      const expected = p.reponse === true;
      const ok = answer === expected;
      return {
        questionId: q.id,
        earned: ok ? max : 0,
        max,
        feedback: ok
          ? "Bonne réponse."
          : `C'était « ${expected ? "Vrai" : "Faux"} ». ${q.explanation}`,
      };
    }
    case "texte_trous": {
      const blancs = (p.blancs ?? []) as string[][];
      const given = Array.isArray(answer) ? (answer as string[]) : [];
      let good = 0;
      blancs.forEach((accepted, i) => {
        if (given[i] && matches(given[i], accepted)) good += 1;
      });
      const earned =
        blancs.length > 0
          ? Math.round((max * good * 100) / blancs.length) / 100
          : 0;
      return {
        questionId: q.id,
        earned,
        max,
        feedback:
          `${good}/${blancs.length} mots justes. ` +
          `Attendus : ${blancs.map((b) => b[0]).join(", ")}.`,
      };
    }
    case "appariement": {
      const paires = (p.paires ?? {}) as Record<string, string>;
      const given = (answer ?? {}) as Record<string, string>;
      const keys = Object.keys(paires);
      const good = keys.filter((k) => given[k] === paires[k]).length;
      const earned =
        keys.length > 0 ? Math.round((max * good * 100) / keys.length) / 100 : 0;
      return {
        questionId: q.id,
        earned,
        max,
        feedback: `${good}/${keys.length} associations justes. ${q.explanation}`,
      };
    }
    case "traditionnelle": {
      const target = typeof p.numerique === "number" ? p.numerique : null;
      let ok = false;
      if (target !== null && typeof answer === "string") {
        const v = parseNumeric(answer);
        const tol = ((p.tolerance_pct as number) ?? 5) / 100;
        ok = v !== null && Math.abs(v - target) <= Math.abs(target) * tol;
      } else {
        const accepted = (p.reponses ?? []) as string[];
        ok = typeof answer === "string" && matches(answer, accepted);
      }
      const expected = (p.affiche as string) ?? (p.reponses as string[])?.[0] ?? "";
      return {
        questionId: q.id,
        earned: ok ? max : 0,
        max,
        feedback: ok
          ? "Bonne réponse."
          : `Réponse attendue : ${expected}. ${q.explanation}`,
      };
    }
    default:
      return { questionId: q.id, earned: 0, max, feedback: "" };
  }
}

/** Corrige une copie d'examen ou d'evaluation format BAC. */
export async function gradeAssessment(input: {
  assessmentSlug: string;
  answers: Record<string, unknown>;
}): Promise<GradeResult | GradeError> {
  const assessment = await getAssessment(input.assessmentSlug);
  if (!assessment) return { ok: false, error: "Épreuve introuvable." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const [{ data: sub }, { data: profile }] = await Promise.all([
    // Acces selon le perimetre de l'epreuve (classe + matiere).
    supabase.rpc("has_assessment_access", {
      uid: user.id,
      p_assessment: assessment.id,
    }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);
  const isStaff = profile?.role === "admin" || profile?.role === "teacher";
  if (sub !== true && !isStaff) {
    return { ok: false, error: "Abonnement requis." };
  }

  // Politique de repassage : examens uniquement, staff exempte.
  if (assessment.kind === "examen" && !isStaff) {
    const status = await examAttemptStatus(assessment.id, user.id);
    if (status.exhausted) {
      return {
        ok: false,
        error:
          "Tu as utilisé toutes tes tentatives pour cet examen. " +
          "Un paiement permet d'en rouvrir 4 : contacte-nous via /contact.",
        status,
      };
    }
    if (status.nextAllowedAt) {
      return {
        ok: false,
        error:
          "Il faut attendre 12 h entre deux tentatives d'examen. " +
          "Profites-en pour revoir les leçons !",
        status,
      };
    }
  }

  // 1. Types deterministes.
  const results: QuestionResult[] = [];
  const situations: { id: string; enonce: string; attendu: string; reponse: string }[] =
    [];
  for (const q of assessment.questions) {
    if (q.qtype === "situation_probleme") {
      const p = (q.payload ?? {}) as Record<string, string>;
      situations.push({
        id: q.id,
        enonce: `${q.prompt}\n${p.contexte ?? ""}\nConsigne : ${p.consigne ?? ""}`,
        attendu: p.attendu ?? "",
        reponse: String(input.answers[q.id] ?? ""),
      });
    } else {
      results.push(gradeDeterministic(q, input.answers[q.id]));
    }
  }

  // 2. Situations problemes (une requete IA pour toute la copie).
  if (situations.length > 0) {
    let graded;
    try {
      graded = await gradeSituations(situations);
    } catch {
      return {
        ok: false,
        error:
          "La correction automatique est momentanément indisponible. " +
          "Réessaie dans quelques minutes (ta tentative n'est pas comptée).",
      };
    }
    for (const q of assessment.questions) {
      if (q.qtype !== "situation_probleme") continue;
      const g = graded.get(q.id);
      const grid = g
        ? {
            pertinence: g.pertinence,
            correction: g.correction,
            coherence: g.coherence,
            perfectionnement: g.perfectionnement,
          }
        : { pertinence: 0, correction: 0, coherence: 0, perfectionnement: 0 };
      const earned =
        grid.pertinence + grid.correction + grid.coherence + grid.perfectionnement;
      results.push({
        questionId: q.id,
        earned: Math.min(earned, q.points ?? 4),
        max: q.points ?? 4,
        feedback: g?.commentaire ?? "Copie non corrigée.",
        grid,
      });
    }
  }

  const earned = Math.round(results.reduce((s, r) => s + r.earned, 0) * 100) / 100;
  const max = results.reduce((s, r) => s + r.max, 0);
  const percent = max > 0 ? Math.round((100 * earned) / max) : 0;
  const passed = percent >= assessment.passPercent;

  // 3. Enregistrer la tentative (score en %, coherent avec le certificat).
  const admin = createSupabaseAdminClient();
  if (admin) {
    await admin.from("quiz_attempts").insert({
      student_id: user.id,
      assessment_id: assessment.id,
      score: percent,
      total: 100,
      details: { answers: input.answers, results },
    });
  }

  const status =
    assessment.kind === "examen" && !isStaff
      ? await examAttemptStatus(assessment.id, user.id)
      : {
          used: 0,
          allowed: BASE_EXAM_ATTEMPTS,
          nextAllowedAt: null,
          exhausted: false,
          passed,
        };

  return { ok: true, earned, max, percent, passed, results, status };
}
