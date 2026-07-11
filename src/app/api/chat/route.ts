// Chatbot visiteurs : aide a la navigation, aux abonnements et aux paiements.
// Claude Haiku 4.5 (chatbot leger) ; le tuteur pedagogique (Phase 3, suite)
// utilisera Opus 4.8 avec RAG sur les lecons.

import Anthropic from "@anthropic-ai/sdk";
import { PAYMENT_METHODS } from "@/lib/payments";
import { getPlans } from "@/lib/content";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_TURNS = 12; // borne l'historique envoye par le client
const MAX_CHARS = 2000; // borne chaque message

const SITE_CONTEXT = `
Tu es l'assistant de Togo Academy (academie.groupebm.net), la plateforme
d'apprentissage en ligne du departement "Académie en ligne" de Groupe BM,
dediee au programme scolaire togolais.

## Ce que propose la plateforme
- Cours en ligne du primaire (CP1 a CM2, jusqu'au CEPD) au college et lycee.
- Apres le CEPD : enseignement GENERAL (6eme-3eme puis Seconde-Terminale) et
  enseignement TECHNIQUE (CET filiere CAP au college ; lycee technique).
- Matieres STEM d'abord : mathematiques, physique, chimie, SVT, technologie,
  informatique. Chaque lecon : video courte, cours ecrit, exemple resolu,
  exercices interactifs, quiz corrige immediatement, fiche PDF telechargeable
  (abonnes).
- Des lecons d'essai GRATUITES (badge "Gratuit" dans le catalogue), sans carte
  bancaire. Exemple : "Decouvrir le theoreme de Thales" (3eme, maths).
- Suivi de progression pour l'eleve ; compte PARENT qui suit un ou plusieurs
  enfants via un code de liaison (TG-XXXXXX, affiche sur le tableau de bord de
  l'eleve).
- Tuteur IA pedagogique et tutorat humain en direct : en preparation.

## Pages utiles (liens relatifs)
/catalogue (tous les niveaux), /tarifs (abonnements), /inscription,
/connexion, /tableau-de-bord, /a-propos, /faq, /contact.

## Paiement (apres choix d'une formule sur /tarifs)
L'utilisateur paie puis soumet la reference de paiement ; l'equipe verifie et
active l'abonnement sous 24 h environ. Les details exacts (numeros, IBAN) sont
affiches sur la page de paiement /abonnement/[formule].

## Regles
- Reponds en francais, simplement et chaleureusement (tutoie les eleves,
  vouvoie les parents si le contexte l'indique).
- Reste dans le perimetre de Togo Academy : cours, abonnements, paiements,
  navigation, comptes. Pour toute autre question (devoirs, actualites, etc.),
  explique gentiment que le tuteur pedagogique arrive bientot et redirige vers
  les lecons.
- Ne promets rien qui n'est pas decrit ici. Si tu ne sais pas : propose
  /contact.
- Reponses courtes (2-5 phrases), avec le lien utile.
`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Assistant indisponible.", { status: 503 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Requête invalide.", { status: 400 });
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

  // Donnees fraiches pour ancrer les prix.
  const plans = await getPlans();
  const planText = plans
    .map((p) => `- ${p.name} : ${p.priceXof} FCFA / ${p.cadence} (${p.scope})`)
    .join("\n");
  const methodText = PAYMENT_METHODS.map(
    (m) => `- ${m.label} (${m.where})`,
  ).join("\n");

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 700,
    system: [
      {
        type: "text",
        text:
          SITE_CONTEXT +
          `\n## Formules actuelles\n${planText}\n\n## Moyens de paiement\n${methodText}\n`,
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
          encoder.encode("\n\n(Désolé, une erreur est survenue. Réessayez.)"),
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
