"use client";

// Assistant visiteurs : bouton flottant + panneau de discussion.
// Reponses en streaming depuis /api/chat (Claude). Leger : aucun etat global,
// historique en memoire de session uniquement.

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Bonjour 👋 Je suis l'assistant Togo Academy. Je peux t'aider à trouver un cours, comprendre les abonnements ou le paiement. Que cherches-tu ?",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ouverture automatique a l'arrivee sur le site (une fois par session de
  // navigation) : l'assistant ne passe pas inapercu, sans etre insistant.
  // Si l'utilisateur le ferme, il reste ferme jusqu'a la prochaine visite.
  useEffect(() => {
    if (sessionStorage.getItem("ta-chat-auto") === "1") return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("ta-chat-auto", "1");
      setOpen(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Le message d'accueil n'est pas envoye au modele.
        body: JSON.stringify({ messages: history.slice(1) }),
      });
      if (res.status === 429) {
        setMessages([
          ...history,
          { role: "assistant", content: await res.text() },
        ]);
        return;
      }
      if (!res.ok || !res.body) throw new Error("http");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setMessages([
          ...history,
          { role: "assistant", content: current },
        ]);
      }
    } catch {
      setMessages([
        ...history,
        {
          role: "assistant",
          content:
            "Désolé, je n'arrive pas à répondre pour le moment. Réessaie dans un instant ou écris-nous via /contact.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-togo-green-100 bg-togo-green-50 shadow-xl">
          <div className="flex items-center justify-between bg-togo-green-600 px-4 py-3 text-white">
            <p className="font-bold">Assistant Togo Academy</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="rounded-full px-2 text-lg leading-none hover:bg-togo-green-700"
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-togo-green-600 text-white"
                    : "border border-togo-green-100 bg-white text-ink"
                }`}
              >
                {m.content || "…"}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 border-t border-[var(--color-line)] p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ta question..."
              className="min-w-0 flex-1 rounded-full border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-togo-green-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Envoyer"}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir l'assistant"
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-togo-green-600 text-2xl text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
