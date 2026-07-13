"""
Videos 2 et 3 du chapitre "Propagation d'une onde" (Terminale A, APC).
Style Khan Academy : tableau blanc + voix Julian, sans avatar.

  python3 render_propagation23.py 2   -> video 2 (longueur d'onde)
  python3 render_propagation23.py 3   -> video 3 (nature de la lumiere)

Prerequis : mp3 dans Desktop/COWORK/togo-academy-pilote/voix-julian{2,3}/segN.mp3
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from kademy import (
    Anim, BG, GREEN, GREEN_DARK, INK, LINE, MUTED, RED, W, H, YELLOW,
    YELLOW_DARK, audio_duration, concat, fraction, mix, mux, render_scene,
    rounded_box, text_fade,
)
from render_propagation import (
    OUT, bobbing_cork, cloud_bolt, multi_text, ripples, title, waves,
)

VOIX2 = "/Users/nbawana/Desktop/COWORK/togo-academy-pilote/voix-julian2"
VOIX3 = "/Users/nbawana/Desktop/COWORK/togo-academy-pilote/voix-julian3"

VIOLET = (110, 60, 170)
BLUE = (40, 90, 200)


# ---------------------------------------------------------------------------
# Nouveaux dessins
# ---------------------------------------------------------------------------
def sine_wave(t0, t1, x0, y, width, amp=26, cycles=3.0, color=GREEN,
              lw=4, phase_speed=0.0, window_sec=1.0) -> Anim:
    """Sinusoide, fixe ou defilante (phase_speed en rad/s)."""
    linear = phase_speed != 0
    def fn(img, d, p):
        phase = p * window_sec * phase_speed
        pts = []
        for i in range(0, int(width) + 1, 6):
            yy = y + amp * math.sin(2 * math.pi * cycles * i / width - phase)
            pts.append((x0 + i, yy))
        c = color if linear else mix(BG, color, min(1.0, p * 3))
        d.line(pts, fill=c, width=lw)
    return Anim(t0, t1, fn, linear=linear)


def arrow(d, p1, p2, color, lw=4, head=10):
    d.line([p1, p2], fill=color, width=lw)
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    for s in (-1, 1):
        d.line([p2, (p2[0] - head * math.cos(ang + s * 0.5),
                     p2[1] - head * math.sin(ang + s * 0.5))],
               fill=color, width=lw)


def double_arrow(t0, t1, p1, p2, color=YELLOW_DARK, lw=4) -> Anim:
    def fn(img, d, p):
        c = mix(BG, color, p)
        arrow(d, p1, p2, c, lw)
        arrow(d, p2, p1, c, lw)
    return Anim(t0, t1, fn)


def longitudinal(t0, t1, x0, y, width, window_sec, n=22, color=GREEN) -> Anim:
    """Barres verticales avec zones de compression qui defilent."""
    def fn(img, d, p):
        phase = p * window_sec * 2.2
        for i in range(n):
            base = x0 + i * width / n
            xx = base + 14 * math.sin(2 * math.pi * 2 * i / n - phase)
            d.line([(xx, y - 34), (xx, y + 34)], fill=color, width=4)
    return Anim(t0, t1, fn, linear=True)


def spectrum(t0, t1, x0, y, width, h=42) -> Anim:
    """Bande du spectre visible, violet -> rouge."""
    bands = [(VIOLET, "400"), (BLUE, ""), (GREEN, "550"),
             (YELLOW_DARK, ""), (RED, "750")]
    def fn(img, d, p):
        seg = width / len(bands)
        for i, (c, label) in enumerate(bands):
            cc = mix(BG, c, p)
            d.rectangle([x0 + i * seg, y, x0 + (i + 1) * seg, y + h], fill=cc)
            if label and p > 0.7:
                from kademy import font
                d.text((x0 + i * seg + seg / 2, y + h + 16), label + " nm",
                       font=font(18, False), fill=mix(BG, MUTED, p),
                       anchor="mm")
    return Anim(t0, t1, fn)


def young_slits(t0, t1, cx, cy, window_sec) -> Anim:
    """Deux fentes + ondes circulaires qui se croisent + franges."""
    def fn(img, d, p):
        c = mix(BG, INK, min(1.0, p * 3))
        # barriere avec deux fentes
        for y1, y2 in ((cy - 120, cy - 26), (cy - 10, cy + 10 - 36 + 26),
                       (cy + 26, cy + 120)):
            pass
        d.line([(cx, cy - 120), (cx, cy - 30)], fill=c, width=6)
        d.line([(cx, cy - 14), (cx, cy + 14)], fill=c, width=6)
        d.line([(cx, cy + 30), (cx, cy + 120)], fill=c, width=6)
        # ondes issues des deux fentes
        elapsed = p * window_sec
        for sy in (cy - 22, cy + 22):
            for k in range(3):
                r = (elapsed * 40 - k * 26) % 90
                if r > 6:
                    fade = 1.0 - r / 90
                    cc = mix(BG, GREEN, max(0.12, fade))
                    d.arc([cx - r, sy - r, cx + r, sy + r], -80, 80,
                          fill=cc, width=3)
        # franges sur l'ecran de droite
        ex = cx + 150
        d.line([(ex, cy - 120), (ex, cy + 120)], fill=c, width=4)
        if p > 0.4:
            q = min(1.0, (p - 0.4) / 0.4)
            for i in range(-3, 4):
                yy = cy + i * 32
                ww = 16 - abs(i) * 3
                d.line([(ex + 8, yy - ww / 2), (ex + 8, yy + ww / 2)],
                       fill=mix(BG, YELLOW_DARK, q), width=8)
    return Anim(t0, t1, fn, linear=True)


def photoelectric(t0, t1, cx, cy, window_sec) -> Anim:
    """Photons (points jaunes) frappant une plaque, electrons ejectes."""
    def fn(img, d, p):
        c = mix(BG, MUTED, min(1.0, p * 3))
        d.rectangle([cx - 10, cy - 80, cx + 10, cy + 80], fill=c)
        elapsed = p * window_sec
        # photons entrants (diagonale haut-gauche)
        for k in range(4):
            t = (elapsed * 0.9 + k * 0.25) % 1.0
            px = cx - 180 + t * 165
            py = cy - 120 + t * 90 + k * 18
            d.ellipse([px - 6, py - 6, px + 6, py + 6], fill=YELLOW_DARK)
        # electrons ejectes (vers la droite)
        for k in range(3):
            t = (elapsed * 0.7 + k * 0.33) % 1.0
            ex = cx + 14 + t * 150
            ey = cy - 20 + k * 28 - t * 24
            d.ellipse([ex - 5, ey - 5, ex + 5, ey + 5], fill=GREEN)
    return Anim(t0, t1, fn, linear=True)


# ---------------------------------------------------------------------------
# Video 2 : la longueur d'onde
# ---------------------------------------------------------------------------
def v2_scene1(dur):
    return [
        text_fade(0.05, 0.2, (60, 200), "PHYSIQUE · TERMINALE A · VIDÉO 2/3",
                  size=24, color=GREEN, anchor="lm"),
        text_fade(0.1, 0.3, (60, 280), "La longueur d'onde", size=58, anchor="lm"),
        text_fade(0.15, 0.35, (60, 350), "Les deux secrets des vagues de la lagune",
                  size=32, color=MUTED, anchor="lm"),
        waves(0.45, 0.7, 100, 700, 500),
        sine_wave(0.5, 1.0, 100, 560, 600, amp=18, cycles=4, phase_speed=2.0,
                  window_sec=dur * 0.5),
    ]


def v2_scene2(dur):
    return [
        *title("Transversale ou longitudinale ?", "La direction du mouvement"),
        # transversale
        text_fade(0.05, 0.15, (120, 210), "Onde TRANSVERSALE", size=28,
                  color=GREEN_DARK, anchor="lm"),
        sine_wave(0.08, 1.0, 120, 300, 480, amp=30, cycles=3, phase_speed=2.4,
                  window_sec=dur * 0.92),
        double_arrow(0.15, 0.3, (650, 250), (650, 350)),
        Anim(0.2, 0.32, lambda img, d, p: arrow(
            d, (120, 380), (120 + int(200 * p), 380), mix(BG, MUTED, p))),
        text_fade(0.2, 0.32, (340, 380), "propagation", size=20, color=MUTED,
                  bold=False, anchor="lm"),
        text_fade(0.22, 0.34, (680, 300), "la matière vibre ↕", size=22,
                  color=MUTED, bold=False, anchor="lm"),
        # longitudinale
        text_fade(0.42, 0.55, (120, 460), "Onde LONGITUDINALE", size=28,
                  color=GREEN_DARK, anchor="lm"),
        longitudinal(0.45, 1.0, 120, 560, 480, dur * 0.55),
        Anim(0.52, 0.64, lambda img, d, p: arrow(
            d, (120, 640), (120 + int(200 * p), 640), mix(BG, MUTED, p))),
        text_fade(0.52, 0.64, (340, 640), "propagation et vibration : même direction",
                  size=20, color=MUTED, bold=False, anchor="lm"),
        # conclusion Koffi
        *multi_text(0.75, 0.9, (760, 480), [
            "Les vagues de la lagune :",
            "TRANSVERSALES ",
        ], size=28, gap=48),
        rounded_box(0.85, 0.95, (730, 440, 1190, 560), color=YELLOW, width=6),
    ]


def v2_scene3(dur):
    return [
        *title("La double périodicité", "L'onde se répète dans le temps et dans l'espace"),
        text_fade(0.08, 0.2, (120, 230), "Dans le temps : la période T (s)",
                  size=28, anchor="lm"),
        bobbing_cork(0.1, 1.0, 320, 340, dur * 0.9),
        text_fade(0.4, 0.52, (120, 470), "Dans l'espace : la longueur d'onde λ (m)",
                  size=28, anchor="lm"),
        sine_wave(0.45, 1.0, 120, 570, 560, amp=28, cycles=3, phase_speed=0.0),
        double_arrow(0.55, 0.7, (213, 520), (400, 520)),
        text_fade(0.6, 0.72, (306, 495), "λ", size=36, color=YELLOW_DARK),
        text_fade(0.7, 0.85, (800, 570), "le motif se répète tous les λ",
                  size=24, color=MUTED, bold=False, anchor="lm"),
    ]


def v2_scene4(dur):
    return [
        *title("Calculer la longueur d'onde", "λ = c · T = c / N"),
        text_fade(0.05, 0.18, (200, 260), "λ =", size=44, anchor="mm"),
        fraction(0.05, 0.18, (300, 260), "c", "N", size=44),
        rounded_box(0.18, 0.28, (140, 190, 400, 330), color=YELLOW, width=6),
        *multi_text(0.3, 0.44, (140, 420), [
            "Un son de 100 Hz dans l'air (c ≈ 343 m/s) :",
        ], size=28),
        text_fade(0.45, 0.58, (140, 490), "λ = 343 ÷ 100", size=34, anchor="lm"),
        text_fade(0.58, 0.7, (140, 560), "λ = 3,43 m", size=44,
                  color=GREEN_DARK, anchor="lm"),
        sine_wave(0.75, 1.0, 620, 480, 540, amp=24, cycles=2.5, phase_speed=0),
        double_arrow(0.82, 0.94, (728, 430), (944, 430)),
        text_fade(0.86, 0.98, (836, 405), "3,43 m entre deux compressions",
                  size=20, color=MUTED, bold=False, anchor="mm"),
    ]


def v2_scene5(dur):
    return [
        *title("D'une dimension à trois", "Et la suite du voyage"),
        ripples(0.05, 0.7, (280, 380), 190, dur * 0.65),
        text_fade(0.15, 0.28, (280, 560), "cercles espacés de λ", size=24,
                  color=MUTED, bold=False, anchor="mm"),
        *multi_text(0.35, 0.5, (620, 300), [
            "• Lagune : onde à 2 dimensions",
            "• Son : onde à 3 dimensions",
        ], size=28, gap=52),
        text_fade(0.62, 0.78, (620, 470), "Prochaine vidéo :", size=28,
                  color=GREEN_DARK, anchor="lm"),
        text_fade(0.68, 0.84, (620, 525), "la lumière : onde ou particules ?",
                  size=32, anchor="lm"),
        text_fade(0.82, 0.95, (620, 590), "Entraîne-toi avec l'évaluation !",
                  size=26, color=GREEN, anchor="lm"),
    ]


# ---------------------------------------------------------------------------
# Video 3 : la nature de la lumiere
# ---------------------------------------------------------------------------
def v3_scene1(dur):
    return [
        text_fade(0.05, 0.2, (60, 200), "PHYSIQUE · TERMINALE A · VIDÉO 3/3",
                  size=24, color=GREEN, anchor="lm"),
        text_fade(0.1, 0.3, (60, 280), "La nature de la lumière", size=54, anchor="lm"),
        text_fade(0.15, 0.35, (60, 350), "Onde... ou pluie de particules ?",
                  size=34, color=MUTED, anchor="lm"),
        cloud_bolt(0.4, 0.65, 240, 470, scale=0.8),
        text_fade(0.55, 0.75, (420, 520), "Trois siècles de débat scientifique",
                  size=28, color=INK, anchor="lm"),
    ]


def v3_scene2(dur):
    return [
        *title("Premier indice : c'est une onde", "Huygens, Young et les interférences"),
        young_slits(0.05, 1.0, 380, 380, dur * 0.95),
        text_fade(0.12, 0.24, (380, 560), "les fentes de Young : des franges",
                  size=22, color=MUTED, bold=False, anchor="mm"),
        *multi_text(0.42, 0.56, (680, 260), [
            "Onde électromagnétique :",
            "se propage AUSSI dans le vide,",
            "à 300 millions de m/s.",
        ], size=26, gap=44),
        spectrum(0.68, 0.82, 680, 450, 480),
        text_fade(0.78, 0.92, (920, 545), "chaque couleur a sa longueur d'onde",
                  size=22, color=MUTED, bold=False, anchor="mm"),
    ]


def v3_scene3(dur):
    return [
        *title("Deuxième indice : des particules", "L'effet photoélectrique (Einstein, 1905)"),
        photoelectric(0.05, 1.0, 420, 380, dur * 0.95),
        text_fade(0.1, 0.22, (270, 520), "photons", size=22,
                  color=YELLOW_DARK, anchor="mm"),
        text_fade(0.18, 0.3, (560, 520), "électrons éjectés", size=22,
                  color=GREEN, anchor="mm"),
        *multi_text(0.45, 0.6, (720, 280), [
            "La lumière transporte l'énergie",
            "par petits paquets : les photons.",
        ], size=27, gap=46),
        text_fade(0.62, 0.75, (720, 430), "E = h · ν", size=42, anchor="lm"),
        rounded_box(0.72, 0.82, (690, 380, 950, 480), color=YELLOW, width=6),
        text_fade(0.82, 0.94, (720, 540), "h : constante de Planck", size=24,
                  color=MUTED, bold=False, anchor="lm"),
    ]


def v3_scene4(dur):
    return [
        *title("L'éclair de Koffi, côté photons", "Lumière verte : λ = 550 nm"),
        *multi_text(0.05, 0.2, (120, 240), [
            "Fréquence :  ν = c / λ",
        ], size=32),
        text_fade(0.22, 0.35, (120, 320), "ν ≈ 5,4 × 10¹⁴ Hz", size=40,
                  color=GREEN_DARK, anchor="lm"),
        *multi_text(0.42, 0.56, (120, 420), [
            "Énergie du photon :  E = h · ν",
        ], size=32),
        text_fade(0.58, 0.7, (120, 500), "E ≈ 3,6 × 10⁻¹⁹ J", size=40,
                  color=GREEN_DARK, anchor="lm"),
        text_fade(0.78, 0.92, (120, 600),
                  "Des milliards de milliards de photons par seconde dans ton œil !",
                  size=25, color=MUTED, bold=False, anchor="lm"),
    ]


def v3_scene5(dur):
    return [
        *title("La dualité onde-corpuscule", "La réponse : les deux !"),
        sine_wave(0.08, 1.0, 110, 330, 420, amp=30, cycles=3, phase_speed=2.0,
                  window_sec=dur * 0.92),
        text_fade(0.1, 0.22, (320, 420), "onde (Young)", size=24,
                  color=GREEN_DARK, anchor="mm"),
        Anim(0.25, 1.0, lambda img, d, p: [
            d.ellipse([740 + k * 60 - 8, 320 + (k % 2) * 24 - 8,
                       740 + k * 60 + 8, 320 + (k % 2) * 24 + 8],
                      fill=YELLOW_DARK) for k in range(5)][-1] and None,
             linear=True),
        text_fade(0.3, 0.42, (890, 420), "photons (Einstein)", size=24,
                  color=YELLOW_DARK, anchor="mm"),
        text_fade(0.5, 0.64, (640, 510), "Chapitre terminé, bravo !", size=36,
                  color=GREEN_DARK, anchor="mm"),
        text_fade(0.68, 0.84, (640, 570),
                  "Passe l'évaluation et l'examen du chapitre pour valider tes acquis.",
                  size=26, anchor="mm"),
        text_fade(0.84, 0.96, (640, 625), "À très bientôt sur Togo Academy !",
                  size=26, color=GREEN, anchor="mm"),
    ]


VIDEOS = {
    2: (VOIX2, {1: v2_scene1, 2: v2_scene2, 3: v2_scene3, 4: v2_scene4, 5: v2_scene5},
        "video-2-longueur-onde.mp4"),
    3: (VOIX3, {1: v3_scene1, 2: v3_scene2, 3: v3_scene3, 4: v3_scene4, 5: v3_scene5},
        "video-3-nature-lumiere.mp4"),
}


def main():
    n = int(sys.argv[1])
    voix, scenes, outname = VIDEOS[n]
    parts = []
    for i in range(1, 6):
        mp3 = os.path.join(voix, f"seg{i}.mp3")
        dur = audio_duration(mp3) + (0.6 if i < 5 else 1.0)
        name = f"v{n}scene{i}"
        silent = os.path.join(OUT, f"{name}-silent.mp4")
        final = os.path.join(OUT, f"{name}.mp4")
        print(f"video {n} scene {i} : {dur:.1f}s")
        render_scene(silent, dur, scenes[i](dur))
        mux(silent, mp3, final, dur)
        parts.append(final)
    out = os.path.join(OUT, outname)
    concat(parts, out, os.path.join(OUT, f"concat-v{n}.txt"))
    print("OK :", out)


if __name__ == "__main__":
    main()
