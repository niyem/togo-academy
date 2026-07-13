# Genere les fiches de lecon PDF du chapitre "Propagation d'une onde et
# nature de la lumiere" (Terminale, physique) a partir des traces ecrites
# stockees en base (activities type=lecture).
#
# Charte : bandeau drapeau togolais, logo Groupe BM en en-tete, mention
# Togo Academy. Rendu via Chrome headless (Unicode complet : lambda,
# exposants). Sortie : video/propagation/out/fiche-seance-{n}.pdf
#
# Usage : python3 scripts/gen_fiches_propagation.py
# Puis televerser dans le bucket lesson-pdfs (voir memoire du projet).

import base64
import pathlib
import re
import ssl
import subprocess

import pg8000.native

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHAPTER_ID = "77770001-0000-0000-0000-000000000001"


def db_password() -> str:
    for line in (ROOT / ".env.local").read_text().splitlines():
        if line.startswith("SUPABASE_DB_PASSWORD="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("SUPABASE_DB_PASSWORD absent de .env.local")


def md2html(md: str) -> str:
    html = []
    for block in md.split("\n\n"):
        b = block.strip()
        if not b:
            continue
        if b.startswith("## "):
            html.append(f"<h2>{b[3:]}</h2>")
        else:
            b = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", b)
            html.append("<p>" + b.replace("\n", "<br>") + "</p>")
    return "\n".join(html)


# QCM de renforcement (auto-correction) : ressources d'entrainement recyclees
# de l'ancienne evaluation, par seance. (question, [options], index bonne rep)
QCMS = {
    1: [
        ("Qu'est-ce qu'une onde mécanique ?",
         ["Un transport de matière d'un point à un autre",
          "La propagation d'une perturbation dans un milieu matériel, sans transport de matière",
          "Un courant d'eau qui déplace les objets"], 1),
        ("Pourquoi le son ne peut-il pas traverser l'espace vide ?",
         ["Parce qu'il fait trop froid dans l'espace",
          "Parce que c'est une onde mécanique qui a besoin d'un milieu matériel",
          "Parce qu'il se propage trop lentement"], 1),
        ("Koffi compte 3 secondes entre l'éclair et le tonnerre (son : 340 m/s). L'orage est à environ :",
         ["340 m", "1 km", "3 km"], 1),
    ],
    2: [
        ("Dans une onde transversale, la matière vibre...",
         ["perpendiculairement à la direction de propagation",
          "dans la même direction que la propagation",
          "sans direction précise"], 0),
        ("Le son dans l'air est une onde...",
         ["transversale", "longitudinale", "électromagnétique"], 1),
        ("Un son de 170 Hz dans l'air (célérité 340 m/s) a une longueur d'onde de :",
         ["0,5 m", "2 m", "20 m"], 1),
        ("La longueur d'onde λ est la distance...",
         ["parcourue par l'onde en une seconde",
          "entre deux motifs identiques successifs de l'onde",
          "entre la source et le récepteur"], 1),
        ("Chaque point du milieu touché par une onde périodique oscille...",
         ["avec la même période que la source",
          "deux fois plus vite que la source",
          "de façon aléatoire"], 0),
    ],
    3: [
        ("Dans le vide, la lumière se propage à environ :",
         ["340 m/s", "3 × 10⁸ m/s", "1 500 m/s"], 1),
        ("L'expérience des fentes de Young (apparition de franges) démontre...",
         ["l'aspect ondulatoire de la lumière",
          "l'aspect corpusculaire de la lumière",
          "que la lumière est un son"], 0),
    ],
}


def qcm_html(n: int) -> str:
    items = QCMS.get(n, [])
    if not items:
        return ""
    out = ["<h2>Pour s'entraîner : QCM de renforcement</h2>"]
    for i, (q, opts, _) in enumerate(items, 1):
        letters = "abc"
        choices = " &nbsp; ".join(
            f"{letters[j]}) {o}" for j, o in enumerate(opts))
        out.append(f"<p><strong>{i}.</strong> {q}<br>{choices}</p>")
    answers = " · ".join(
        f"{i}. {'abc'[ans]}" for i, (_, _, ans) in enumerate(items, 1))
    out.append(
        f'<p style="font-size:9.5px;color:#5c6b66"><em>Réponses : {answers}</em></p>')
    return "\n".join(out)


TPL = """<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 0; }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: Helvetica, Arial, sans-serif; color: #1a2b26; }}
.flag {{ display: flex; height: 10px; }}
.flag div {{ flex: 1; }}
.page {{ padding: 30px 46px 40px; }}
.brand {{ display: flex; align-items: center; justify-content: space-between; }}
.brand .wordmark {{ font-size: 15px; font-weight: bold; color: #1a2b26; }}
.brand .wordmark span {{ color: #0b8457; }}
.brand img {{ height: 44px; }}
h1 {{ color: #065c3c; font-size: 23px; margin-top: 16px; }}
.sub {{ color: #5c6b66; font-size: 12.5px; margin-top: 6px; }}
h2 {{ color: #0b8457; font-size: 15px; margin: 20px 0 7px; }}
p {{ font-size: 11.5px; line-height: 1.65; margin-bottom: 8px; }}
strong {{ color: #065c3c; }}
.foot {{ margin-top: 26px; padding-top: 10px; border-top: 2px solid #eafaf1;
        color: #0b8457; font-size: 10px; font-weight: bold; text-align: center; }}
.foot .gbm {{ color: #5c6b66; font-weight: normal; }}
</style></head><body>
<div class="flag"><div style="background:#0b8457"></div><div style="background:#ffce00"></div><div style="background:#d21034"></div></div>
<div class="page">
<div class="brand">
  <div class="wordmark">Togo<span>Academy</span></div>
  <img src="data:image/png;base64,{logo}" alt="Groupe BM">
</div>
<h1>{title}</h1>
<div class="sub">Fiche de leçon · Physique · Terminale · Séance {n} · Togo Academy, un département de Groupe BM</div>
{body}
{qcm}
<p style="margin-top:14px">Retrouve la vidéo, les quiz intégrés et le tuteur IA sur <strong>academie.groupebm.net</strong></p>
<div class="foot">Togo Academy · L'éducation de qualité, accessible partout au Togo<br>
<span class="gbm">Un département de Groupe BM · groupebm.net</span></div>
</div></body></html>"""


def main() -> None:
    logo = base64.b64encode((ROOT / "public" / "gbm-logo.png").read_bytes()).decode()

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    con = pg8000.native.Connection(
        "postgres.mucgtbryctekehwsqajv",
        host="aws-0-eu-west-1.pooler.supabase.com",
        port=5432,
        database="postgres",
        password=db_password(),
        ssl_context=ctx,
    )
    rows = con.run(
        """select l.sort_order, l.title, a.body
           from lessons l
           join activities a on a.lesson_id = l.id and a.type = 'lecture'
           where l.chapter_id = :ch order by l.sort_order""",
        ch=CHAPTER_ID,
    )
    con.close()

    out = ROOT / "video" / "propagation" / "out"
    out.mkdir(parents=True, exist_ok=True)
    for n, title, body in rows:
        src = out / f"fiche-seance-{n}.html"
        src.write_text(
            TPL.format(logo=logo, title=title, n=n, body=md2html(body),
                       qcm=qcm_html(n)),
            encoding="utf-8",
        )
        dst = out / f"fiche-seance-{n}.pdf"
        subprocess.run(
            [CHROME, "--headless", "--disable-gpu",
             f"--print-to-pdf={dst}", "--no-pdf-header-footer",
             str(src.resolve())],
            check=True, capture_output=True,
        )
        print("OK", dst)


if __name__ == "__main__":
    main()
