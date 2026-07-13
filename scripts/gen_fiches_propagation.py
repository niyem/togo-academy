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
            TPL.format(logo=logo, title=title, n=n, body=md2html(body)),
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
