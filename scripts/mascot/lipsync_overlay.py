#!/usr/bin/env python3
"""Incruste une mascotte 2D lip-syncee dans le coin d'une video de lecon.

Pipeline (aucune dependance Python lourde, juste ffmpeg + Rhubarb en binaires) :
  1. extraire l'audio de la video source (ffmpeg)
  2. Rhubarb Lip Sync -> cues de bouche horodatees (A..F, + G/H/X optionnels)
  3. construire un filtre ffmpeg : la mascotte de base (bouche fermee) toujours
     visible dans le coin, chaque forme de bouche superposee pendant sa fenetre
  4. re-encoder la video avec l'audio d'origine

Les images de la mascotte sont des PNG plein personnage, identiques a la forme de
bouche pres, nommes mascot-A.png ... mascot-F.png (+ G/H/X). Le compositeur
choisit la bonne image a chaque instant selon Rhubarb.

Usage :
  python scripts/mascot/lipsync_overlay.py --video lecon.mp4 --mascot-dir assets/prof-ama --out lecon_mascotte.mp4
  python scripts/mascot/lipsync_overlay.py --selftest        # verifie le cablage sans aucun asset

Prerequis :
  - ffmpeg : sur le PATH, ou via `pip install imageio-ffmpeg` (detecte automatiquement)
  - Rhubarb Lip Sync : https://github.com/DanielSWolf/rhubarb-lip-sync/releases
    (binaire `rhubarb` sur le PATH, ou --rhubarb /chemin/rhubarb). Pas requis pour --selftest.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

# Rhubarb emet des lettres A..H + X. On dessine A..F ; les formes manquantes
# retombent sur la plus proche disponible (au pire la bouche fermee A).
FALLBACK = {"A": "A", "B": "B", "C": "C", "D": "D", "E": "E", "F": "F",
            "G": "F", "H": "B", "X": "A"}

CORNER_POS = {
    "bottom-right": "W-w-{m}:H-h-{m}",
    "bottom-left": "{m}:H-h-{m}",
    "top-right": "W-w-{m}:{m}",
    "top-left": "{m}:{m}",
}


def find_ffmpeg(explicit=None):
    if explicit and Path(explicit).exists():
        return explicit
    on_path = shutil.which("ffmpeg")
    if on_path:
        return on_path
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit("ffmpeg introuvable. Installez-le, ou `pip install imageio-ffmpeg`.")


def find_rhubarb(explicit=None):
    if explicit and Path(explicit).exists():
        return explicit
    return shutil.which("rhubarb")


def run(cmd, **kw):
    return subprocess.run([str(c) for c in cmd], **kw)


def video_dims(ffmpeg, src):
    """Dimensions de la video sans ffprobe : on lit la banniere de `ffmpeg -i`."""
    r = run([ffmpeg, "-i", src], capture_output=True, text=True)
    m = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", r.stderr)
    if not m:
        m = re.search(r"\b(\d{3,5})x(\d{3,5})\b", r.stderr)
    if not m:
        print("  ! dimensions non detectees, defaut 1920x1080")
        return 1920, 1080
    return int(m.group(1)), int(m.group(2))


def extract_audio(ffmpeg, src, wav):
    # Rhubarb attend un WAV PCM 16 bits mono.
    run([ffmpeg, "-y", "-i", src, "-vn", "-ac", "1", "-ar", "44100",
         "-c:a", "pcm_s16le", wav], capture_output=True)


def run_rhubarb(rhubarb, wav, out_json, recognizer, extended):
    # phonetic = independant de la langue (indispensable pour le francais ;
    # pocketSphinx ne comprend que l'anglais).
    cmd = [rhubarb, "--recognizer", recognizer,
           "--extendedShapes", extended, "-f", "json", "-o", out_json, wav]
    print("  rhubarb", " ".join(cmd[1:]))
    r = run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"Rhubarb a echoue :\n{r.stderr[-800:]}")


def load_cues(path):
    cues = json.loads(Path(path).read_text())["mouthCues"]
    # fusionner les cues adjacentes de meme valeur
    merged = []
    for c in cues:
        if merged and merged[-1]["value"] == c["value"] and abs(merged[-1]["end"] - c["start"]) < 1e-3:
            merged[-1]["end"] = c["end"]
        else:
            merged.append(dict(c))
    return merged


def coalesce(wins, eps=0.02):
    wins = sorted(wins)
    out = []
    for s, e in wins:
        if out and s - out[-1][1] <= eps:
            out[-1] = (out[-1][0], max(out[-1][1], e))
        else:
            out.append([s, e])
    return out


def resolve(mascot_dir, shape):
    for cand in (shape, FALLBACK.get(shape, "A"), "A"):
        p = mascot_dir / f"mascot-{cand}.png"
        if p.exists():
            return p
    return None


def build(ffmpeg, video, mascot_dir, cues, out, height_frac, margin, corner):
    W, H = video_dims(ffmpeg, video)
    mh = max(2, int(H * height_frac))
    pos = CORNER_POS[corner].format(m=margin)

    base = resolve(mascot_dir, "A")
    if not base:
        sys.exit(f"mascot-A.png (bouche fermee) manquant dans {mascot_dir}")

    windows = defaultdict(list)
    for c in cues:
        windows[c["value"]].append((c["start"], c["end"]))

    # formes non-A dont l'image existe et differe de la base
    shapes = []
    for shape in sorted(windows):
        if shape == "A":
            continue
        p = resolve(mascot_dir, shape)
        if p and p != base:
            shapes.append((shape, p))

    inputs = ["-i", video, "-i", base]
    for _, p in shapes:
        inputs += ["-i", p]

    segs = [f"[1:v]scale=-1:{mh}:flags=lanczos[mA]"]
    for i, (shape, _) in enumerate(shapes):
        segs.append(f"[{2 + i}:v]scale=-1:{mh}:flags=lanczos[m{shape}]")
    # base toujours visible, puis chaque bouche superposee pendant ses fenetres
    segs.append(f"[0:v][mA]overlay={pos}[v0]")
    prev = "v0"
    for i, (shape, _) in enumerate(shapes):
        wins = coalesce(windows[shape])
        en = "+".join(f"between(t,{s:.3f},{e:.3f})" for s, e in wins)
        segs.append(f"[{prev}][m{shape}]overlay={pos}:enable='{en}'[v{i + 1}]")
        prev = f"v{i + 1}"
    fc = ";".join(segs)

    cmd = [ffmpeg, "-y", *inputs, "-filter_complex", fc,
           "-map", f"[{prev}]", "-map", "0:a?",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
           "-preset", "veryfast", "-c:a", "copy", "-movflags", "+faststart", out]
    print(f"  video {W}x{H}, mascotte {mh}px, {len(shapes)} formes actives")
    r = run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg (composite) a echoue :\n{r.stderr[-1200:]}")


def selftest(ffmpeg):
    """Genere une video + des mascottes bidon (boites colorees) + des cues
    synthetiques, et lance le compositeur. Aucun asset ni Rhubarb requis."""
    work = Path(tempfile.mkdtemp(prefix="mascot_selftest_"))
    print(f"selftest dans {work}")
    src = work / "source.mp4"
    run([ffmpeg, "-y", "-f", "lavfi", "-i", "color=c=navy:s=1280x720:d=5:r=30",
         "-f", "lavfi", "-i", "sine=frequency=220:duration=5",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
         src], capture_output=True)
    colors = {"A": "gray", "B": "red", "C": "orange", "D": "yellow", "E": "green", "F": "blue"}
    for shape, col in colors.items():
        run([ffmpeg, "-y", "-f", "lavfi", "-i", f"color=c={col}:s=300x450:d=1",
             "-frames:v", "1", work / f"mascot-{shape}.png"], capture_output=True)
    # cues : on alterne A..F toutes les 0.3 s sur 5 s
    seq = list("ABCDEF")
    cues, t = [], 0.0
    while t < 5.0:
        cues.append({"start": round(t, 2), "end": round(min(t + 0.3, 5.0), 2),
                     "value": seq[int(t / 0.3) % len(seq)]})
        t += 0.3
    (work / "cues.json").write_text(json.dumps({"mouthCues": cues}))
    out = work / "selftest_out.mp4"
    build(ffmpeg, src, work, cues, out, 0.42, 24, "bottom-right")
    ok = out.exists() and out.stat().st_size > 10_000
    # duree via banniere ffmpeg
    dur = run([ffmpeg, "-i", out], capture_output=True, text=True).stderr
    d = re.search(r"Duration: (\d+:\d+:\d+\.\d+)", dur)
    print(f"  -> {out} ({out.stat().st_size} octets, duree {d.group(1) if d else '?'})")
    print("SELFTEST:", "OK" if ok else "ECHEC")
    return ok


def main():
    ap = argparse.ArgumentParser(description="Incruster une mascotte lip-syncee dans une video.")
    ap.add_argument("--video")
    ap.add_argument("--mascot-dir")
    ap.add_argument("--out")
    ap.add_argument("--cues", help="cues.json Rhubarb precalcule (sinon on lance Rhubarb)")
    ap.add_argument("--rhubarb", help="chemin du binaire rhubarb")
    ap.add_argument("--ffmpeg", help="chemin du binaire ffmpeg")
    ap.add_argument("--recognizer", default="phonetic", choices=["phonetic", "pocketSphinx"])
    ap.add_argument("--extended", default="", help="formes etendues Rhubarb (ex 'GX'), '' = A-F seules")
    ap.add_argument("--height-frac", type=float, default=0.42, help="hauteur mascotte / hauteur video")
    ap.add_argument("--margin", type=int, default=24)
    ap.add_argument("--corner", default="bottom-right", choices=list(CORNER_POS))
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    ffmpeg = find_ffmpeg(args.ffmpeg)

    if args.selftest:
        sys.exit(0 if selftest(ffmpeg) else 1)

    if not (args.video and args.mascot_dir and args.out):
        ap.error("--video, --mascot-dir et --out sont requis (ou utilisez --selftest)")

    video = Path(args.video)
    mascot_dir = Path(args.mascot_dir)
    if not video.exists():
        sys.exit(f"video introuvable : {video}")
    if not mascot_dir.is_dir():
        sys.exit(f"dossier mascotte introuvable : {mascot_dir}")

    with tempfile.TemporaryDirectory(prefix="mascot_") as td:
        td = Path(td)
        if args.cues:
            cues_path = args.cues
        else:
            rhubarb = find_rhubarb(args.rhubarb)
            if not rhubarb:
                sys.exit("rhubarb introuvable. Installez-le, passez --rhubarb, ou fournissez --cues.")
            wav = td / "audio.wav"
            print("1/3 extraction audio")
            extract_audio(ffmpeg, video, wav)
            print("2/3 lip-sync Rhubarb")
            cues_path = td / "cues.json"
            run_rhubarb(rhubarb, wav, cues_path, args.recognizer, args.extended)
        cues = load_cues(cues_path)
        print(f"3/3 composite ({len(cues)} cues)")
        build(ffmpeg, video, mascot_dir, cues, args.out,
              args.height_frac, args.margin, args.corner)
    print(f"OK -> {args.out}")


if __name__ == "__main__":
    main()
