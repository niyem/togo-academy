"""
Pilote video : "Decouvrir le theoreme de Thales" (3eme, Mathematiques).

5 scenes calees sur 5 segments de narration (voix Monsieur A) :
  1. Intro mascotte + titre
  2. La configuration de Thales (construction animee)
  3. Les trois rapports egaux
  4. Exemple resolu (AN = 4,8 cm)
  5. Outro mascotte (encouragement)

Prerequis : les mp3 de narration dans video/pilot/audio/seg{1..5}.mp3
et les images mascotte dans Desktop/COWORK/togo-academy-mascot/.
"""

import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image

from kademy import (
    FFMPEG, GREEN, GREEN_DARK, INK, MUTED, RED, W, H,
    audio_duration, concat, dot_label, fraction, image_paste, line_draw,
    mux, parallel_marks, render_scene, rounded_box, text_fade, video_sprite,
)

BASE = os.path.dirname(os.path.abspath(__file__))
PILOT = os.path.join(BASE, "pilot")
AUDIO = os.path.join(PILOT, "audio")
ASSETS = os.path.join(PILOT, "assets")
OUT = os.path.join(PILOT, "out")
MASCOT_DIR = "/Users/nbawana/Desktop/COWORK/togo-academy-mascot"

for d in (ASSETS, OUT):
    os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------------------
# Assets mascotte : reference complete + poses recadrees depuis la planche
# ---------------------------------------------------------------------------
REF = os.path.join(MASCOT_DIR, "monsieur-a-reference.png")
SHEET = os.path.join(MASCOT_DIR, "monsieur-a-pose-sheet.png")

WAVE = os.path.join(ASSETS, "pose-wave.png")
CELEBRATE = os.path.join(ASSETS, "pose-celebrate.png")

sheet = Image.open(SHEET)
cw, ch = sheet.width / 3, sheet.height / 2
sheet.crop((8, 6, int(cw) - 8, int(ch) - 4)).save(WAVE)          # haut-gauche
sheet.crop((4, int(ch) + 4, int(cw) - 6, sheet.height - 4)).save(CELEBRATE)

# ---------------------------------------------------------------------------
# Geometrie de la configuration de Thales (pleine taille)
# ---------------------------------------------------------------------------
A = (230, 400)
B = (1000, 205)
C = (1005, 595)
K = 0.55
M = (A[0] + K * (B[0] - A[0]), A[1] + K * (B[1] - A[1]))
N = (A[0] + K * (C[0] - A[0]), A[1] + K * (C[1] - A[1]))


def extend(p1, p2, before=0.06, after=0.08):
    """Prolonge un segment des deux cotes (pour dessiner une 'droite')."""
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    return ((p1[0] - dx * before, p1[1] - dy * before),
            (p2[0] + dx * after, p2[1] + dy * after))


def tf(pt, s, dx, dy):
    return (pt[0] * s + dx, pt[1] * s + dy)


def mini_config(s=0.5, dx=-30, dy=110, with_labels=True):
    """Configuration complete, statique, reduite (pour scenes 3 et 4)."""
    a, b, c = tf(A, s, dx, dy), tf(B, s, dx, dy), tf(C, s, dx, dy)
    m, n = tf(M, s, dx, dy), tf(N, s, dx, dy)
    anims = []
    e1, e2 = extend(a, b)
    anims.append(line_draw(0, 0, e1, e2, INK, 4))
    e1, e2 = extend(a, c)
    anims.append(line_draw(0, 0, e1, e2, INK, 4))
    e1, e2 = extend(m, n, 0.25, 0.25)
    anims.append(line_draw(0, 0, e1, e2, GREEN, 4))
    e1, e2 = extend(b, c, 0.25, 0.25)
    anims.append(line_draw(0, 0, e1, e2, GREEN, 4))
    if with_labels:
        anims.append(dot_label(0, 0, a, "A", (-26, -6), INK, 5, 24))
        anims.append(dot_label(0, 0, m, "M", (-4, -30), INK, 5, 24))
        anims.append(dot_label(0, 0, b, "B", (14, -26), INK, 5, 24))
        anims.append(dot_label(0, 0, n, "N", (-4, 14), INK, 5, 24))
        anims.append(dot_label(0, 0, c, "C", (14, 6), INK, 5, 24))
    return anims, (a, m, n, b, c)


# ---------------------------------------------------------------------------
# Clips mascotte animes (parole + gestes), avec repli sur image fixe
# ---------------------------------------------------------------------------
INTRO_CLIP = os.path.join(ASSETS, "intro-clip.mp4")
OUTRO_CLIP = os.path.join(ASSETS, "outro-clip.mp4")


def ensure_frames(clip, dirname, height=520):
    """Extrait les images d'un clip a EXTRACT_FPS ; renvoie le dossier."""
    d = os.path.join(ASSETS, dirname)
    if not (os.path.isdir(d) and os.listdir(d)):
        os.makedirs(d, exist_ok=True)
        subprocess.run(
            [FFMPEG, "-y", "-i", clip, "-r", "15",
             "-vf", f"scale=-2:{height}", os.path.join(d, "f%04d.png")],
            check=True, capture_output=True)
    return d


def mascot(t0, t1, clip, dirname, center, height, dur, fallback_img):
    """Mascotte animee si le clip existe, sinon image fixe."""
    if os.path.exists(clip):
        frames = ensure_frames(clip, dirname)
        return video_sprite(t0, t1, frames, center, height,
                            (t1 - t0) * dur)
    return image_paste(t0, min(t0 + 0.25, t1), fallback_img, center, height)


# ---------------------------------------------------------------------------
# Scene 1 : intro
# ---------------------------------------------------------------------------
def scene_intro(dur):
    return [
        mascot(0.0, 1.0, INTRO_CLIP, "intro-frames", (940, 390), 500,
               dur, REF),
        text_fade(0.10, 0.30, (370, 270), "Le théorème de Thalès",
                  42, GREEN_DARK),
        line_draw(0.28, 0.40, (170, 315), (570, 315), GREEN, 4),
        text_fade(0.35, 0.55, (370, 360), "Mathématiques · Classe de 3ème",
                  28, MUTED, bold=False),
        text_fade(0.55, 0.75, (370, 420), "avec Monsieur A", 26, GREEN),
    ]


# ---------------------------------------------------------------------------
# Scene 2 : la configuration
# ---------------------------------------------------------------------------
def scene_configuration(dur):
    anims = [
        text_fade(0.02, 0.10, (W / 2, 64), "La configuration de Thalès",
                  38, GREEN_DARK),
    ]
    e1, e2 = extend(A, B)
    anims.append(line_draw(0.08, 0.22, e1, e2, INK, 5))
    anims.append(dot_label(0.10, 0.16, A, "A", (-32, -8), INK, 7, 30))
    e1, e2 = extend(A, C)
    anims.append(line_draw(0.18, 0.32, e1, e2, INK, 5))
    anims.append(dot_label(0.34, 0.40, M, "M", (-6, -36), INK, 7, 30))
    anims.append(dot_label(0.40, 0.46, B, "B", (16, -32), INK, 7, 30))
    anims.append(dot_label(0.47, 0.53, N, "N", (-6, 18), INK, 7, 30))
    anims.append(dot_label(0.53, 0.59, C, "C", (16, 6), INK, 7, 30))
    e1, e2 = extend(M, N, 0.22, 0.22)
    anims.append(line_draw(0.62, 0.74, e1, e2, GREEN, 5))
    e1, e2 = extend(B, C, 0.22, 0.22)
    anims.append(line_draw(0.70, 0.82, e1, e2, GREEN, 5))
    anims.append(parallel_marks(0.83, 0.90, M, N))
    anims.append(parallel_marks(0.86, 0.93, B, C))
    anims.append(text_fade(0.88, 0.97, (W / 2, 668),
                           "(MN) et (BC) sont parallèles", 30, GREEN))
    return anims


# ---------------------------------------------------------------------------
# Scene 3 : les trois rapports egaux
# ---------------------------------------------------------------------------
def scene_rapports(dur):
    anims, _ = mini_config()
    anims.append(text_fade(0.02, 0.10, (W / 2, 64),
                           "Le théorème de Thalès", 38, GREEN_DARK))
    y = 330
    anims.append(fraction(0.22, 0.34, (760, y), "AM", "AB", 40, INK))
    anims.append(text_fade(0.36, 0.44, (855, y), "=", 44, INK))
    anims.append(fraction(0.44, 0.56, (950, y), "AN", "AC", 40, INK))
    anims.append(text_fade(0.58, 0.66, (1045, y), "=", 44, INK))
    anims.append(fraction(0.64, 0.76, (1140, y), "MN", "BC", 40, INK))
    anims.append(rounded_box(0.80, 0.90, (690, 258, 1215, 402)))
    anims.append(text_fade(0.86, 0.96, (950, 470),
                           "Trois rapports égaux !", 32, GREEN))
    return anims


# ---------------------------------------------------------------------------
# Scene 4 : exemple resolu
# ---------------------------------------------------------------------------
def scene_exemple(dur):
    anims, (a, m, n, b, c) = mini_config()
    anims.append(text_fade(0.02, 0.10, (W / 2, 64),
                           "Exemple : calculer AN", 38, GREEN_DARK))
    # Donnees sur la figure
    anims.append(text_fade(0.06, 0.16, (150, 250), "AM = 3 cm", 26, GREEN))
    anims.append(text_fade(0.10, 0.20, (520, 165), "AB = 5 cm", 26, INK))
    anims.append(text_fade(0.14, 0.24, (530, 455), "AC = 8 cm", 26, INK))
    anims.append(text_fade(0.18, 0.28, (150, 380), "AN = ?", 30, RED))
    # Etapes de calcul
    anims.append(fraction(0.28, 0.38, (800, 205), "AM", "AB", 32, INK))
    anims.append(text_fade(0.38, 0.44, (880, 205), "=", 36, INK))
    anims.append(fraction(0.42, 0.52, (960, 205), "AN", "AC", 32, INK))
    anims.append(text_fade(0.50, 0.60, (900, 315),
                           "AN = AC × (AM / AB)", 32, INK))
    anims.append(text_fade(0.62, 0.72, (900, 385),
                           "AN = 8 × 3/5", 32, INK))
    anims.append(text_fade(0.74, 0.84, (900, 475),
                           "AN = 4,8 cm", 46, GREEN))
    anims.append(rounded_box(0.82, 0.92, (740, 435, 1060, 515)))
    return anims


# ---------------------------------------------------------------------------
# Scene 5 : outro
# ---------------------------------------------------------------------------
def scene_outro(dur):
    return [
        mascot(0.0, 1.0, OUTRO_CLIP, "outro-frames", (640, 290), 400,
               dur, CELEBRATE),
        text_fade(0.30, 0.50, (640, 560), "À toi de jouer !",
                  46, GREEN_DARK),
        text_fade(0.50, 0.70, (640, 620),
                  "Fais les exercices et le quiz de la leçon", 28, MUTED,
                  bold=False),
    ]


# ---------------------------------------------------------------------------
# Assemblage
# ---------------------------------------------------------------------------
SCENES = [
    ("seg1", scene_intro, 0.4),
    ("seg2", scene_configuration, 0.7),
    ("seg3", scene_rapports, 0.7),
    ("seg4", scene_exemple, 0.7),
    ("seg5", scene_outro, 0.4),
]


def main():
    parts = []
    for name, builder, pad in SCENES:
        mp3 = os.path.join(AUDIO, f"{name}.mp3")
        dur = audio_duration(mp3) + pad
        silent = os.path.join(OUT, f"{name}-silent.mp4")
        final = os.path.join(OUT, f"{name}.mp4")
        print(f"[{name}] {dur:.1f}s : rendu...", flush=True)
        render_scene(silent, dur, builder(dur))
        mux(silent, mp3, final, dur)
        parts.append(final)

    out = os.path.join(OUT, "pilote-thales.mp4")
    concat(parts, out, os.path.join(OUT, "concat.txt"))
    print(f"OK : {out}")


if __name__ == "__main__":
    main()
