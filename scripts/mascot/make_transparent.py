#!/usr/bin/env python3
"""Rend transparent le fond blanc des PNG de mascotte, SANS toucher aux blancs
internes (dents des bouches ouvertes, blanc des yeux).

Methode : remplissage par diffusion (flood fill) depuis les coins. Le fond blanc
qui entoure le personnage est une seule region connectee touchant les bords ; on
la remplit et on la rend transparente. Les dents et les yeux sont des ilots
blancs ENFERMES dans le personnage, jamais atteints depuis les bords, donc
preserves.

Usage :
  python scripts/mascot/make_transparent.py --src ~/Downloads --dst assets/mascotte-homme
  (traite src/mascot-*.png -> dst/mascot-*.png en RGBA)
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SENTINEL = (255, 0, 255)  # magenta : marque les pixels de fond


def is_light(px, cutoff=230):
    return px[0] >= cutoff and px[1] >= cutoff and px[2] >= cutoff


def remove_bg(inp, outp, cutoff=205, big_frac=0.006):
    src_im = Image.open(inp)
    # deja transparent (ex : mascot-G) -> on recopie tel quel, sans l'aplatir.
    if src_im.mode in ("RGBA", "LA") or (src_im.mode == "P" and "transparency" in src_im.info):
        rgba = src_im.convert("RGBA")
        a = np.array(rgba)[:, :, 3]
        if a.min() == 0:
            rgba.save(outp)
            return -1, int((a == 0).sum()), rgba.size[0] * rgba.size[1]
    im = src_im.convert("RGB")
    w, h = im.size
    orig = np.array(im)
    near_white = np.all(orig >= cutoff, axis=-1)

    # Etiquetage des regions blanches connectees (scipy, en C). On retire celles
    # qui touchent un bord (fond) OU qui sont grandes (poches piegees entre bras
    # et corps) ; on garde les petites enfermees (dents, yeux).
    lbl, ncomp = ndimage.label(near_white)
    if ncomp == 0:
        Image.fromarray(np.dstack([orig, np.full((h, w), 255, np.uint8)]), "RGBA").save(outp)
        return 0, 0, w * h
    sizes = np.bincount(lbl.ravel())
    border = np.unique(np.concatenate([lbl[0, :], lbl[-1, :], lbl[:, 0], lbl[:, -1]]))
    big = big_frac * w * h
    kill_labels = set(int(b) for b in border if b != 0)
    kill_labels |= set(int(i) for i in np.where(sizes > big)[0] if i != 0)
    kill = np.isin(lbl, list(kill_labels))

    alpha = np.where(kill, 0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([orig, alpha]), "RGBA").save(outp)
    return ncomp, int(kill.sum()), w * h


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="dossier des PNG source (mascot-*.png)")
    ap.add_argument("--dst", required=True, help="dossier de sortie (RGBA)")
    ap.add_argument("--cutoff", type=int, default=205, help="seuil blanc (0-255)")
    ap.add_argument("--big-frac", type=float, default=0.006,
                    help="fraction d'image au-dela de laquelle une region blanche est une poche a retirer")
    args = ap.parse_args()

    src = Path(args.src).expanduser()
    dst = Path(args.dst).expanduser()
    dst.mkdir(parents=True, exist_ok=True)

    files = sorted(src.glob("mascot-*.png"))
    if not files:
        raise SystemExit(f"aucun mascot-*.png dans {src}")
    for f in files:
        ncomp, killpx, total = remove_bg(f, dst / f.name, args.cutoff, args.big_frac)
        pct = 100 * killpx / total
        note = "deja transparent" if ncomp == -1 else f"{ncomp} regions"
        print(f"  {f.name:14s} transparent {pct:4.1f}%  ({note})")
    print(f"OK -> {dst}")


if __name__ == "__main__":
    main()
