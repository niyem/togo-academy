# Genere la fiche de lecon PDF "Theoreme de Thales" (3eme, maths).
# Charte Togo Academy : bandeau drapeau, vert #0b8457, fond blanc.

from fpdf import FPDF

GREEN = (11, 132, 87)
GREEN_DARK = (6, 92, 60)
YELLOW = (255, 206, 0)
RED = (210, 16, 52)
INK = (26, 43, 38)
MUTED = (92, 107, 102)

pdf = FPDF(format="A4")
pdf.set_auto_page_break(True, margin=18)
pdf.add_page()

# Bandeau drapeau
w = pdf.w / 3
for i, c in enumerate([GREEN, YELLOW, RED]):
    pdf.set_fill_color(*c)
    pdf.rect(i * w, 0, w, 4, "F")

pdf.set_y(14)
pdf.set_text_color(*GREEN_DARK)
pdf.set_font("helvetica", "B", 22)
pdf.cell(0, 10, "Le théorème de Thalès", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("helvetica", "", 12)
pdf.set_text_color(*MUTED)
pdf.cell(0, 8, "Fiche de leçon · Mathématiques · Classe de 3ème · Togo Academy",
         new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)


def section(title):
    pdf.ln(3)
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(*GREEN)
    pdf.cell(0, 9, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(*INK)
    pdf.set_font("helvetica", "", 11)


def para(text):
    pdf.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")


section("1. La configuration de Thalès")
para("On considère deux droites sécantes en un point A. Deux autres droites "
     "(BC) et (MN) sont parallèles, M étant sur (AB) et N sur (AC). "
     "C'est la configuration de Thalès.")

section("2. Le théorème")
para("Si (MN) et (BC) sont parallèles, alors les longueurs sont "
     "proportionnelles :")
pdf.set_font("helvetica", "B", 13)
pdf.set_fill_color(234, 250, 241)
pdf.multi_cell(0, 9, "AM / AB  =  AN / AC  =  MN / BC", fill=True,
               new_x="LMARGIN", new_y="NEXT")
pdf.set_font("helvetica", "", 11)
para("Ce théorème permet de calculer une longueur inconnue dès que l'on "
     "connaît trois des autres longueurs.")

section("3. Exemple résolu")
para("On sait que AM = 3 cm, AB = 5 cm et AC = 8 cm. Les droites (MN) et "
     "(BC) sont parallèles. Calculer AN.\n\n"
     "D'après le théorème de Thalès : AM/AB = AN/AC.\n"
     "Donc AN = AC x (AM / AB) = 8 x (3 / 5) = 4,8 cm.")

section("4. À retenir")
para("- La condition indispensable : deux droites PARALLÈLES coupées par "
     "deux sécantes.\n"
     "- Trois rapports égaux : AM/AB = AN/AC = MN/BC.\n"
     "- Pour trouver une longueur : produit en croix.\n"
     "- La réciproque du théorème sert à prouver que deux droites sont "
     "parallèles (leçon suivante).")

section("5. Exerce-toi")
para("Dans la même configuration, AM = 4 cm, AB = 6 cm et BC = 9 cm. "
     "Calculer MN. (Réponse : MN = 9 x 4/6 = 6 cm)\n\n"
     "Retrouve la vidéo, les exercices interactifs et le quiz sur "
     "academie.groupebm.net")

pdf.set_y(-20)
pdf.set_font("helvetica", "B", 9)
pdf.set_text_color(*GREEN)
pdf.cell(0, 6, "Togo Academy · L'éducation de qualité, accessible partout au Togo",
         align="C")

out = "video/pilot/out/fiche-lecon-thales.pdf"
pdf.output(out)
print("OK:", out)
