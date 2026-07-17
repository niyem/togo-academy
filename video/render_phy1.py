# PHY 1 : Gravitation-Satellites (Terminale A) : 9 videos courtes format APC.
# Chaque video : 3 scenes (situation+tache / ressources+resolution / trace
# ecrite), calees sur les 3 segments de voix Julian, illustrations animees
# du storyboard, sous-titres VTT generes automatiquement.
#
# Usage : python3 render_phy1.py [n ...]   (defaut : 1..9)

import math
import os
import re
import sys

from kademy import (
    BG, FPS, GREEN, GREEN_DARK, INK, LINE, MUTED, RED, W, YELLOW, YELLOW_DARK,
    Anim, audio_duration, concat, ease, lerp, lerp_pt, mix, mux,
    render_scene, rounded_box, text_fade,
)
from render_propagation import multi_text, title
from render_propagation23 import arrow, double_arrow

VOIX = "/Users/nbawana/Desktop/COWORK/CLAUDE-CODE/togo-academy/livrables/pilote/voix-phy1"
LIVRAISON = "/Users/nbawana/Desktop/COWORK/CLAUDE-CODE/togo-academy/livrables/pilote"
PHY1 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phy1")
OUT = os.path.join(PHY1, "out")
os.makedirs(OUT, exist_ok=True)


# ---------------------------------------------------------------- helpers
def earth(t0, t1, cx, cy, r, label=None):
    def fn(img, d, p):
        rr = r * p
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=mix(BG, (198, 231, 214), p), outline=GREEN_DARK, width=4)
        if p > 0.6:
            q = (p - 0.6) / 0.4
            c = mix(BG, GREEN, q)
            d.arc([cx - rr, cy - rr * 0.45, cx + rr, cy + rr * 0.45],
                  0, 360, fill=c, width=2)
            d.arc([cx - rr * 0.45, cy - rr, cx + rr * 0.45, cy + rr],
                  0, 360, fill=c, width=2)
        if label and p > 0.8:
            f, s = _lbl(20)
            d.text((cx, cy + rr + 16), label, font=f, fill=MUTED,
                   anchor="mm", stroke_width=s, stroke_fill=MUTED)
    return Anim(t0, t1, fn)


def _lbl(size, bold=False):
    from kademy import font_for
    return font_for("x", size, bold)


def satellite(d, x, y, c, scale=1.0):
    s = 9 * scale
    d.rectangle([x - s, y - s * 0.6, x + s, y + s * 0.6], fill=c)
    d.rectangle([x - s * 2.6, y - s * 0.45, x - s * 1.2, y + s * 0.45],
                outline=c, width=3)
    d.rectangle([x + s * 1.2, y - s * 0.45, x + s * 2.6, y + s * 0.45],
                outline=c, width=3)


def orbit_sat(t0, t1, cx, cy, R, window_sec, turns=1.0, color=INK,
              start=-90.0, trail=True):
    """Satellite anime le long d'une orbite circulaire (lecture lineaire)."""
    def fn(img, d, p):
        d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=LINE, width=3)
        a = math.radians(start + 360.0 * turns * p)
        x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        satellite(d, x, y, color)
    return Anim(t0, t1, fn, linear=True)


def dish(t0, t1, x, y, scale=1.0):
    def fn(img, d, p):
        c = mix(BG, INK, p)
        s = scale
        d.line([(x, y), (x, y - 46 * s)], fill=c, width=5)
        d.pieslice([x - 30 * s, y - 78 * s, x + 30 * s, y - 28 * s],
                   200, 340, fill=mix(BG, (222, 234, 228), p), outline=c, width=4)
        d.line([(x, y - 53 * s), (x + 16 * s, y - 70 * s)], fill=c, width=3)
    return Anim(t0, t1, fn)


def mango_tree(t0, t1, x, ground_y):
    """Manguier + mangue qui se detache et tombe."""
    def fn(img, d, p):
        c = mix(BG, INK, min(1.0, p * 3))
        d.line([(x, ground_y), (x, ground_y - 110)], fill=c, width=8)
        d.ellipse([x - 70, ground_y - 190, x + 70, ground_y - 90],
                  fill=mix(BG, (198, 231, 214), min(1.0, p * 3)),
                  outline=mix(BG, GREEN_DARK, min(1.0, p * 3)), width=4)
        if p > 0.35:
            q = ease(min(1.0, (p - 0.35) / 0.5))
            my = lerp(ground_y - 120, ground_y - 10, q * q)
            d.ellipse([x + 28 - 9, my - 11, x + 28 + 9, my + 11],
                      fill=mix(BG, YELLOW_DARK, min(1.0, p * 3)))
        if p > 0.75:
            arrow(d, (x + 70, ground_y - 100), (x + 70, ground_y - 30),
                  mix(BG, RED, (p - 0.75) / 0.25))
    return Anim(t0, t1, fn)


def field_lines(t0, t1, cx, cy, r_in, r_out):
    """Fleches convergentes vers l'astre, qui palissent avec la distance."""
    def fn(img, d, p):
        n = int(10 * p)
        for i in range(n):
            a = math.radians(i * 36)
            for k, rr in enumerate((r_out, r_out * 0.78)):
                fade = 0.85 - 0.35 * k
                p1 = (cx + rr * math.cos(a), cy + rr * math.sin(a))
                p2 = (cx + (rr - 26) * math.cos(a), cy + (rr - 26) * math.sin(a))
                arrow(d, p1, p2, mix(BG, GREEN, fade))
    return Anim(t0, t1, fn)


def curve(t0, t1, pts, color=GREEN, width=5):
    def fn(img, d, p):
        n = max(2, int(len(pts) * p))
        d.line(pts[:n], fill=color, width=width, joint="curve")
    return Anim(t0, t1, fn)


def sync_earth_sat(t0, t1, cx, cy, r_e, R, window_sec, sync=True):
    """Terre qui tourne + satellite ; si sync, le trait reste fixe."""
    def fn(img, d, p):
        d.ellipse([cx - r_e, cy - r_e, cx + r_e, cy + r_e],
                  fill=(198, 231, 214), outline=GREEN_DARK, width=4)
        d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=LINE, width=3)
        a_e = math.radians(-90 + 360 * p)
        mx, my = cx + r_e * 0.85 * math.cos(a_e), cy + r_e * 0.85 * math.sin(a_e)
        d.ellipse([mx - 6, my - 6, mx + 6, my + 6], fill=RED)  # repere au sol
        a_s = a_e if sync else math.radians(-90 + 720 * p)
        x, y = cx + R * math.cos(a_s), cy + R * math.sin(a_s)
        if sync:
            d.line([(cx + r_e * math.cos(a_e), cy + r_e * math.sin(a_e)),
                    (x, y)], fill=YELLOW_DARK, width=3)
        satellite(d, x, y, INK)
    return Anim(t0, t1, fn, linear=True)


def kepler_table(t0, t1, x, y):
    rows = [("Io", "42", "1,77", "3,1"), ("Europe", "67", "3,55", "3,1"),
            ("Ganymède", "107", "7,15", "3,1")]
    anims = [text_fade(t0, t0 + 0.05, (x, y), "Satellite   r   T   T²/r³",
                       size=24, color=GREEN_DARK, anchor="lm")]
    for i, (nom, r, T, k) in enumerate(rows):
        tt = t0 + 0.1 + i * 0.18
        anims.append(text_fade(tt, tt + 0.1, (x, y + 42 + i * 40),
                               f"{nom}   {r}   {T}   {k}", size=22,
                               bold=False, anchor="lm"))
    anims.append(rounded_box(t0 + 0.72, t0 + 0.85,
                             (x + 236, y + 24, x + 320, y + 164)))
    return anims


# ------------------------------------------------------------ scenes APC
def s_situation(dur, num, titre, sous, extra):
    return [*title(f"PHY 1 · Vidéo {num}/9", sous),
            text_fade(0.06, 0.16, (60, 190), titre, size=34,
                      color=GREEN_DARK, anchor="lm"), *extra]


def v1_s1(dur):
    return s_situation(dur, 1, "La gravitation, une interaction universelle",
                       "Situation : le satellite d'Essohanam", [
        dish(0.15, 0.3, 240, 560, 1.4),
        earth(0.2, 0.35, 950, 500, 90),
        orbit_sat(0.3, 1.0, 950, 500, 150, dur * 0.7),
        text_fade(0.55, 0.7, (640, 620),
                  "Ta tâche : découvrir la force invisible qui le retient",
                  size=24, color=MUTED),
    ])


def v1_s2(dur):
    return [*title("Deux corps massifs s'attirent", "Ressources et résolution"),
        mango_tree(0.03, 0.35, 240, 620),
        earth(0.4, 0.5, 830, 420, 85),
        Anim(0.5, 0.62, lambda img, d, p: (
            arrow(d, (830 + 130, 420), (830 + 210, 420), mix(BG, RED, p)),
            arrow(d, (830 + 320, 420), (830 + 240, 420), mix(BG, RED, p)),
            satellite(d, 830 + 350, 420, mix(BG, INK, p)))),
        text_fade(0.62, 0.72, (830, 560), "attraction MUTUELLE", size=26,
                  color=RED),
        *multi_text(0.78, 0.92, (120, 250), [
            "Terre ↔ Lune", "Soleil ↔ planètes", "Terre ↔ satellite",
        ], size=26, gap=44),
    ]


def v1_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        *multi_text(0.08, 0.35, (90, 260), [
            "• Deux corps massifs s'attirent mutuellement.",
            "• Cette attraction : l'interaction gravitationnelle.",
            "• Elle est UNIVERSELLE.",
        ], size=30, gap=64),
        text_fade(0.6, 0.75, (90, 540),
                  "Prochaine vidéo : la formule de cette force", size=24,
                  color=MUTED, bold=False, anchor="lm"),
    ]


def v2_s1(dur):
    return s_situation(dur, 2, "La loi d'interaction gravitationnelle",
                       "Situation : mesurer la force", [
        earth(0.2, 0.32, 400, 470, 90),
        orbit_sat(0.28, 1.0, 400, 470, 160, dur * 0.75),
        text_fade(0.5, 0.65, (880, 460), "F = ?", size=60, color=RED),
    ])


def v2_s2(dur):
    y = 300
    return [*title("F = G · m₁ · m₂ / d²", "Ressources et résolution"),
        Anim(0.05, 0.15, lambda img, d, p: (
            d.ellipse([200 - 34, y - 34, 200 + 34, y + 34],
                      fill=mix(BG, GREEN, p)),
            d.ellipse([560 - 46, y - 46, 560 + 46, y + 46],
                      fill=mix(BG, GREEN_DARK, p)))),
        text_fade(0.08, 0.16, (200, y + 66), "m₁", size=26, anchor="mm"),
        text_fade(0.08, 0.16, (560, y + 66), "m₂", size=26, anchor="mm"),
        line_arrows(0.16, 0.26, y),
        text_fade(0.2, 0.28, (380, y - 64), "d", size=28, color=MUTED),
        # d double -> F/4
        Anim(0.42, 0.58, lambda img, d, p: (
            d.ellipse([760 - 24, y - 24, 760 + 24, y + 24],
                      fill=mix(BG, GREEN, p)),
            d.ellipse([1150 - 30, y - 30, 1150 + 30, y + 30],
                      fill=mix(BG, GREEN_DARK, p)),
            arrow(d, (760 + 34, y), (760 + 62, y), mix(BG, RED, p)))),
        text_fade(0.5, 0.6, (955, y - 60), "d × 2  →  F ÷ 4", size=30,
                  color=RED),
        *multi_text(0.68, 0.85, (120, 520), [
            "Exemple : deux corps d'une tonne à 1 m → force minuscule",
            "Terre ↔ satellite → force énorme (masse de la Terre)",
        ], size=24, gap=48, bold=False),
    ]


def line_arrows(t0, t1, y):
    def fn(img, d, p):
        arrow(d, (245, y), (245 + 100 * p, y), mix(BG, RED, p))
        arrow(d, (515, y), (515 - 100 * p, y), mix(BG, RED, p))
    return Anim(t0, t1, fn)


def v2_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        text_fade(0.08, 0.2, (W // 2, 280), "F = G · m₁ · m₂ / d²", size=52,
                  color=GREEN_DARK),
        rounded_box(0.2, 0.32, (330, 230, 950, 330)),
        *multi_text(0.4, 0.6, (150, 430), [
            "• Plus les masses sont grandes, plus F est grande.",
            "• Si d double, F est divisée par 4.",
        ], size=28, gap=56),
    ]


def v3_s1(dur):
    return s_situation(dur, 3, "Le champ de gravitation",
                       "Situation : l'influence invisible de la Terre", [
        earth(0.15, 0.3, 640, 460, 100),
        field_lines(0.3, 0.7, 640, 460, 120, 250),
    ])


def v3_s2(dur):
    pts = [(180 + i * 9, 560 - 240 * (1 / (1 + (i / 22) ** 2))) for i in range(90)]
    return [*title("g = G · M / d²", "Ressources et résolution"),
        earth(0.03, 0.12, 320, 520, 70),
        field_lines(0.1, 0.3, 320, 520, 90, 190),
        curve(0.4, 0.62, [(p[0] + 480, p[1] - 40) for p in pts]),
        text_fade(0.44, 0.54, (700, 250), "g (N/kg)", size=24, color=MUTED,
                  anchor="lm"),
        text_fade(0.56, 0.66, (1150, 545), "distance", size=22, color=MUTED),
        text_fade(0.66, 0.78, (760, 330), "g = 9,8 N/kg au sol", size=26,
                  color=GREEN_DARK, anchor="lm"),
        text_fade(0.8, 0.9, (760, 390), "g diminue avec l'altitude", size=26,
                  color=RED, anchor="lm"),
    ]


def v3_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        text_fade(0.08, 0.2, (W // 2, 280), "g = G · M / d²", size=52,
                  color=GREEN_DARK),
        rounded_box(0.2, 0.32, (430, 230, 850, 330)),
        *multi_text(0.4, 0.62, (150, 430), [
            "• g indique la force subie par 1 kg placé en un point.",
            "• g diminue quand on s'éloigne de l'astre.",
            "• Capacité 1 validée : utiliser la loi de gravitation !",
        ], size=28, gap=56),
    ]


def v4_s1(dur):
    return s_situation(dur, 4, "Qu'est-ce qu'un satellite ?",
                       "Situation : l'image du match", [
        dish(0.15, 0.3, 240, 560, 1.4),
        earth(0.2, 0.35, 900, 470, 85),
        orbit_sat(0.3, 1.0, 900, 470, 150, dur * 0.7),
    ])


def v4_s2(dur):
    return [*title("Naturels et artificiels", "Ressources et résolution"),
        earth(0.03, 0.12, 320, 400, 75),
        orbit_sat(0.1, 0.55, 320, 400, 140, dur * 0.45, color=MUTED),
        Anim(0.12, 0.2, lambda img, d, p: d.ellipse(
            [320 + 118, 400 - 122, 320 + 146, 400 - 94],
            fill=mix(BG, (180, 180, 180), p))),
        text_fade(0.16, 0.24, (500, 260), "la Lune (naturel)", size=24,
                  color=MUTED, anchor="lm"),
        *multi_text(0.35, 0.62, (760, 330), [
            "📡 télécommunication (télévision)",
            "🌧 météo (pluies, tempêtes)",
            "📍 localisation (téléphone)",
        ], size=27, gap=56),
        # fronde
        Anim(0.7, 1.0, lambda img, d, p: _fronde(d, p, dur)),
        text_fade(0.78, 0.88, (320, 660), "la « corde » : la gravitation",
                  size=22, color=GREEN_DARK),
    ]


def _fronde(d, p, dur):
    cx, cy = 320, 560
    a = math.radians(360 * 3 * p)
    x, y = cx + 70 * math.cos(a), cy + 42 * math.sin(a)
    d.line([(cx, cy), (x, y)], fill=GREEN, width=3)
    d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=INK)


def v4_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        *multi_text(0.08, 0.4, (110, 270), [
            "• Satellite : corps qui tourne autour d'une planète.",
            "• Naturel : la Lune.  Artificiel : télécom, météo,",
            "  localisation, observation.",
            "• Tous retenus par la gravitation.",
        ], size=29, gap=58),
    ]


def v5_s1(dur):
    return s_situation(dur, 5, "La vitesse d'un satellite",
                       "Situation : avancer pour ne pas tomber", [
        earth(0.15, 0.28, 640, 470, 85),
        orbit_sat(0.25, 1.0, 640, 470, 160, dur * 0.75),
        Anim(0.5, 0.62, lambda img, d, p: arrow(
            d, (640, 470 - 160), (640 + 90 * p, 470 - 160), mix(BG, RED, p))),
        text_fade(0.58, 0.7, (820, 290), "v = ?", size=44, color=RED),
    ])


def v5_s2(dur):
    return [*title("v = √(G·M / r)", "Ressources et résolution"),
        earth(0.03, 0.12, 320, 430, 70),
        orbit_sat(0.1, 0.5, 320, 430, 115, dur * 0.4),
        orbit_sat(0.1, 0.5, 320, 430, 175, dur * 0.4, turns=0.55, color=MUTED),
        text_fade(0.3, 0.4, (540, 300), "orbite basse : rapide", size=23,
                  color=GREEN_DARK, anchor="lm"),
        text_fade(0.4, 0.5, (540, 350), "orbite haute : plus lente", size=23,
                  color=MUTED, anchor="lm"),
        *multi_text(0.6, 0.8, (120, 560), [
            "Orbite basse : v ≈ 7,8 km/s",
            "→ Lomé-Kara en une minute !",
        ], size=28, gap=52),
    ]


def v5_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        text_fade(0.08, 0.2, (W // 2, 280), "v = √(G·M / r)", size=52,
                  color=GREEN_DARK),
        rounded_box(0.2, 0.32, (400, 230, 880, 330)),
        *multi_text(0.4, 0.6, (150, 430), [
            "• r : rayon de l'orbite, depuis le CENTRE de la Terre.",
            "• Plus l'orbite est basse, plus la vitesse est grande.",
        ], size=28, gap=56),
    ]


def v6_s1(dur):
    return s_situation(dur, 6, "La période de révolution",
                       "Situation : la durée d'un tour complet", [
        earth(0.15, 0.28, 640, 470, 85),
        orbit_sat(0.25, 1.0, 640, 470, 155, dur * 0.75, turns=1.0),
        text_fade(0.55, 0.68, (900, 300), "T = ?", size=44, color=RED),
    ])


def v6_s2(dur):
    return [*title("T = 2πr / v", "Ressources et résolution"),
        earth(0.03, 0.1, 300, 420, 65),
        orbit_sat(0.08, 0.45, 300, 420, 120, dur * 0.37),
        # circonference deroulee
        Anim(0.28, 0.42, lambda img, d, p: d.line(
            [(560, 480), (560 + 500 * p, 480)], fill=GREEN, width=6)),
        text_fade(0.34, 0.44, (810, 440), "2πr", size=28, color=GREEN_DARK),
        text_fade(0.48, 0.6, (810, 530), "T = 2πr / v", size=36,
                  color=GREEN_DARK),
        *multi_text(0.68, 0.86, (120, 620), [
            "Station spatiale (400 km) : T ≈ 92 min → 16 levers de soleil/jour",
        ], size=24, gap=44, bold=False),
        _suns(0.72, 0.95),
    ]


def _suns(t0, t1):
    def fn(img, d, p):
        n = int(16 * p)
        for i in range(n):
            x = 700 + (i % 8) * 56
            y = 250 + (i // 8) * 56
            d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=YELLOW)
    return Anim(t0, t1, fn)


def v6_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        text_fade(0.08, 0.2, (W // 2, 280), "T = 2πr / v", size=52,
                  color=GREEN_DARK),
        rounded_box(0.2, 0.32, (430, 230, 850, 330)),
        *multi_text(0.4, 0.6, (150, 430), [
            "• T : durée d'un tour complet (période de révolution).",
            "• Plus l'orbite est haute, plus T est longue.",
        ], size=28, gap=56),
    ]


def v7_s1(dur):
    return s_situation(dur, 7, "La troisième loi de Kepler",
                       "Situation : la règle cachée des orbites", [
        earth(0.15, 0.25, 400, 470, 55, label="Jupiter"),
        orbit_sat(0.22, 1.0, 400, 470, 95, dur * 0.78, turns=1.4),
        orbit_sat(0.22, 1.0, 400, 470, 150, dur * 0.78, turns=0.8, color=MUTED),
        orbit_sat(0.22, 1.0, 400, 470, 205, dur * 0.78, turns=0.5,
                  color=GREEN_DARK),
        text_fade(0.5, 0.64, (900, 400), "T² / r³ = ?", size=42, color=RED),
    ])


def v7_s2(dur):
    return [*title("T² / r³ = constante", "Ressources et résolution"),
        *kepler_table(0.08, 0.9, 120, 240),
        text_fade(0.6, 0.72, (120, 500),
                  "Même valeur pour tous les satellites de Jupiter !",
                  size=27, color=GREEN_DARK, anchor="lm"),
        *multi_text(0.78, 0.92, (120, 580), [
            "T² / r³ = 4π² / (G·M)  →  on en déduit la masse M de l'astre",
        ], size=25, gap=44, bold=False),
    ]


def v7_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        text_fade(0.08, 0.2, (W // 2, 280), "T² / r³ = 4π² / (G·M)", size=48,
                  color=GREEN_DARK),
        rounded_box(0.2, 0.32, (300, 230, 980, 330)),
        *multi_text(0.4, 0.6, (150, 430), [
            "• Identique pour tous les satellites d'un même astre.",
            "• Permet de calculer une orbite ou la masse de l'astre.",
        ], size=28, gap=56),
    ]


def v8_s1(dur):
    return s_situation(dur, 8, "Le satellite géostationnaire",
                       "Situation : l'antenne qui ne bouge jamais", [
        dish(0.15, 0.3, 240, 560, 1.4),
        text_fade(0.35, 0.5, (620, 480), "toujours le même point du ciel...",
                  size=26, color=MUTED, anchor="lm"),
        Anim(0.3, 0.45, lambda img, d, p: d.line(
            [(258, 490), (258 + 500 * p, 490 - 320 * p)],
            fill=mix(BG, YELLOW_DARK, p), width=3)),
        Anim(0.42, 0.5, lambda img, d, p: satellite(
            d, 760, 168, mix(BG, INK, p))),
    ])


def v8_s2(dur):
    return [*title("Période : 24 h, altitude : 36 000 km",
                   "Ressources et résolution"),
        sync_earth_sat(0.05, 0.6, 400, 440, 70, 170, dur * 0.55, sync=True),
        text_fade(0.3, 0.42, (700, 300), "même période que la Terre : 24 h",
                  size=25, color=GREEN_DARK, anchor="lm"),
        text_fade(0.45, 0.57, (700, 360), "→ paraît IMMOBILE vu du sol",
                  size=25, color=RED, anchor="lm"),
        *multi_text(0.7, 0.88, (120, 620), [
            "Plan de l'équateur · altitude unique ≈ 36 000 km",
        ], size=26, gap=44),
    ]


def v8_s3(dur):
    return [*title("À retenir", "Trace écrite"),
        *multi_text(0.08, 0.4, (110, 270), [
            "• Plan équatorial, même sens que la Terre.",
            "• Période : 24 h → immobile vu du sol.",
            "• Altitude unique : ≈ 36 000 km.",
        ], size=30, gap=60),
    ]


def v9_s1(dur):
    return s_situation(dur, 9, "Les applications",
                       "Situation : à quoi servent-ils ?", [
        dish(0.15, 0.3, 240, 560, 1.4),
        Anim(0.3, 0.45, lambda img, d, p: satellite(
            d, 700, 200, mix(BG, INK, p), 1.3)),
        Anim(0.42, 0.6, lambda img, d, p: (
            d.line([(258, 490), (700, 210)], fill=mix(BG, YELLOW_DARK, p),
                   width=3),
            d.line([(700, 210), (1120, 500)], fill=mix(BG, YELLOW_DARK, p),
                   width=3))),
        text_fade(0.55, 0.68, (1120, 545), "stade", size=22, color=MUTED),
        text_fade(0.55, 0.68, (240, 615), "village", size=22, color=MUTED),
    ])


def v9_s2(dur):
    return [*title("Télévision, météo, communications",
                   "Ressources et résolution"),
        *multi_text(0.05, 0.3, (110, 250), [
            "📺 télévision par antenne parabolique",
            "🌦 météo : surveillance de l'Afrique de l'Ouest",
            "🌐 téléphone et internet entre continents",
        ], size=28, gap=58),
        earth(0.5, 0.6, 640, 560, 62),
        Anim(0.6, 0.85, lambda img, d, p: _troissats(d, p)),
        text_fade(0.8, 0.92, (640, 700),
                  "3 satellites suffisent pour couvrir la Terre", size=24,
                  color=GREEN_DARK),
    ]


def _troissats(d, p):
    n = int(3 * p) + 1
    for i in range(min(3, n)):
        a = math.radians(-90 + i * 120)
        x, y = 640 + 130 * math.cos(a), 560 + 130 * math.sin(a)
        satellite(d, x, y, INK)
        d.line([(640 + 62 * math.cos(a), 560 + 62 * math.sin(a)), (x, y)],
               fill=LINE, width=2)


def v9_s3(dur):
    return [*title("Bravo, module PHY 1 terminé !", "Trace écrite"),
        *multi_text(0.08, 0.35, (110, 270), [
            "• Applications : télévision, télécommunications, météo.",
            "• Tu maîtrises la gravitation et les satellites.",
        ], size=29, gap=58),
        text_fade(0.6, 0.75, (W // 2, 540),
                  "Passe le quiz du module pour valider tes acquis ✦",
                  size=30, color=GREEN_DARK),
    ]


from kademy import line_draw  # noqa: E402  (utilise par certains helpers)

VIDEOS = {
    1: ([v1_s1, v1_s2, v1_s3], "phy1-video-1-interaction.mp4"),
    2: ([v2_s1, v2_s2, v2_s3], "phy1-video-2-loi-gravitation.mp4"),
    3: ([v3_s1, v3_s2, v3_s3], "phy1-video-3-champ.mp4"),
    4: ([v4_s1, v4_s2, v4_s3], "phy1-video-4-satellites.mp4"),
    5: ([v5_s1, v5_s2, v5_s3], "phy1-video-5-vitesse.mp4"),
    6: ([v6_s1, v6_s2, v6_s3], "phy1-video-6-periode.mp4"),
    7: ([v7_s1, v7_s2, v7_s3], "phy1-video-7-kepler.mp4"),
    8: ([v8_s1, v8_s2, v8_s3], "phy1-video-8-geostationnaire.mp4"),
    9: ([v9_s1, v9_s2, v9_s3], "phy1-video-9-applications.mp4"),
}


def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def write_vtt(n, texts, durs, path):
    lines = ["WEBVTT", ""]
    t, idx = 0.0, 1
    for text, d in zip(texts, durs):
        parts = [p.strip() for p in re.split(r"(?<=[.!?:])\s+", text)
                 if p.strip()]
        merged = []
        for p in parts:
            if merged and len(merged[-1]) < 25:
                merged[-1] += " " + p
            else:
                merged.append(p)
        total = sum(len(p) for p in merged) or 1
        tt = t
        for p in merged:
            dd = d * len(p) / total
            lines += [str(idx), f"{ts(tt)} --> {ts(min(tt + dd, t + d))}", p, ""]
            idx += 1
            tt += dd
        t += d
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def seg_texts(n):
    """Textes exacts des voix (prompts) : lus depuis le suivi des jobs via
    l'audio n'etant pas necessaire, on les stocke ici en clair."""
    return TEXTS[n]


TEXTS = {}  # rempli ci-dessous depuis les prompts exacts envoyes a Julian
TEXTS[1] = [
 "Salut ! Essohanam regarde le match au village grâce à une antenne parabolique. L'image vient d'un satellite, perché à des milliers de kilomètres. Première énigme : pourquoi ce satellite ne tombe-t-il pas sur nos têtes ? Ta tâche : découvrir la force invisible qui le retient.",
 "Lâche une mangue : elle tombe vers le sol. La Terre l'attire. Mais la mangue attire aussi la Terre ! Deux corps qui ont une masse s'attirent toujours mutuellement : c'est l'interaction gravitationnelle. Elle est universelle : elle agit entre la Terre et la Lune, entre le Soleil et les planètes, entre le satellite et la Terre. Voilà la réponse : le satellite ne s'échappe pas, car la Terre le retient par la gravitation.",
 "À retenir : deux corps massifs s'attirent mutuellement ; cette attraction s'appelle l'interaction gravitationnelle, et elle est universelle. Prochaine vidéo : la formule qui calcule cette force. À très bientôt !"]
TEXTS[2] = [
 "Salut ! Essohanam veut maintenant mesurer la force qui retient son satellite. Ta tâche : calculer une force de gravitation avec la loi de Newton.",
 "La force entre deux corps vaut : la constante de gravitation, multipliée par la première masse, multipliée par la deuxième masse, le tout divisé par le carré de la distance. Plus les masses sont grandes, plus la force est grande ; plus la distance augmente, plus la force diminue, et vite : si la distance double, la force est divisée par quatre. Regarde l'exemple à l'écran : entre deux corps d'une tonne séparés d'un mètre, la force est minuscule ; entre la Terre et le satellite, elle est énorme, car la masse de la Terre est gigantesque.",
 "À retenir : la force de gravitation égale la constante de gravitation fois les deux masses, divisé par le carré de la distance ; l'attraction diminue avec le carré de la distance. Prochaine vidéo : le champ de gravitation. À très bientôt !"]
TEXTS[3] = [
 "Salut ! Autour de la Terre, chaque point de l'espace sait attirer les objets. Ta tâche : comprendre cette influence qu'on appelle le champ de gravitation.",
 "Autour de tout corps massif règne un champ de gravitation : en chaque point, il indique la force que subirait un kilogramme placé là. Son intensité égale la constante de gravitation fois la masse de l'astre, divisé par le carré de la distance. À la surface de la Terre, elle vaut environ neuf virgule huit newtons par kilogramme ; en montant, elle diminue. C'est pour cela qu'un satellite lointain subit une attraction plus faible qu'au sol.",
 "À retenir : le champ de gravitation égale la constante de gravitation fois la masse de l'astre sur le carré de la distance ; il diminue avec l'altitude. Bravo, tu maîtrises la première capacité ! La suite : le mouvement des satellites. À très bientôt !"]
TEXTS[4] = [
 "Salut ! L'image du match d'Essohanam passe par un satellite. Mais au fait, c'est quoi exactement, un satellite ? Ta tâche : définir et classer les satellites.",
 "Un satellite est un corps qui tourne autour d'une planète. La Lune est le satellite naturel de la Terre. Les satellites artificiels sont lancés par l'homme : satellites de télécommunication comme celui d'Essohanam, satellites météo qui surveillent les pluies pour nos agriculteurs, satellites d'observation, et ceux qui guident la localisation sur ton téléphone. Ils restent en orbite grâce à la gravitation, comme une fronde qu'on fait tourner.",
 "À retenir : un satellite est naturel, comme la Lune, ou artificiel, comme ceux de la télécommunication, de la météo et de la localisation ; tous sont retenus par la gravitation. Prochaine vidéo : leur vitesse. À très bientôt !"]
TEXTS[5] = [
 "Salut ! Pour ne pas retomber, le satellite d'Essohanam doit avancer, et vite. Ta tâche : calculer la vitesse d'un satellite en orbite circulaire.",
 "En orbite circulaire, la gravitation joue le rôle de la corde de la fronde : elle courbe la trajectoire. La vitesse égale la racine carrée du produit de la constante de gravitation par la masse de la Terre, divisé par le rayon de l'orbite, mesuré depuis le centre de la Terre. Plus le satellite est proche, plus il doit aller vite. Regarde l'exemple à l'écran : en orbite basse, environ sept virgule huit kilomètres par seconde, soit Lomé-Kara en une minute !",
 "À retenir : la vitesse égale la racine carrée de la constante de gravitation fois la masse de l'astre sur le rayon de l'orbite ; plus l'orbite est basse, plus la vitesse est grande. Prochaine vidéo : la période de révolution. À très bientôt !"]
TEXTS[6] = [
 "Salut ! Combien de temps met un satellite pour faire un tour complet de la Terre ? Ta tâche : définir et calculer la période de révolution.",
 "La période de révolution est la durée d'un tour complet. Le tour complet mesure deux pi fois le rayon de l'orbite ; parcouru à la vitesse du satellite, cela donne : la période égale deux pi fois le rayon, divisé par la vitesse. Regarde l'exemple à l'écran : la Station spatiale, à quatre cents kilomètres d'altitude, boucle son tour en environ quatre-vingt-douze minutes : ses astronautes voient seize levers de soleil par jour !",
 "À retenir : la période égale deux pi fois le rayon divisé par la vitesse ; plus l'orbite est haute, plus la période est longue. Prochaine vidéo : la loi qui relie période et rayon, découverte par Kepler. À très bientôt !"]
TEXTS[7] = [
 "Salut ! Il y a quatre siècles, Kepler a découvert une règle cachée qui relie toutes les orbites, des satellites de Jupiter au satellite d'Essohanam. Ta tâche : utiliser la troisième loi de Kepler.",
 "La troisième loi de Kepler dit : le carré de la période, divisé par le cube du rayon, est constant pour tous les satellites d'un même astre. À quoi ça sert ? Si tu connais l'orbite d'un satellite, tu peux calculer celle de tous les autres, ou même la masse de la planète ! C'est un grand classique des examens : on te donne les orbites des satellites de Jupiter, tu vérifies ce rapport, et tu en déduis la masse de Jupiter. Tu t'y entraîneras dans le quiz du module.",
 "À retenir : le carré de la période sur le cube du rayon est le même pour tous les satellites d'un même astre. Prochaine vidéo : le satellite qui ne bouge jamais dans le ciel. À très bientôt !"]
TEXTS[8] = [
 "Salut ! L'antenne d'Essohanam ne bouge jamais : elle vise toujours le même point du ciel. Comment est-ce possible, alors que les satellites filent à des kilomètres par seconde ? Ta tâche : caractériser le satellite géostationnaire.",
 "Un satellite géostationnaire tourne dans le plan de l'équateur, dans le même sens que la Terre, avec une période d'exactement vingt-quatre heures : il fait son tour pendant que la Terre fait le sien. Résultat : vu du sol, il paraît immobile ! Cela impose une altitude unique : environ trente-six mille kilomètres. Ni plus haut, ni plus bas.",
 "À retenir : géostationnaire veut dire plan équatorial, période de vingt-quatre heures, altitude d'environ trente-six mille kilomètres, immobile vu du sol. Dernière vidéo : à quoi servent ces satellites. À très bientôt !"]
TEXTS[9] = [
 "Salut ! Dernière étape du voyage d'Essohanam : à quoi servent concrètement les satellites géostationnaires ? Ta tâche : citer leurs applications dans ta vie de tous les jours.",
 "D'abord la télévision et les télécommunications : l'antenne fixe d'Essohanam vise le satellite immobile qui relaie le match. Ensuite la météo : les satellites météo surveillent en permanence l'Afrique de l'Ouest, ses pluies et ses tempêtes, précieux pour nos agriculteurs et nos pêcheurs. Enfin les liaisons téléphoniques et internet entre continents. Trois satellites géostationnaires bien placés suffisent pour couvrir presque toute la Terre !",
 "À retenir : télévision, télécommunications et météorologie sont les grandes applications. Bravo, tu as terminé le module gravitation et satellites ! Passe maintenant le quiz du module pour valider tes acquis. À très bientôt sur Togo Academy !"]


def main():
    nums = [int(a) for a in sys.argv[1:]] or list(range(1, 10))
    for n in nums:
        scenes, outname = VIDEOS[n]
        parts, durs = [], []
        for i, scene in enumerate(scenes, 1):
            mp3 = os.path.join(VOIX, f"v{n}", f"seg{i}.mp3")
            dur = audio_duration(mp3) + 0.6
            durs.append(dur)
            silent = os.path.join(OUT, f"v{n}-s{i}-silent.mp4")
            final = os.path.join(OUT, f"v{n}-s{i}.mp4")
            render_scene(silent, dur, scene(dur))
            mux(silent, mp3, final, dur)
            parts.append(final)
            print(f"video {n} scene {i} : {dur:.1f}s")
        out = os.path.join(OUT, outname)
        concat(parts, out, os.path.join(OUT, f"concat-v{n}.txt"))
        write_vtt(n, TEXTS[n], durs, out.replace(".mp4", ".vtt"))
        print("OK :", out)


if __name__ == "__main__":
    main()
