"use client";

// Lecteur video avec quiz integres (style Coursera) :
// la video se met en pause aux points marques (atTimeSec), pose une question,
// donne un retour immediat (correct / faux) et propose "Reessayer" ou
// "Passer" avant de reprendre la lecture.
//
// Deux modes :
// - videoUrl fourni : vrai lecteur HTML5 (controles natifs : volume, avance,
//   plein ecran), checkpoints pilotes par timeupdate.
// - sans videoUrl : horloge de demonstration (lecon sans video hebergee).

import { useEffect, useRef, useState } from "react";
import type { Activity, QuizQuestion } from "@/lib/content/types";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  activity,
  videoUrl = null,
}: {
  activity: Activity;
  videoUrl?: string | null;
}) {
  const real = !!videoUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [realDuration, setRealDuration] = useState<number | null>(null);
  const duration = realDuration ?? activity.durationSec ?? 360;
  const checkpoints = (activity.questions ?? [])
    .filter((q) => typeof q.atTimeSec === "number")
    .sort((a, b) => (a.atTimeSec ?? 0) - (b.atTimeSec ?? 0));

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const done = useRef<Set<string>>(new Set());

  // Horloge de demo (uniquement sans video hebergee).
  useEffect(() => {
    if (real || !playing || active) return;
    const id = setInterval(() => setTime((t) => Math.min(t + 1, duration)), 1000);
    return () => clearInterval(id);
  }, [real, playing, active, duration]);

  // Declenchement des checkpoints (demo et reel).
  useEffect(() => {
    const hit = checkpoints.find(
      (q) => !done.current.has(q.id) && time >= (q.atTimeSec ?? 0),
    );
    if (hit && !active) {
      setActive(hit);
      setSelected(null);
      setPlaying(false);
      videoRef.current?.pause();
    }
  }, [time, checkpoints, active]);

  useEffect(() => {
    if (!real && time >= duration) setPlaying(false);
  }, [real, time, duration]);

  const isCorrect =
    active && selected
      ? active.options.find((o) => o.id === selected)?.correct === true
      : null;

  function resume(markDone: boolean) {
    if (active && markDone) done.current.add(active.id);
    setActive(null);
    setSelected(null);
    setPlaying(true);
    videoRef.current?.play().catch(() => {});
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
      <div
        className={`relative bg-togo-green-900 text-center text-white ${
          real ? "" : "flex aspect-video items-center justify-center"
        }`}
      >
        {/* Vrai lecteur : controles natifs (volume, avance, plein ecran). */}
        {real && (
          <video
            ref={videoRef}
            src={videoUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            className="block aspect-video w-full bg-black"
            onLoadedMetadata={(e) =>
              setRealDuration(e.currentTarget.duration || null)
            }
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}

        {!real && !active && (
          <div>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Lecture"}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl hover:bg-white/30"
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <p className="mt-3 text-sm font-medium">{activity.title}</p>
            <p className="mt-1 text-xs text-togo-green-100">
              {fmt(time)} / {fmt(duration)}
              {time >= duration && " · Terminé ✓"}
            </p>
            {checkpoints.length > 0 && (
              <p className="mt-1 text-[11px] text-togo-green-100/70">
                {checkpoints.length} question{checkpoints.length > 1 ? "s" : ""} pendant
                la vidéo
              </p>
            )}
          </div>
        )}

        {/* Question de checkpoint : la video est en pause. */}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-togo-green-900/95 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-4 text-left text-ink">
              <p className="text-xs font-bold uppercase tracking-wide text-togo-green-600">
                Question · vidéo en pause
              </p>
              <p className="mt-1 font-semibold">{active.prompt}</p>
              <div className="mt-3 space-y-2">
                {active.options.map((o) => {
                  let cls =
                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ";
                  if (selected === null) {
                    cls += "border-[var(--color-line)] hover:border-togo-green-500";
                  } else if (o.id === selected) {
                    cls += o.correct
                      ? "border-togo-green-500 bg-togo-green-50 font-semibold"
                      : "border-togo-red-500 bg-togo-red-100";
                  } else {
                    cls += "border-[var(--color-line)] opacity-60";
                  }
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={selected !== null}
                      onClick={() => setSelected(o.id)}
                      className={cls}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className="mt-3">
                  <p
                    className={`rounded-lg px-3 py-2 text-sm ${
                      isCorrect
                        ? "bg-togo-green-50 text-togo-green-700"
                        : "bg-togo-red-100 text-togo-red-700"
                    }`}
                  >
                    {isCorrect ? "✅ Correct ! " : "❌ Ce n'est pas ça. "}
                    {isCorrect ? active.explanation : ""}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {isCorrect ? (
                      <button
                        type="button"
                        onClick={() => resume(true)}
                        className="rounded-full bg-togo-green-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Continuer la vidéo
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelected(null)}
                          className="rounded-full bg-togo-green-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Réessayer
                        </button>
                        <button
                          type="button"
                          onClick={() => resume(true)}
                          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)]"
                        >
                          Passer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barre de progression avec reperes des questions. */}
      <div className="relative h-2 bg-white">
        <div
          className="h-full bg-togo-green-500 transition-[width]"
          style={{ width: `${(time / duration) * 100}%` }}
        />
        {checkpoints.map((q) => (
          <div
            key={q.id}
            title="Question"
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-togo-yellow-400"
            style={{ left: `calc(${((q.atTimeSec ?? 0) / duration) * 100}% - 6px)` }}
          />
        ))}
      </div>
    </div>
  );
}
