// Tuteur IA pedagogique : ancre sur la lecon en cours, pour les utilisateurs
// connectes (lecons gratuites) et les abonnes (toutes les lecons).
// Claude Opus 4.8 : pedagogie socratique, indices sans reveler les reponses.

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClass, getLesson } from "@/lib/content";
import type { Lesson } from "@/lib/content/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TURNS = 16;
const MAX_CHARS = 2000;

function lessonToText(lesson: Lesson): string {
  const parts: string[] = [
    `Titre : ${lesson.title}`,
    `Classe : ${lesson.classSlug} · Matière : ${lesson.subjectKey}`,
    `Résumé : ${lesson.summary}`,
  ];
  for (const a of lesson.activities) {
    parts.push(`\n### ${a.type.toUpperCase()} — ${a.title}`);
    if (a.body) parts.push(a.body);
    if (a.hint) parts.push(`Indice prévu : ${a.hint}`);
    if (a.solution) parts.push(`Solution (à ne pas donner d'emblée) : ${a.solution}`);
    for (const q of a.questions ?? []) {
      const correct = q.options.find((o) => o.correct)?.label ?? "";
      parts.push(
        `Question de quiz : ${q.prompt}\nOptions : ${q.options
          .map((o) => o.label)
          .join(" | ")}\nBonne réponse (confidentielle) : ${correct}\nExplication : ${q.explanation}`,
      );
    }
  }
  return parts.join("\n");
}

const PEDAGOGY = `
Tu es le tuteur pédagogique de Togo Academy. Tu accompagnes un élève togolais
sur LA leçon ci-dessous, alignée sur le programme officiel togolais.

## Ta méthode
- Réponds en français simple, adapté au niveau de la classe indiquée. Tutoie
  l'élève, sois chaleureux et encourageant.
- Explique AUTREMENT que le cours quand l'élève n'a pas compris : autre angle,
  analogie de la vie courante au Togo, schéma décrit pas à pas.
- Pour un exercice ou une question de quiz : ne donne JAMAIS directement la
  réponse. Donne un indice, pose une question qui guide, puis vérifie.
  Ne révèle la solution complète que si l'élève a vraiment essayé.
- Propose volontiers un petit exercice supplémentaire du même type, avec des
  nombres différents.
- Reste STRICTEMENT dans le périmètre de cette leçon et de ses prérequis
  immédiats. Si la question sort du cadre (autre chapitre, devoirs non liés,
  sujets hors école), ramène gentiment vers la leçon.
- Réponses courtes (3-8 phrases), une seule idée à la fois. Termine souvent
  par une petite question pour vérifier la compréhension.
- Écris les maths en texte simple (pas de LaTeX) : AM/AB, 3/5, 4,8 cm.

## La leçon
`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Tuteur indisponible.", { status: 503 });
  }

  let body: { lessonSlug?: string; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Requête invalide.", { status: 400 });
  }

  // Authentification obligatoire (suivi + limites par eleve a venir).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Connexion requise.", { status: 401 });

  const lesson = body.lessonSlug ? await getLesson(body.lessonSlug) : undefined;
  if (!lesson) return new Response("Leçon introuvable.", { status: 404 });

  // Pas de tuteur IA au primaire (meme regle que l'affichage des lecons).
  const schoolClass = await getClass(lesson.classSlug);
  if (schoolClass?.levelSlug === "primaire") {
    return new Response("Tuteur non disponible pour ce niveau.", {
      status: 403,
    });
  }

  // Acces : lecon gratuite (offre IA limitee), abonnement actif, ou staff
  // (admin/enseignant : acces complet).
  if (!lesson.isFreePreview) {
    const [{ data: sub }, { data: profile }] = await Promise.all([
      supabase.rpc("has_active_subscription", { uid: user.id }),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    const isStaff = profile?.role === "admin" || profile?.role === "teacher";
    if (sub !== true && !isStaff) {
      return new Response("Abonnement requis pour cette leçon.", {
        status: 403,
      });
    }
  }

  const messages = (body.messages ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response("Message manquant.", { status: 400 });
  }

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1200,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: PEDAGOGY + lessonToText(lesson),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n\n(Désolé, une erreur est survenue. Réessaie.)"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
