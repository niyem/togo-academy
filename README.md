# Togo Academy 🎓🇹🇬

Plateforme d'apprentissage en ligne pour les élèves du Togo. Cours vidéo courts,
exercices, quiz corrigés, tuteur IA et suivi de progression, alignés sur le
programme togolais, du primaire au lycée. Mission double : une entreprise
éducative durable **et** un outil de démocratisation de l'éducation de qualité,
en particulier en sciences.

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Style | Tailwind CSS v4, design system « drapeau togolais sur fond blanc » |
| Base de données | PostgreSQL (Supabase) avec Row-Level Security |
| Auth | Supabase Auth (email + OTP téléphone) |
| Stockage PDF | Supabase Storage (URLs signées pour les abonnés) |
| Vidéo | Lecteur agnostique (Bunny Stream / Cloudflare Stream en Phase 1) |
| Paiements | Virement bancaire d'abord, agrégateur mobile (Flooz/TMoney) ensuite |
| IA | Claude API + RAG (pgvector) ancré sur le programme |
| Hébergement | Vercel |

## Démarrage

```bash
npm install
npm run dev
# http://localhost:3000
```

La **Phase 0 fonctionne sans base de données** : le contenu provient de données
typées (`src/lib/content/seed.ts`). Pour brancher Supabase, copiez
`.env.example` vers `.env.local`, remplissez les clés, puis appliquez les
migrations.

## Structure

```
src/
  app/                  Pages (App Router, routes en français)
    catalogue/          Niveaux -> classes
    classes/[classSlug] Matières -> chapitres -> leçons
    lecon/[lessonSlug]  Leçon (vidéo, cours, exemple, exercice, quiz)
    tarifs/ a-propos/ faq/ contact/ connexion/ inscription/
    tableau-de-bord/    Tableau de bord élève (aperçu)
  components/
    ui/                 Primitives du design system
    layout/             Header, Footer
    lesson/             VideoPlayer, LessonProse, ExerciseBlock, QuizBlock
  lib/
    content/            Types + seed + couche d'accès (seam Supabase)
    supabase/           Clients navigateur/serveur + garde de config
supabase/
  migrations/0001_init.sql   Schéma complet + RLS
  seed.sql                   Contenu de démonstration
docs/
  ARCHITECTURE.md            Architecture, modèle de données, feuille de route
```

## Couche de contenu = un « seam »

Toutes les pages lisent le contenu via `src/lib/content/index.ts`. En Phase 0,
ces fonctions renvoient les données du seed. En Phase 1, on remplace leur corps
par des requêtes Supabase (le schéma SQL a la même forme) **sans toucher aux
pages**.

## Feuille de route

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Résumé :

- **Phase 0 — Fondations** (ce dépôt) : design system, pages publiques, schéma
  DB + RLS, échafaudage auth, contenu de démo. ✅
- **Phase 1 — MVP** : Supabase branché, auth réelle, lecteur vidéo réel, suivi
  de progression, un plan + virement bancaire.
- **Phase 2 — Commerce & parents** : tous les plans, Flooz/TMoney, PDF protégés,
  comptes parents + rapports.
- **Phase 3 — IA** : tuteur RAG + chatbot de navigation.
- **Phase 4 — Création** : tableau de bord enseignant + circuit de publication.
- **Phase 5 — Admin & analytics** : tableau de bord admin, indicateurs,
  évaluations.
- **Phase 6 — Tutorat en direct (marketplace)** : sessions privées 1:1 à la
  demande, mise en relation automatique élève ↔ tuteur en ligne (par niveau et
  matière), paiement à la session, versement hebdomadaire aux tuteurs sur Flooz,
  tuteurs validés par l'administrateur.

## Conventions

- Interface en **français** (structurée pour d'autres langues via next-intl plus
  tard).
- Prix en **FCFA (XOF)**.
- Léger et rapide : pas d'animations lourdes, pensé pour les connexions lentes.
