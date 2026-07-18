"use client";

// Mode presentateur : affiche les VRAIES diapos PowerPoint (rendues en images)
// en plein ecran, navigation clavier/clic, avec les notes a lire. Fidele au
// .pptx (logos, mise en page, couleurs).

import { useCallback, useEffect, useRef, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export function DeckPresenter({
  slug,
  notes,
  deckName,
}: {
  slug: string;
  notes: string[];
  deckName: string;
}) {
  const count = notes.length;
  const [i, setI] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [fs, setFs] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (d: number) => setI((v) => Math.min(count - 1, Math.max(0, v + d))),
    [count],
  );

  const toggleFullscreen = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(count - 1);
      else if (e.key.toLowerCase() === "n") setShowNotes((v) => !v);
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, count, toggleFullscreen]);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const src = `/presentations/${slug}/${pad(i + 1)}.png`;

  return (
    <div className="space-y-4">
      {/* Scene : la vraie diapo sur fond noir. En plein ecran, l'image tient
          entiere (object-contain sur tout l'ecran), jamais rognee. */}
      <div
        ref={stageRef}
        className={`relative flex items-center justify-center overflow-hidden bg-black ${
          fs ? "h-screen w-screen rounded-none" : "aspect-[16/9] w-full rounded-2xl"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${deckName} — diapo ${i + 1}`} className="max-h-full max-w-full object-contain" draggable={false} />

        {/* Précharge la diapo suivante */}
        {i + 1 < count && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/presentations/${slug}/${pad(i + 2)}.png`} alt="" className="hidden" />
        )}

        <button type="button" aria-label="Diapo précédente" onClick={() => go(-1)} className="absolute inset-y-0 left-0 w-1/5 cursor-w-resize focus:outline-none" />
        <button type="button" aria-label="Diapo suivante" onClick={() => go(1)} className="absolute inset-y-0 right-0 w-1/5 cursor-e-resize focus:outline-none" />

        {fs && showNotes && notes[i] && (
          <div className="absolute inset-x-0 bottom-0 max-h-[30%] overflow-auto bg-black/80 px-6 py-4 text-left text-[15px] leading-relaxed text-white">
            {notes[i]}
          </div>
        )}

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button type="button" onClick={() => setShowNotes((v) => !v)} className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70">
            {showNotes ? "Masquer notes (N)" : "Afficher notes (N)"}
          </button>
          <button type="button" onClick={toggleFullscreen} className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70">
            {fs ? "Quitter (F)" : "Plein écran (F)"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} disabled={i === 0} className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold hover:border-togo-green-500 disabled:opacity-40">
            ← Précédente
          </button>
          <button type="button" onClick={() => go(1)} disabled={i === count - 1} className="rounded-full bg-togo-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Suivante →
          </button>
        </div>
        <div className="text-sm text-[var(--color-muted)]">
          {deckName} · diapo {i + 1} / {count}
        </div>
      </div>

      {showNotes && notes[i] && (
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-togo-green-700">
            Notes du présentateur · à lire
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/90">{notes[i]}</p>
        </div>
      )}
    </div>
  );
}
