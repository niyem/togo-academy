"use client";

// Tuteur IA de la lecon : discussion ancree sur le contenu de la page.
// Reserve aux utilisateurs connectes (le serveur re-verifie les droits).

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explique-moi autrement",
  "Donne-moi un indice",
  "Un exercice pour m'entraîner",
];

export function TutorPanel({ lessonSlug }: { lessonSlug: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    const history = [...messages, { role: "user" as const, content: clean }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/tuteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug, messages: history }),
      });
      if (res.status === 401) throw new Error("login");
      if (!res.ok || !res.body) throw new Error("http");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setMessages([...history, { role: "assistant", content: current }]);
      }
    } catch (e) {
      setMessages([
        ...history,
        {
          role: "assistant",
          content:
            e instanceof Error && e.message === "login"
              ? "Connecte-toi pour discuter avec le tuteur : /connexion"
              : "Désolé, je n'arrive pas à répondre pour le moment. Réessaie dans un instant.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-togo-green-500 bg-togo-green-50/40 p-5">
      <p className="font-semibold">🤖 Ton tuteur pour cette leçon</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Pose ta question : il t&apos;explique autrement, te donne des indices
        (jamais la réponse directe !) et des exercices en plus.
      </p>

      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-togo-green-500 px-3 py-1.5 text-sm text-togo-green-700 hover:bg-togo-green-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-white p-3"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-togo-green-600 text-white"
                  : "border border-togo-green-100 bg-white text-ink"
              }`}
            >
              {m.content || "…"}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ta question sur la leçon..."
          className="min-w-0 flex-1 rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:border-togo-green-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-togo-green-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "…" : "Demander"}
        </button>
      </form>
    </div>
  );
}
