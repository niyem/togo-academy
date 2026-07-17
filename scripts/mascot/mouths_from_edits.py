#!/usr/bin/env python3
"""Fabrique un jeu de bouches (puppet) SANS tremblement, a partir d'un visage de
base + des rendus "edite la bouche" (ex : Nano Banana). Le modele redessine tout
le visage a chaque fois (tete qui bouge/change de taille) ; on garde donc le
CORPS et le VISAGE de la base a l'identique et on ne transplante QUE la region de
la bouche de chaque rendu, recalee et fondue.

Usage :
  python scripts/mascot/mouths_from_edits.py \
     --base ~/Downloads/woman.png \
     --edits B=~/dl/wraw_B.png C=... D=... E=... F=... G=... \
     --dst assets/mascotte-femme
La base devient mascot-A ; X = copie de A.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def gray(a):
    return a[..., :3].mean(2)


def phase_shift(ref, img):
    """(dy, dx) a appliquer a img pour l'aligner sur ref (translation)."""
    F = np.fft.fft2(ref)
    G = np.fft.fft2(img)
    R = F * np.conj(G)
    R /= np.abs(R) + 1e-8
    r = np.fft.ifft2(R).real
    dy, dx = np.unravel_index(int(np.argmax(r)), r.shape)
    h, w = ref.shape
    if dy > h // 2:
        dy -= h
    if dx > w // 2:
        dx -= w
    return dy, dx


def transplant_mouth(base, render, diff_thresh=16):
    H, W, _ = base.shape
    r = np.array(Image.fromarray(render.astype(np.uint8)).resize((W, H))).astype(np.float32)
    gb, gr = gray(base), gray(r)
    # recalage sur la zone yeux/nez (stable), hors bouche
    y0, y1, x0, x1 = int(0.12 * H), int(0.26 * H), int(0.30 * W), int(0.70 * W)
    dy, dx = phase_shift(gb[y0:y1, x0:x1], gr[y0:y1, x0:x1])
    r = ndimage.shift(r, (dy, dx, 0), order=1, mode="nearest")
    gr = gray(r)
    # masque bouche = ou ca differe, restreint a une ROI autour de la bouche
    diff = ndimage.gaussian_filter(np.abs(gb - gr), 3)
    roi = np.zeros((H, W), bool)
    roi[int(0.22 * H):int(0.40 * H), int(0.33 * W):int(0.67 * W)] = True
    mask = (diff > diff_thresh) & roi
    lbl, n = ndimage.label(mask)
    if n:
        sizes = np.bincount(lbl.ravel())
        sizes[0] = 0
        mask = lbl == int(sizes.argmax())
    mask = ndimage.binary_dilation(mask, iterations=7)
    alpha = np.clip(ndimage.gaussian_filter(mask.astype(np.float32), 7), 0, 1)[..., None]
    return base * (1 - alpha) + r * alpha


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--edits", nargs="+", required=True, help="paires FORME=chemin (ex B=... D=...)")
    ap.add_argument("--dst", required=True)
    ap.add_argument("--also-x", action="store_true", default=True)
    args = ap.parse_args()

    base = np.array(Image.open(args.base).convert("RGB")).astype(np.float32)
    dst = Path(args.dst).expanduser()
    dst.mkdir(parents=True, exist_ok=True)
    # A = base
    Image.fromarray(base.astype(np.uint8), "RGB").save(dst / "mascot-A.png")
    Image.fromarray(base.astype(np.uint8), "RGB").save(dst / "mascot-X.png")
    for pair in args.edits:
        shape, path = pair.split("=", 1)
        render = np.array(Image.open(Path(path).expanduser()).convert("RGB")).astype(np.float32)
        out = transplant_mouth(base, render)
        Image.fromarray(out.astype(np.uint8), "RGB").save(dst / f"mascot-{shape}.png")
        print(f"  mascot-{shape}.png <- {Path(path).name}")
    print(f"OK -> {dst}  (A et X = base)")


if __name__ == "__main__":
    main()
