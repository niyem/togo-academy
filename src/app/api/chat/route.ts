// Chatbot visiteurs : aide a la navigation, aux abonnements et aux paiements.
// Claude Haiku 4.5 (chatbot leger) ; le tuteur pedagogique (Phase 3, suite)
// utilisera Opus 4.8 avec RAG sur les lecons.

import Anthropic from "@anthropic-ai/sdk";
import { PAYMENT_METHODS } from "@/lib/payments";
import { getCatalogueDigest, getPlans } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CHAT_DAILY_LIMIT,
  CHAT_LIMIT_MESSAGE,
  clientIdentity,
  consumeQuota,
} from "@/lib/ai/quota";

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
- Lancement centre sur l'enseignement GENERAL (6eme-3eme puis
  Seconde-Terminale). Les filieres techniques (CET, lycee technique)
  arriveront plus tard.
- Matieres STEM d'abord : mathematiques, physique, chimie, SVT, technologie,
  informatique. Chaque lecon : video courte, cours ecrit, exemple resolu,
  exercices interactifs, quiz corrige immediatement, fiche PDF telechargeable
  (abonnes).
- Des lecons d'essai GRATUITES (badge "Gratuit" dans le catalogue), sans carte
  bancaire. Exemple : "Decouvrir le theoreme de Thales" (3eme, maths).
- Suivi de progression pour l'eleve ; compte PARENT qui suit un ou plusieurs
  enfants via un code de liaison (TG-XXXXXX, affiche sur le tableau de bord de
  l'eleve).
- Tuteur IA pedagogique : disponible dans chaque lecon du college et du lycee
  (bouton "Tuteur IA" en haut de la lecon, pour les utilisateurs connectes).
  Pas de tuteur IA au primaire : quiz et videos y suffisent.
- TUTORAT EN DIRECT avec des enseignants togolais (seances privees 1:1, payables
  a la seance, SANS abonnement) : bientot disponible — details sur /tutorat.
  Les enseignants interesses pour devenir tuteurs remuneres : /contact.

## Pages utiles (liens relatifs)
/catalogue (tous les niveaux), /tutorat (tutorat en direct), /tarifs
(abonnements), /inscription, /connexion, /tableau-de-bord, /a-propos
(qui nous sommes : departement "Académie en ligne" de Groupe BM), /faq,
/contact (formulaire de contact : l'equipe repond sous 24 h ; sujets :
question, abonnement/paiement, devenir tuteur, probleme technique,
partenariat).

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
- La section "Contenu disponible aujourd'hui" ci-dessous est la SOURCE DE
  VERITE sur le catalogue : sers-t'en pour repondre precisement aux questions
  "combien de cours / quelles lecons / qu'est-ce qui est gratuit". Presente
  toujours ces chiffres positivement : la plateforme est jeune et le catalogue
  s'enrichit chaque semaine.
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

  // Quota journalier : tout le monde sauf l'administrateur. Les visiteurs
  // anonymes sont comptes par adresse IP.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }
  if (!isAdmin) {
    const allowed = await consumeQuota(
      clientIdentity(req, user?.id),
      "chat",
      CHAT_DAILY_LIMIT,
    );
    if (!allowed) {
      return new Response(CHAT_LIMIT_MESSAGE, { status: 429 });
    }
  }

  // Donnees fraiches pour ancrer les prix et le catalogue reel.
  const [plans, catalogue] = await Promise.all([
    getPlans(),
    getCatalogueDigest(),
  ]);
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
          `\n## Formules actuelles\n${planText}\n\n## Moyens de paiement\n${methodText}\n` +
          `\n## Contenu disponible aujourd'hui (source de vérité)\n${catalogue}\n`,
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
