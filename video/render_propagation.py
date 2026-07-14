"""
Video 1 : "Propagation d'une onde" (Terminale A, physique, format APC).

6 scenes calees sur 6 segments de narration (voix Andre) :
  1. Intro : titre + mascotte animee en coin (clip lip-sync)
  2. La situation de Koffi (orage, distance, delai, lagune)
  3. Phenomenes periodiques (pendule, N = 1/T)
  4. Signal et onde (cercles concentriques, bouchon, definition)
  5. La celerite (formule, calcul resolu, comparaison son/lumiere)
  6. Outro : bravo + teaser video 2, mascotte animee en coin

La mascotte (a l'image du fondateur) vit dans le coin superieur droit :
clip synchronise sur les scenes 1 et 6, image fixe sur les scenes 2 a 5.

Prerequis :
  - mp3 : Desktop/COWORK/TOGO-ACADEMY/pilote/voix-propagation/seg{1..6}-*.mp3
  - clips mascotte : video/propagation/assets/{intro,outro}-clip.mp4
  - image mascotte : Desktop/COWORK/TOGO-ACADEMY/mascot/mascotte-niyem-essai-2.png
"""

import glob
import math
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image

from kademy import (
    Anim, BG, EXTRACT_FPS, FFMPEG, GREEN, GREEN_DARK, INK, LINE, MUTED, RED,
    W, H, YELLOW, YELLOW_DARK, audio_duration, concat, font, fraction,
    lerp, mix, mux, render_scene, rounded_box, text_fade,
)

BASE = os.path.dirname(os.path.abspath(__file__))
PROP = os.path.join(BASE, "propagation")
ASSETS = os.path.join(PROP, "assets")
OUT = os.path.join(PROP, "out")
VOIX = "/Users/nbawana/Desktop/COWORK/TOGO-ACADEMY/pilote/voix-julian"
MASCOTTE = "/Users/nbawana/Desktop/COWORK/TOGO-ACADEMY/mascot/mascotte-niyem-essai-2.png"

for d in (ASSETS, OUT):
    os.makedirs(d, exist_ok=True)

SEGS = {
    1: "seg1-intro.mp3", 2: "seg2-situation.mp3", 3: "seg3-periodiques.mp3",
    4: "seg4-signal-onde.mp3", 5: "seg5-celerite.mp3", 6: "seg6-outro.mp3",
}

# ---------------------------------------------------------------------------
# Coin mascotte (haut droit) : cadre commun aux 6 scenes
# ---------------------------------------------------------------------------
C_H = 198                      # hauteur du clip dans le coin
C_W = int(C_H * 16 / 9)        # largeur (clips 16:9)
C_BOX = (W - C_W - 28, 34, W - 28, 34 + C_H)  # cadre du coin
C_CENTER = ((C_BOX[0] + C_BOX[2]) / 2, (C_BOX[1] + C_BOX[3]) / 2)


def ensure_frames(clip: str, dirname: str) -> str:
    """Extrait les images du clip mascotte a EXTRACT_FPS (une seule fois)."""
    frames = os.path.join(ASSETS, dirname)
    if not glob.glob(os.path.join(frames, "*.png")):
        os.makedirs(frames, exist_ok=True)
        subprocess.run([
            FFMPEG, "-y", "-i", clip, "-vf", f"fps={EXTRACT_FPS}",
            os.path.join(frames, "f%04d.png"),
        ], check=True, capture_output=True)
    return frames


def corner_clip(clip: str, dirname: str, window_sec: float) -> Anim:
    """Clip mascotte dans le coin : lecture UNE FOIS a vitesse naturelle,
    puis gel sur la derniere image (pas de ping-pong : la bouche doit rester
    calee sur la voix)."""
    frames_dir = ensure_frames(clip, dirname)
    files = sorted(glob.glob(os.path.join(frames_dir, "*.png")))
    seq = []
    for fp in files:
        im = Image.open(fp).convert("RGB")
        w2 = int(im.width * C_H / im.height)
        seq.append(im.resize((w2, C_H), Image.LANCZOS))

    def fn(img, d, p):
        idx = min(int(p * window_sec * EXTRACT_FPS), len(seq) - 1)
        im = seq[idx]
        img.paste(im, (int(C_CENTER[0] - im.width / 2),
                       int(C_CENTER[1] - im.height / 2)))
        d.rounded_rectangle(C_BOX, radius=12, outline=GREEN_DARK, width=4)
    return Anim(0.0, 1.0, fn, linear=True)


_corner_still_cache = {}


def corner_still() -> Anim:
    """Mascotte fixe dans le coin (scenes de tableau blanc)."""
    def fn(img, d, p):
        if "im" not in _corner_still_cache:
            src = Image.open(MASCOTTE).convert("RGB")
            h2 = C_H
            w2 = int(src.width * h2 / src.height)
            _corner_still_cache["im"] = src.resize((w2, h2), Image.LANCZOS)
        im = _corner_still_cache["im"]
        # cadre carre plus discret pour l'image fixe
        box = (W - im.width - 28, 34, W - 28, 34 + C_H)
        img.paste(im, (box[0], box[1]))
        d.rounded_rectangle(box, radius=12, outline=LINE, width=4)
    return Anim(0.0, 1.0, fn)


# ---------------------------------------------------------------------------
# Petits dessins reutilisables
# ---------------------------------------------------------------------------
def cloud_bolt(t0, t1, cx, cy, scale=1.0) -> Anim:
    """Nuage + eclair jaune qui apparaissent."""
    def fn(img, d, p):
        c = mix(BG, MUTED, min(1.0, p * 2))
        s = scale
        for dx, dy, r in ((-55, 8, 38), (0, -12, 48), (55, 8, 38), (0, 18, 42)):
            d.ellipse([cx + dx * s - r * s, cy + dy * s - r * s,
                       cx + dx * s + r * s, cy + dy * s + r * s], fill=c)
        if p > 0.5:
            q = (p - 0.5) / 0.5
            col = mix(BG, YELLOW_DARK, q)
            pts = [(cx, cy + 40 * s), (cx - 22 * s, cy + 110 * s),
                   (cx + 2 * s, cy + 105 * s), (cx - 14 * s, cy + 175 * s),
                   (cx + 34 * s, cy + 95 * s), (cx + 8 * s, cy + 100 * s),
                   (cx + 26 * s, cy + 42 * s)]
            d.polygon(pts, fill=col)
    return Anim(t0, t1, fn)


def stick_figure(t0, t1, x, y, color=INK) -> Anim:
    """Silhouette simple (Koffi) qui apparait."""
    def fn(img, d, p):
        c = mix(BG, color, p)
        d.ellipse([x - 14, y - 78, x + 14, y - 50], outline=c, width=4)
        d.line([(x, y - 50), (x, y - 10)], fill=c, width=4)
        d.line([(x, y - 42), (x - 20, y - 22)], fill=c, width=4)
        d.line([(x, y - 42), (x + 20, y - 22)], fill=c, width=4)
        d.line([(x, y - 10), (x - 16, y + 22)], fill=c, width=4)
        d.line([(x, y - 10), (x + 16, y + 22)], fill=c, width=4)
    return Anim(t0, t1, fn)


def waves(t0, t1, x0, x1, y, color=GREEN, n=4) -> Anim:
    """Vaguelettes (arcs) qui se tracent."""
    def fn(img, d, p):
        c = mix(BG, color, p)
        span = (x1 - x0) / n
        for i in range(n):
            bx = x0 + i * span
            d.arc([bx, y - 14, bx + span, y + 14], 180, 360, fill=c, width=4)
    return Anim(t0, t1, fn)


def pendulum(t0, t1, pivot, length, window_sec) -> Anim:
    """Pendule qui oscille naturellement pendant la fenetre."""
    def fn(img, d, p):
        px, py = pivot
        d.line([(px - 46, py), (px + 46, py)], fill=INK, width=5)
        ang = 0.55 * math.sin(2 * math.pi * (p * window_sec) / 2.2)
        bx = px + length * math.sin(ang)
        by = py + length * math.cos(ang)
        d.line([(px, py), (bx, by)], fill=MUTED, width=4)
        d.ellipse([bx - 18, by - 18, bx + 18, by + 18], fill=GREEN)
        # positions extremes en pointille
        for a in (-0.55, 0.55):
            ex = px + length * math.sin(a)
            ey = py + length * math.cos(a)
            d.line([(px, py), (ex, ey)], fill=LINE, width=2)
    return Anim(t0, t1, fn, linear=True)


def ripples(t0, t1, center, max_r, window_sec, color=GREEN) -> Anim:
    """Cercles concentriques qui s'etendent depuis la source."""
    def fn(img, d, p):
        cx, cy = center
        d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=color)
        elapsed = p * window_sec
        for k in range(4):
            r = ((elapsed * 46 - k * 34) % max_r)
            if r > 8:
                fade = 1.0 - r / max_r
                c = mix(BG, color, max(0.15, fade))
                d.ellipse([cx - r, cy - r * 0.42, cx + r, cy + r * 0.42],
                          outline=c, width=3)
    return Anim(t0, t1, fn, linear=True)


def bobbing_cork(t0, t1, x, y, window_sec) -> Anim:
    """Onde sinusoidale + bouchon qui oscille verticalement sur place."""
    def fn(img, d, p):
        elapsed = p * window_sec
        phase = elapsed * 2.6
        pts = []
        for i in range(0, 361, 6):
            xx = x - 180 + i
            yy = y + 22 * math.sin(i / 34 - phase)
            pts.append((xx, yy))
        d.line(pts, fill=GREEN, width=4)
        by = y + 22 * math.sin((180) / 34 - phase)
        d.ellipse([x - 12, by - 26, x + 12, by - 2], fill=YELLOW_DARK)
        d.line([(x, y + 44), (x, y + 64)], fill=LINE, width=3)
    return Anim(t0, t1, fn, linear=True)


def multi_text(t0, t1, pos, lines, size=30, color=INK, gap=44,
               bold=True, anchor="lm"):
    return [text_fade(t0 + i * 0.02, t1 + i * 0.02, (pos[0], pos[1] + i * gap),
                      ln, size=size, color=color, bold=bold, anchor=anchor)
            for i, ln in enumerate(lines)]


def title(txt, sub=None):
    anims = [text_fade(0.0, 0.06, (60, 70), txt, size=44, color=GREEN_DARK,
                       anchor="lm")]
    if sub:
        anims.append(text_fade(0.02, 0.08, (60, 118), sub, size=26,
                               color=MUTED, bold=False, anchor="lm"))
    return anims


# ---------------------------------------------------------------------------
# Scenes
# ---------------------------------------------------------------------------
def scene1(dur):
    return [

        text_fade(0.05, 0.2, (60, 200), "PHYSIQUE · TERMINALE A", size=24,
                  color=GREEN, anchor="lm"),
        text_fade(0.1, 0.3, (60, 280), "Propagation d'une onde", size=58,
                  anchor="lm"),
        text_fade(0.15, 0.35, (60, 350), "Nature de la lumière", size=40,
                  color=MUTED, anchor="lm"),
        cloud_bolt(0.4, 0.7, 260, 480, scale=0.9),
        text_fade(0.55, 0.75, (420, 540), "Pourquoi l'éclair avant le tonnerre ?",
                  size=32, color=INK, anchor="lm"),
    ]


def scene2(dur):
    return [

        *title("La situation", "Ce que Koffi a observé"),
        cloud_bolt(0.05, 0.2, 220, 260),
        stick_figure(0.1, 0.22, 760, 520),
        Anim(0.12, 0.3, lambda img, d, p: d.line(
            [(150, 560), (830, 560)], fill=mix(BG, LINE, p), width=5)),
        # distance + delai
        Anim(0.25, 0.4, lambda img, d, p: d.line(
            [(250, 500), (250 + int(480 * p), 500)], fill=mix(BG, MUTED, p),
            width=3)),
        text_fade(0.3, 0.45, (480, 470), "d ≈ 1 700 m", size=30,
                  color=GREEN_DARK),
        text_fade(0.38, 0.52, (480, 620), "Δt = 5 s entre l'éclair et le tonnerre",
                  size=28, color=RED, anchor="mm"),
        # lagune
        waves(0.55, 0.7, 880, 1180, 500),
        text_fade(0.6, 0.75, (1030, 545), "et les vagues de la lagune ?",
                  size=24, color=MUTED, anchor="mm", bold=False),
        # trois outils
        *multi_text(0.78, 0.9, (890, 250), [
            "Nos trois outils :",
            "1. Phénomènes périodiques",
            "2. Le signal",
            "3. Les ondes",
        ], size=27, gap=46),
    ]


def scene3(dur):
    return [

        *title("Phénomènes périodiques", "Ils se répètent, identiques, à intervalles égaux"),
        # jour / nuit
        Anim(0.05, 0.18, lambda img, d, p: (
            d.ellipse([100, 190, 170, 260], outline=mix(BG, YELLOW_DARK, p), width=6),
            d.ellipse([200, 190, 270, 260], outline=mix(BG, MUTED, p), width=6),
        )),
        text_fade(0.08, 0.2, (300, 225), "le jour et la nuit · les battements du cœur",
                  size=25, color=MUTED, bold=False, anchor="lm"),
        # pendule
        pendulum(0.24, 1.0, (250, 330), 210, dur * 0.76),
        text_fade(0.3, 0.42, (250, 630), "une oscillation : un va-et-vient",
                  size=24, color=MUTED, bold=False, anchor="mm"),
        # formules
        *multi_text(0.45, 0.6, (620, 300), [
            "Période T : durée d'une répétition (s)",
            "Fréquence N : répétitions par seconde (Hz)",
        ], size=28, gap=52),
        fraction(0.62, 0.75, (760, 480), "1", "T", size=40),
        text_fade(0.62, 0.75, (680, 480), "N =", size=40, anchor="mm"),
        rounded_box(0.75, 0.85, (600, 415, 900, 545), color=YELLOW, width=6),
        text_fade(0.85, 0.95, (760, 590), "60 battements / min  →  N = 1 Hz",
                  size=26, color=GREEN_DARK, anchor="mm"),
    ]


def scene4(dur):
    return [

        *title("Le signal et l'onde", "La pierre dans la lagune"),
        ripples(0.05, 1.0, (280, 330), 200, dur * 0.95),
        text_fade(0.14, 0.26, (280, 480), "la source", size=26,
                  color=GREEN_DARK, anchor="mm"),
        bobbing_cork(0.32, 1.0, 320, 610, dur * 0.68),
        text_fade(0.4, 0.52, (330, 680), "le bouchon monte et descend, sans avancer",
                  size=23, color=MUTED, bold=False, anchor="mm"),
        # definition
        *multi_text(0.52, 0.66, (620, 270), [
            "Onde mécanique :",
            "propagation d'une perturbation",
            "dans un milieu matériel,",
            "SANS transport de matière.",
        ], size=30, gap=50),
        rounded_box(0.68, 0.78, (590, 220, 1120, 480), color=GREEN, width=6),
        text_fade(0.82, 0.94, (855, 560), "Dans le vide : pas d'onde mécanique.",
                  size=28, color=RED, anchor="mm"),
        text_fade(0.86, 0.98, (855, 610), "Le son ne traverse pas l'espace.",
                  size=26, color=MUTED, bold=False, anchor="mm"),
    ]


def scene5(dur):
    return [

        *title("La célérité", "La vitesse de propagation d'une onde"),
        text_fade(0.05, 0.18, (250, 260), "v =", size=44, anchor="mm"),
        fraction(0.05, 0.18, (350, 260), "d", "Δt", size=44),
        rounded_box(0.18, 0.28, (180, 190, 460, 330), color=YELLOW, width=6),
        # calcul
        *multi_text(0.3, 0.44, (180, 420), [
            "v = 1 700 m ÷ 5 s",
        ], size=34),
        text_fade(0.42, 0.55, (180, 490), "v = 340 m/s", size=44,
                  color=GREEN_DARK, anchor="lm"),
        text_fade(0.55, 0.68, (180, 560), "référence : 342,6 m/s  →  cohérent !",
                  size=28, color=GREEN, anchor="lm"),
        # comparaison
        text_fade(0.72, 0.82, (700, 400), "Son : 340 m/s", size=28, anchor="lm"),
        Anim(0.74, 0.84, lambda img, d, p: d.rounded_rectangle(
            [700, 425, 700 + int(90 * p), 450], radius=8,
            fill=mix(BG, GREEN, p))),
        text_fade(0.8, 0.9, (700, 500), "Lumière : 300 millions de m/s",
                  size=28, anchor="lm"),
        Anim(0.82, 0.94, lambda img, d, p: d.rounded_rectangle(
            [700, 525, 700 + int(520 * p), 550], radius=8,
            fill=mix(BG, YELLOW_DARK, p))),
        text_fade(0.9, 1.0, (700, 620), "L'éclair devance toujours le tonnerre.",
                  size=26, color=MUTED, bold=False, anchor="lm"),
    ]


def scene6(dur):
    return [

        text_fade(0.05, 0.25, (60, 250), "Bravo !", size=64,
                  color=GREEN_DARK, anchor="lm"),
        *multi_text(0.3, 0.5, (60, 370), [
            "• Pourquoi on voit avant d'entendre",
            "• Période, fréquence, onde, célérité",
        ], size=30, gap=54),
        text_fade(0.55, 0.75, (60, 530), "Prochaine vidéo : la longueur d'onde λ",
                  size=32, color=INK, anchor="lm"),
        text_fade(0.7, 0.9, (60, 590), "Entraîne-toi avec l'évaluation !",
                  size=28, color=GREEN, anchor="lm"),
    ]


SCENES = {1: scene1, 2: scene2, 3: scene3, 4: scene4, 5: scene5, 6: scene6}


def main():
    parts = []
    for i in range(1, 7):
        mp3 = os.path.join(VOIX, SEGS[i])
        dur = audio_duration(mp3) + (0.6 if i < 6 else 1.0)
        name = f"scene{i}"
        silent = os.path.join(OUT, f"{name}-silent.mp4")
        final = os.path.join(OUT, f"{name}.mp4")
        print(f"scene {i} : {dur:.1f}s")
        render_scene(silent, dur, SCENES[i](dur))
        mux(silent, mp3, final, dur)
        parts.append(final)
    out = os.path.join(OUT, "video-1-propagation.mp4")
    concat(parts, out, os.path.join(OUT, "concat.txt"))
    print("OK :", out)


if __name__ == "__main__":
    main()
