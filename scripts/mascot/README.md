# Mascotte lip-syncee (incrustation dans le coin)

Ajoute une mascotte 2D qui bouge les levres dans le coin d'une video de lecon,
**sans credits Higgsfield**. Higgsfield produit la lecon comme aujourd'hui ; ce
script pose la mascotte par-dessus en local (ffmpeg + Rhubarb). Cout marginal ≈
calcul local. Voir la note memoire `togo-academy-video-production`.

## Comment ca marche

1. Extraction de l'audio de la video (ffmpeg).
2. **Rhubarb Lip Sync** analyse l'audio et sort une piste de formes de bouche
   horodatees (A a F).
3. ffmpeg incruste la mascotte dans le coin : image de base (bouche fermee)
   toujours visible, et la bonne forme de bouche superposee a chaque instant.
4. Re-encodage avec l'audio d'origine.

## Prerequis

- **ffmpeg** : detecte sur le PATH, sinon le binaire fourni par `imageio-ffmpeg`
  (deja present dans `video/.venv`). Rien a installer si vous lancez avec
  `video/.venv/bin/python`.
- **Rhubarb Lip Sync** (pour le vrai lip-sync) :
  https://github.com/DanielSWolf/rhubarb-lip-sync/releases
  Telechargez le binaire `rhubarb`, mettez-le sur le PATH ou passez `--rhubarb`.
  Pas necessaire pour `--selftest`.

## Les assets de la mascotte

Un dossier par personnage, avec des PNG plein personnage **identiques a la forme
de bouche pres**, cadrage et position **verrouilles** :

```
assets/prof-ama/
  mascot-A.png   # bouche fermee (repos, M/B/P)   <- obligatoire
  mascot-B.png   # legerement ouverte, dents proches
  mascot-C.png   # ouverte, ovale detendu
  mascot-D.png   # grande ouverte
  mascot-E.png   # ouverte, arrondie moyenne
  mascot-F.png   # levres arrondies serrees (ou/w)
  # optionnels : mascot-G.png (f/v), mascot-X.png (silence = A)
```

Fond transparent (alpha). Les formes manquantes retombent sur la plus proche
(au pire A). A-F suffisent.

### Preparer les assets (fond transparent)

Les PNG de ChatGPT arrivent souvent avec un fond BLANC opaque (pas de vraie
transparence). `make_transparent.py` retire le fond blanc + les poches blanches
piegees entre les bras et le corps, tout en gardant les blancs internes (dents
des bouches ouvertes, blanc des yeux) :

```
video/.venv/bin/python scripts/mascot/make_transparent.py \
  --src ~/Downloads --dst assets/mascotte-homme
```

Il etiquette les regions blanches (scipy) et retire celles qui touchent un bord
(fond) ou qui sont grandes (poches) ; il conserve les petites regions enfermees.
Regler `--big-frac` si une poche subsiste (baisser) ou si des dents disparaissent
(monter). Deps : `pip install pillow numpy scipy` (deja dans `video/.venv`).

## Utilisation

Verifier le cablage (aucun asset requis) :

```
video/.venv/bin/python scripts/mascot/lipsync_overlay.py --selftest
```

Sur une vraie lecon :

```
video/.venv/bin/python scripts/mascot/lipsync_overlay.py \
  --video lecons/terminale-a/lecon01.mp4 \
  --mascot-dir assets/prof-ama \
  --out sorties/lecon01_mascotte.mp4
```

Deja un `cues.json` Rhubarb ? Sautez l'etape Rhubarb avec `--cues cues.json`.

## Reglages

| Option | Defaut | Role |
|---|---|---|
| `--corner` | `bottom-right` | coin (bottom-left, top-right, top-left) |
| `--height-frac` | `0.42` | hauteur mascotte / hauteur video |
| `--margin` | `24` | marge en pixels |
| `--recognizer` | `phonetic` | **`phonetic` pour le francais** (pocketSphinx = anglais uniquement) |
| `--extended` | `""` | formes etendues Rhubarb (`""` = A-F seules, `GX` pour ajouter G et X) |

Astuce coin : pour une petite incrustation, garder le visage lisible prime ;
au besoin, cadrer la mascotte plus serree (buste) ou augmenter `--height-frac`.
