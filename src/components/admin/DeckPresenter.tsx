"use client";

// Mode presentateur web : affiche un deck plein ecran, navigation clavier/souris,
// avec les notes a lire. Aucune dependance externe.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Block, Slide } from "@/lib/presentations/decks";

function Cards({ items, cols = 2 }: { items: { icon?: string; title: string; body?: string }[]; cols?: number }) {
  const grid = cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`grid gap-3 ${grid}`}>
      {items.map((c) => (
        <div key={c.title} className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-4 text-left">
          <div className="flex items-center gap-2">
            {c.icon && <span className="text-2xl">{c.icon}</span>}
            <span className="font-display font-bold text-ink">{c.title}</span>
          </div>
          {c.body && <p className="mt-1.5 text-sm leading-snug text-[var(--color-muted)]">{c.body}</p>}
        </div>
      ))}
    </div>
  );
}

function Renderer({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return (
        <div className="space-y-3 text-left">
          {block.paragraphs.map((p, i) => (
            <p key={i} className="text-lg leading-relaxed text-ink/90">{p}</p>
          ))}
        </div>
      );
    case "cards":
      return <Cards items={block.items} cols={block.cols} />;
    case "stats":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {block.items.map((s) => (
            <div key={s.label} className="rounded-2xl border border-togo-green-100 bg-white p-4 text-center">
              <div className="font-display text-2xl font-extrabold text-togo-green-700 sm:text-3xl">{s.big}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      );
    case "steps":
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {block.items.map((s) => (
            <div key={s.title} className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-4 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-togo-green-600 font-display text-xl font-extrabold text-white">
                {s.n}
              </div>
              <div className="mt-3 font-display font-bold text-ink">{s.title}</div>
              <p className="mt-1 text-sm leading-snug text-[var(--color-muted)]">{s.body}</p>
            </div>
          ))}
        </div>
      );
    case "tiles":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {block.items.map((t) => (
            <div key={t.label} className="flex items-center gap-3 rounded-2xl border border-togo-green-100 bg-togo-green-50 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-togo-green-600 text-xl">{t.icon}</span>
              <span className="font-display font-semibold text-ink">{t.label}</span>
            </div>
          ))}
        </div>
      );
    case "faq":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map((f) => (
            <div key={f.q} className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-4 text-left">
              <div className="font-display font-bold text-togo-green-700">{f.q}</div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{f.a}</p>
            </div>
          ))}
        </div>
      );
    case "pricing":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {block.items.map((p) => (
            <div
              key={p.label}
              className={`rounded-2xl p-6 text-left ${
                p.featured
                  ? "bg-togo-green-700 text-white"
                  : "border border-togo-green-100 bg-togo-green-50 text-ink"
              }`}
            >
              <div className={`text-xs font-bold uppercase tracking-widest ${p.featured ? "text-togo-yellow-400" : "text-togo-green-700"}`}>
                {p.label}
              </div>
              <div className="mt-2 font-display text-3xl font-extrabold">{p.price}</div>
              <ul className="mt-4 space-y-2">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2 text-sm">
                    <span className={p.featured ? "text-togo-yellow-400" : "text-togo-green-600"}>✓</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "twocol":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {[block.left, block.right].map((c) => (
            <div key={c.title} className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-5 text-left">
              <div className="font-display font-bold text-togo-green-700">{c.title}</div>
              <ul className="mt-3 space-y-2">
                {c.items.map((it) => (
                  <li key={it} className="flex gap-2 text-sm text-ink/90">
                    <span className="text-togo-green-600">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
  }
}

function SlideView({ slide }: { slide: Slide }) {
  if (slide.kind === "cover" || slide.kind === "closing") {
    return (
      <div className="flex h-full flex-col justify-center bg-togo-green-700 px-[6%] py-[5%] text-white">
        <div className="text-sm font-bold uppercase tracking-[0.2em] text-togo-yellow-400">{slide.kicker}</div>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">{slide.title}</h1>
        {slide.kind === "cover" ? (
          <>
            <p className="mt-5 max-w-3xl text-lg text-togo-green-50">{slide.subtitle}</p>
            <p className="mt-6 text-sm text-togo-green-50">
              Présenté par <span className="font-bold text-white">{slide.presenter}</span>
            </p>
          </>
        ) : (
          <>
            <p className="mt-5 max-w-3xl text-lg text-togo-green-50">{slide.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {slide.contacts.map((c) => (
                <span key={c} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">{c}</span>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col bg-white px-[5%] py-[4%]">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-togo-green-600">{slide.kicker}</div>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{slide.title}</h2>
      <div className="mt-5 flex flex-1 flex-col justify-center gap-4 overflow-auto">
        {slide.blocks.map((b, i) => (
          <Renderer key={i} block={b} />
        ))}
      </div>
    </div>
  );
}

export function DeckPresenter({ slides, deckName }: { slides: Slide[]; deckName: string }) {
  const [i, setI] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [fs, setFs] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (d: number) => setI((v) => Math.min(slides.length - 1, Math.max(0, v + d))),
    [slides.length],
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
      else if (e.key === "End") setI(slides.length - 1);
      else if (e.key.toLowerCase() === "n") setShowNotes((v) => !v);
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, slides.length, toggleFullscreen]);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const slide = slides[i];

  return (
    <div className="space-y-4">
      {/* Scene 16:9 (plein ecran via l'API Fullscreen) */}
      <div ref={stageRef} className="relative overflow-hidden rounded-2xl bg-black">
        <div className="aspect-[16/9] w-full">
          <SlideView slide={slide} />
        </div>

        {/* Zones de clic gauche/droite pour avancer */}
        <button
          type="button"
          aria-label="Diapo précédente"
          onClick={() => go(-1)}
          className="absolute inset-y-0 left-0 w-1/6 cursor-w-resize focus:outline-none"
        />
        <button
          type="button"
          aria-label="Diapo suivante"
          onClick={() => go(1)}
          className="absolute inset-y-0 right-0 w-1/6 cursor-e-resize focus:outline-none"
        />

        {/* Notes en surimpression quand on est en plein ecran */}
        {fs && showNotes && slide.notes && (
          <div className="absolute inset-x-0 bottom-0 max-h-[32%] overflow-auto bg-black/80 px-6 py-4 text-left text-[15px] leading-relaxed text-white">
            {slide.notes}
          </div>
        )}

        {/* Barre de controle */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button type="button" onClick={() => setShowNotes((v) => !v)} className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70">
            {showNotes ? "Masquer notes (N)" : "Afficher notes (N)"}
          </button>
          <button type="button" onClick={toggleFullscreen} className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70">
            {fs ? "Quitter (F)" : "Plein écran (F)"}
          </button>
        </div>
      </div>

      {/* Barre de navigation sous la scene */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} disabled={i === 0} className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold hover:border-togo-green-500 disabled:opacity-40">
            ← Précédente
          </button>
          <button type="button" onClick={() => go(1)} disabled={i === slides.length - 1} className="rounded-full bg-togo-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Suivante →
          </button>
        </div>
        <div className="text-sm text-[var(--color-muted)]">
          {deckName} · diapo {i + 1} / {slides.length}
        </div>
      </div>

      {/* Notes du presentateur (hors plein ecran) */}
      {showNotes && slide.notes && (
        <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-togo-green-700">
            Notes du présentateur · à lire
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/90">{slide.notes}</p>
        </div>
      )}
    </div>
  );
}
