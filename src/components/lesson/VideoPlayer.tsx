// Provider-agnostic video player.
// Phase 0 renders a lightweight placeholder (no external requests, works offline
// and on slow connections). The real provider (Bunny Stream / Cloudflare Stream /
// YouTube) is wired in Phase 1 by branching on `provider` and returning the
// appropriate adaptive-bitrate embed. The rest of the app never changes.

import type { Activity } from "@/lib/content/types";

function formatDuration(sec?: number): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({ activity }: { activity: Activity }) {
  const duration = formatDuration(activity.durationSec);

  // TODO(Phase 1): switch(activity.videoProvider) -> real adaptive embed.
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
      <div className="relative flex aspect-video items-center justify-center bg-togo-green-900 text-center text-white">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <span aria-hidden className="text-2xl">
              ▶
            </span>
          </div>
          <p className="mt-3 text-sm font-medium">{activity.title}</p>
          {duration && (
            <p className="mt-1 text-xs text-togo-green-100">Durée {duration}</p>
          )}
          <p className="mt-1 text-[11px] text-togo-green-100/70">
            Lecteur vidéo adaptatif (démo)
          </p>
        </div>
      </div>
    </div>
  );
}
