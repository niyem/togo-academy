"""
kademy.py : moteur de rendu video leger pour Togo Academy.

Pipeline "tableau blanc" sans dependances natives : Pillow dessine chaque image,
le binaire ffmpeg embarque par imageio-ffmpeg encode en H.264. Concu pour les
lecons : traits qui se tracent, points nommes, fractions, equations, mascotte.

Usage : les scripts de lecon (ex. render_thales.py) declarent des scenes comme
des listes d'animations sur une timeline normalisee [0,1], la duree reelle de
chaque scene etant dictee par la piste audio de narration.
"""

from __future__ import annotations

import math
import os
import subprocess
from dataclasses import dataclass, field
from typing import Callable, List, Optional, Tuple

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Charte graphique (reprend les tokens du site)
# ---------------------------------------------------------------------------
W, H = 1280, 720
FPS = 30

BG = (255, 255, 255)
INK = (26, 43, 38)          # #1a2b26
MUTED = (92, 107, 102)      # #5c6b66
GREEN = (11, 132, 87)       # #0b8457
GREEN_DARK = (6, 92, 60)    # #065c3c
YELLOW = (255, 206, 0)      # #ffce00
YELLOW_DARK = (201, 159, 0)
RED = (210, 16, 52)         # #d21034
LINE = (230, 235, 232)

FONT_DIR = "/System/Library/Fonts/Supplemental"


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    name = "Arial Bold.ttf" if bold else "Arial.ttf"
    return ImageFont.truetype(f"{FONT_DIR}/{name}", size)


def ease(p: float) -> float:
    """Smoothstep : demarrage et fin en douceur."""
    p = max(0.0, min(1.0, p))
    return p * p * (3 - 2 * p)


def lerp(a: float, b: float, p: float) -> float:
    return a + (b - a) * p


def lerp_pt(p1, p2, p):
    return (lerp(p1[0], p2[0], p), lerp(p1[1], p2[1], p))


def mix(c1, c2, p):
    return tuple(int(lerp(a, b, p)) for a, b in zip(c1, c2))


# ---------------------------------------------------------------------------
# Animations : chacune expose draw(img, d, p) avec p en [0,1] (deja "ease")
# et reste affichee a p=1 apres sa fenetre.
# ---------------------------------------------------------------------------
@dataclass
class Anim:
    t0: float  # debut, fraction de la scene [0,1]
    t1: float  # fin
    draw_fn: Callable[[Image.Image, ImageDraw.ImageDraw, float], None]
    linear: bool = False  # True : progression lineaire (lecture video)

    def progress(self, t: float) -> Optional[float]:
        if t < self.t0:
            return None
        if self.t1 <= self.t0:
            return 1.0
        p = (t - self.t0) / (self.t1 - self.t0)
        return max(0.0, min(1.0, p)) if self.linear else ease(p)


def line_draw(t0, t1, p1, p2, color=INK, width=5) -> Anim:
    """Trait qui se trace de p1 vers p2."""
    def fn(img, d, p):
        d.line([p1, lerp_pt(p1, p2, p)], fill=color, width=width)
    return Anim(t0, t1, fn)


def dot_label(t0, t1, pos, label, offset=(14, -30), color=INK, r=7,
              fsize=30) -> Anim:
    """Point qui apparait + etiquette."""
    f = font(fsize)
    def fn(img, d, p):
        rr = r * p
        d.ellipse([pos[0] - rr, pos[1] - rr, pos[0] + rr, pos[1] + rr],
                  fill=color)
        if p > 0.5:
            tp = (p - 0.5) / 0.5
            d.text((pos[0] + offset[0], pos[1] + offset[1]), label,
                   font=f, fill=mix(BG, color, tp))
    return Anim(t0, t1, fn)


def text_fade(t0, t1, pos, text, size=34, color=INK, bold=True,
              anchor="mm") -> Anim:
    f = font(size, bold)
    def fn(img, d, p):
        d.text(pos, text, font=f, fill=mix(BG, color, p), anchor=anchor)
    return Anim(t0, t1, fn)


def fraction(t0, t1, center, num, den, size=34, color=INK) -> Anim:
    """Fraction num/den avec barre horizontale, centree sur `center`."""
    f = font(size)
    def fn(img, d, p):
        c = mix(BG, color, p)
        wn = d.textlength(num, font=f)
        wd = d.textlength(den, font=f)
        bar = max(wn, wd) / 2 + 8
        x, y = center
        d.text((x, y - size * 0.72), num, font=f, fill=c, anchor="mm")
        d.text((x, y + size * 0.72), den, font=f, fill=c, anchor="mm")
        d.line([(x - bar, y), (x + bar, y)], fill=c, width=4)
    return Anim(t0, t1, fn)


def rounded_box(t0, t1, box, color=YELLOW, width=5, radius=16) -> Anim:
    """Cadre arrondi qui apparait (mise en valeur)."""
    def fn(img, d, p):
        d.rounded_rectangle(box, radius=radius,
                            outline=mix(BG, color, p), width=width)
    return Anim(t0, t1, fn)


def parallel_marks(t0, t1, p1, p2, color=YELLOW_DARK) -> Anim:
    """Double chevron au milieu d'un segment (marque de parallelisme)."""
    def fn(img, d, p):
        c = mix(BG, color, p)
        mx, my = lerp_pt(p1, p2, 0.5)
        ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
        for k in (-1, 1):
            ox = mx + k * 7 * math.cos(ang)
            oy = my + k * 7 * math.sin(ang)
            for s in (-1, 1):
                ex = ox - 12 * math.cos(ang + s * 2.5)
                ey = oy - 12 * math.sin(ang + s * 2.5)
                d.line([(ox, oy), (ex, ey)], fill=c, width=4)
    return Anim(t0, t1, fn)


EXTRACT_FPS = 15  # cadence d'extraction des clips mascotte


def video_sprite(t0, t1, frames_dir, center, height, window_sec) -> Anim:
    """Clip mascotte anime : lecture en boucle ping-pong a vitesse naturelle.

    `frames_dir` contient des PNG extraits a EXTRACT_FPS ; `window_sec` est la
    duree reelle couverte par la fenetre [t0, t1] de la scene.
    """
    import glob as _glob
    files = sorted(_glob.glob(os.path.join(frames_dir, "*.png")))
    scaled = []
    for fp in files:
        im = Image.open(fp).convert("RGB")
        w2 = int(im.width * height / im.height)
        scaled.append(im.resize((w2, height), Image.LANCZOS))
    seq = scaled + scaled[-2:0:-1] if len(scaled) > 2 else scaled

    def fn(img, d, p):
        elapsed = p * window_sec
        idx = int(elapsed * EXTRACT_FPS) % len(seq)
        im = seq[idx]
        img.paste(im, (int(center[0] - im.width / 2),
                       int(center[1] - im.height / 2)))
    return Anim(t0, t1, fn, linear=True)


def image_paste(t0, t1, img_path, center, height, zoom_to=1.04) -> Anim:
    """Mascotte : fondu + tres leger zoom (effet Ken Burns)."""
    src = Image.open(img_path).convert("RGBA")
    def fn(img, d, p):
        z = lerp(1.0, zoom_to, p)
        h2 = int(height * z)
        w2 = int(src.width * h2 / src.height)
        im = src.resize((w2, h2), Image.LANCZOS)
        if p < 1.0:
            alpha = im.getchannel("A").point(lambda a: int(a * p))
            im.putalpha(alpha)
        img.paste(im, (int(center[0] - w2 / 2), int(center[1] - h2 / 2)), im)
    return Anim(t0, t1, fn)


# ---------------------------------------------------------------------------
# Habillage permanent : bandeau drapeau + marque
# ---------------------------------------------------------------------------
def chrome(d: ImageDraw.ImageDraw):
    third = W / 3
    d.rectangle([0, 0, third, 8], fill=GREEN)
    d.rectangle([third, 0, 2 * third, 8], fill=YELLOW)
    d.rectangle([2 * third, 0, W, 8], fill=RED)
    f = font(22)
    d.text((W - 24, H - 26), "Academy", font=f, fill=GREEN, anchor="rm")
    tw = d.textlength("Academy", font=f)
    d.text((W - 24 - tw, H - 26), "Togo", font=f, fill=INK, anchor="rm")


# ---------------------------------------------------------------------------
# Rendu d'une scene -> MP4 muet, puis mux avec la narration
# ---------------------------------------------------------------------------
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def render_scene(path: str, duration: float, anims: List[Anim]):
    n = max(1, int(duration * FPS))
    cmd = [
        FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
        "-s", f"{W}x{H}", "-pix_fmt", "rgb24", "-r", str(FPS), "-i", "-",
        "-an", "-vcodec", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "20", "-r", str(FPS), path,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL)
    for i in range(n):
        t = i / n
        img = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(img)
        for a in anims:
            p = a.progress(t)
            if p is not None:
                a.draw_fn(img, d, p)
        chrome(d)  # bandeau + marque par-dessus tout (jamais recouverts)
        proc.stdin.write(img.tobytes())
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg a echoue pour {path}")


def audio_duration(path: str) -> float:
    """Duree d'un fichier audio via la sortie d'ffmpeg."""
    r = subprocess.run([FFMPEG, "-i", path], capture_output=True, text=True)
    for line in r.stderr.splitlines():
        if "Duration:" in line:
            hms = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = hms.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError(f"duree introuvable : {path}")


def mux(video: str, audio: str, out: str, duration: float):
    """Assemble video + narration, en callant l'audio sur la duree video."""
    subprocess.run([
        FFMPEG, "-y", "-i", video, "-i", audio,
        "-c:v", "copy", "-c:a", "aac", "-ar", "44100", "-ac", "2",
        "-af", "apad", "-t", f"{duration:.3f}", out,
    ], check=True, capture_output=True)


def concat(files: List[str], out: str, listfile: str):
    with open(listfile, "w") as fh:
        for f in files:
            fh.write(f"file '{f}'\n")
    subprocess.run([
        FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", listfile,
        "-c", "copy", out,
    ], check=True, capture_output=True)
