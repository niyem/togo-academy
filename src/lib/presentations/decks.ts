// Version web des 4 decks de presentation, pour le mode presentateur dans
// l'admin (plein ecran + notes a lire). Le contenu et les notes reprennent les
// fichiers .pptx (COWORK/TOGO-ACADEMY/presentations). Le .pptx reste
// telechargeable depuis /public/presentations.

export type Card = { icon?: string; title: string; body?: string };
export type Stat = { big: string; label: string };
export type Step = { n: string; title: string; body: string };
export type Tile = { icon: string; label: string };
export type Faq = { q: string; a: string };
export type Price = { label: string; price: string; items: string[]; featured?: boolean };
export type Col = { title: string; items: string[] };

export type Block =
  | { type: "text"; paragraphs: string[] }
  | { type: "cards"; cols?: 2 | 3; items: Card[] }
  | { type: "steps"; items: Step[] }
  | { type: "stats"; items: Stat[] }
  | { type: "tiles"; items: Tile[] }
  | { type: "faq"; items: Faq[] }
  | { type: "pricing"; items: Price[] }
  | { type: "twocol"; left: Col; right: Col };

export type Slide =
  | { kind: "cover"; kicker: string; title: string; subtitle: string; presenter: string; notes: string }
  | { kind: "closing"; kicker: string; title: string; body: string; contacts: string[]; notes: string }
  | { kind: "content"; kicker: string; title: string; blocks: Block[]; notes: string };

export type Deck = {
  slug: string;
  name: string;
  audience: string;
  file: string; // dans /public/presentations
  slides: Slide[];
};

const PRESENTER = "Niyem M. Bawana, Ph.D.";

const investisseurs: Deck = {
  slug: "investisseurs",
  name: "Investisseurs",
  audience: "Lever du financement",
  file: "1-Togo-Academy-Investisseurs.pptx",
  slides: [
    {
      kind: "cover",
      kicker: "Dossier investisseurs",
      title: "L'éducation STIM de qualité, accessible partout au Togo.",
      subtitle:
        "Une plateforme e-learning alignée sur le programme officiel togolais, du primaire au baccalauréat.",
      presenter: PRESENTER,
      notes:
        "Bonjour, et merci d'être là. Je suis Niyem Bawana, fondateur de Togo Academy. Ce que je vais vous présenter, c'est notre projet pour rendre une éducation scientifique de qualité accessible à chaque élève togolais, où qu'il se trouve. En quelques minutes, je veux vous montrer pourquoi ce projet compte, où il en est, et comment vous pouvez y prendre part.",
    },
    {
      kind: "content",
      kicker: "Le problème",
      title: "Un déficit d'éducation scientifique",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "🏫", title: "Manque d'enseignants", body: "De nombreux établissements, surtout hors des grandes villes, manquent de professeurs qualifiés en sciences." },
            { icon: "📉", title: "Échecs aux examens", body: "Sans explications claires en maths, physique, chimie et SVT, les résultats au BEPC et au BAC s'effondrent." },
            { icon: "⚖️", title: "Inégalité d'accès", body: "L'accès à un soutien de qualité dépend trop souvent de la ville et des revenus de la famille." },
          ],
        },
      ],
      notes:
        "Commençons par le problème. Au Togo, de nombreux établissements, surtout loin des grandes villes, manquent d'enseignants qualifiés en sciences. Résultat : trop d'élèves abordent les mathématiques, la physique ou la chimie sans explications claires, et leurs résultats au BEPC et au BAC s'effondrent. Aujourd'hui, la réussite d'un enfant dépend encore trop de sa ville et des moyens de sa famille. C'est cette inégalité que nous voulons corriger.",
    },
    {
      kind: "content",
      kicker: "Notre solution",
      title: "Une plateforme STIM, 100% programme togolais",
      blocks: [
        {
          type: "text",
          paragraphs: [
            "Togo Academy rend accessible, partout et à faible coût, un enseignement STIM de qualité : Sciences, Technologie, Ingénierie, Mathématiques, plus l'Anglais.",
            "Chaque leçon suit l'approche par compétences (APC) du programme officiel : vidéo courte, cours écrit, quiz, tuteur IA et fiches téléchargeables.",
          ],
        },
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "🎬", title: "Leçons vidéo APC", body: "Un concept à la fois, clair et visuel." },
            { icon: "📝", title: "Examens officiels", body: "Du CEPD au BAC, corrigés automatiquement, seuils 70% et 80%." },
            { icon: "🤖", title: "Tuteur IA", body: "Explique autrement, sans jamais donner la réponse." },
          ],
        },
      ],
      notes:
        "Notre réponse, c'est une plateforme d'apprentissage en ligne, cent pour cent alignée sur le programme officiel togolais. Nous couvrons les sciences, la technologie, l'ingénierie, les mathématiques et l'anglais. Chaque leçon suit l'approche par compétences : une vidéo courte, un cours écrit, des quiz, un tuteur intelligent et une fiche à télécharger. En clair, nous mettons un bon professeur dans la poche de chaque élève.",
    },
    {
      kind: "content",
      kicker: "Le produit",
      title: "Un produit complet, déjà en ligne",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "🎬", title: "Leçons STIM", body: "Vidéos, cours écrits, exemples et exercices guidés." },
            { icon: "📝", title: "Évaluations & examens", body: "Quiz intégrés, épreuves officielles, certificats à la clé." },
            { icon: "🤖", title: "Tuteur IA", body: "Un accompagnement disponible dans chaque leçon." },
            { icon: "🎓", title: "Certificats de cours", body: "Signés et vérifiables en ligne." },
            { icon: "📶", title: "Pensé pour le Togo", body: "Léger, mobile, paiement Flooz ou virement bancaire." },
            { icon: "🌍", title: "Multi-matières", body: "STIM et Anglais, du primaire au BAC." },
          ],
        },
      ],
      notes:
        "Et ce n'est pas une idée sur papier : le produit existe déjà et il est en ligne. Les élèves y trouvent des leçons complètes, des évaluations et des examens officiels du CEPD au BAC, un tuteur disponible à toute heure, et des certificats vérifiables. Le tout est pensé pour le Togo : léger, mobile, et payable simplement.",
    },
    {
      kind: "content",
      kicker: "Traction",
      title: "Une plateforme vivante, pas une maquette",
      blocks: [
        {
          type: "stats",
          items: [
            { big: "27", label: "classes couvertes (CP1 au BAC)" },
            { big: "267", label: "leçons publiées" },
            { big: "7", label: "matières STIM et Anglais" },
            { big: "EN LIGNE", label: "academie.groupebm.net" },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Curriculum complet en ligne, premiers modules vidéo produits en Physique, moteur d'examens officiels et tuteur IA opérationnels.",
          ],
        },
      ],
      notes:
        "Voici où nous en sommes concrètement. Vingt-sept classes couvertes, du primaire au baccalauréat. Deux cent soixante-sept leçons déjà publiées. Sept matières. Et une plateforme accessible en ligne dès maintenant. Je le répète : ce n'est pas une maquette, c'est un produit vivant que des élèves utilisent.",
    },
    {
      kind: "content",
      kicker: "Le marché",
      title: "Un marché large et sous-servi",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "🇹🇬", title: "Togo", body: "Des centaines de milliers d'élèves du primaire au lycée, mal desservis en soutien scientifique." },
            { icon: "🌍", title: "Afrique francophone", body: "Des millions d'élèves partageant le même système et les mêmes besoins : un marché réplicable." },
            { icon: "📈", title: "E-learning en essor", body: "La pénétration mobile progresse vite : le numérique devient le canal le plus efficace pour toucher les familles." },
          ],
        },
      ],
      notes:
        "Parlons du marché. Rien qu'au Togo, ce sont des centaines de milliers d'élèves mal accompagnés en sciences. Et au-delà, toute l'Afrique francophone partage le même système et les mêmes besoins : le marché est large et réplicable. La montée du mobile fait du numérique le meilleur moyen d'atteindre les familles.",
    },
    {
      kind: "content",
      kicker: "Pourquoi maintenant",
      title: "Le bon moment, le bon canal",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "📱", title: "Le mobile est partout", body: "Le smartphone est le premier écran des familles togolaises, y compris hors des grandes villes." },
            { icon: "💸", title: "Le paiement mobile adopté", body: "Flooz et le mobile money simplifient l'abonnement ; le virement bancaire reste possible." },
            { icon: "🙋🏾", title: "Une demande de soutien forte", body: "Les familles cherchent activement un appui fiable pour réussir le BEPC et le BAC." },
            { icon: "🤖", title: "L'IA rend le tutorat scalable", body: "Un tuteur intelligent accompagne chaque élève à grande échelle et à faible coût." },
          ],
        },
      ],
      notes:
        "Pourquoi maintenant ? Parce que tout converge. Le smartphone est devenu le premier écran des familles togolaises, même hors des grandes villes. Le paiement mobile est adopté, et le virement bancaire reste possible pour ceux qui le préfèrent. La demande de soutien scolaire est forte. Et l'intelligence artificielle nous permet enfin d'offrir un tutorat de qualité à grande échelle et à faible coût.",
    },
    {
      kind: "content",
      kicker: "Modèle économique",
      title: "Des revenus récurrents et diversifiés",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "💳", title: "Abonnements", body: "De 1 000 F/sem (une matière) à 3 000 F/mois ou 7 500 F/trimestre par classe, 25 000 F/an plateforme." },
            { icon: "🎯", title: "Kits d'examen", body: "Préparation ciblée CEPD, BEPC, Probatoire, BAC (8 000 à 20 000 FCFA), à l'unité." },
            { icon: "👨🏾‍🏫", title: "Tutorat en direct", body: "Séances privées 1:1 avec des enseignants, payables à la séance." },
            { icon: "🏫", title: "Partenariats écoles", body: "Licences B2B pour établissements et ONG éducatives." },
          ],
        },
      ],
      notes:
        "Notre modèle repose sur des revenus récurrents et diversifiés. D'abord les abonnements, de mille francs par semaine pour une matière jusqu'à vingt-cinq mille francs par an pour toute la plateforme. Ensuite les kits de préparation aux examens, de huit à vingt mille francs. Puis le tutorat en direct, payable à la séance. Et enfin les partenariats avec les écoles et les ONG.",
    },
    {
      kind: "content",
      kicker: "Avantage concurrentiel",
      title: "Ce qui nous distingue",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🇹🇬", title: "100% programme togolais", body: "Fidèle à l'approche par compétences officielle, pas un contenu importé." },
            { icon: "🤖", title: "IA pédagogique", body: "Tuteur et correction d'examens par IA, déployés à grande échelle." },
            { icon: "📶", title: "Mobile-first, faible débit", body: "Conçu pour les connexions réelles du terrain togolais." },
            { icon: "🔗", title: "Écosystème Groupe BM", body: "Adossé à un groupe actif en éducation, immigration, services et ingénierie." },
          ],
        },
      ],
      notes:
        "Qu'est-ce qui nous distingue ? Un contenu cent pour cent fidèle au programme togolais, pas un cours importé. Une pédagogie portée par l'intelligence artificielle. Une plateforme pensée pour les connexions réelles du terrain. Et l'appui d'un groupe déjà établi, Groupe BM.",
    },
    {
      kind: "content",
      kicker: "Adossé à un groupe",
      title: "La force du Groupe BM",
      blocks: [
        {
          type: "text",
          paragraphs: [
            "Bâtir et moderniser. Togo Academy est un département de Groupe BM et s'appuie sur les ressources, la crédibilité et le réseau d'un groupe qui connecte les talents à l'excellence mondiale.",
          ],
        },
        {
          type: "tiles",
          items: [
            { icon: "🎓", label: "Éducation" },
            { icon: "🌍", label: "Immigration" },
            { icon: "💼", label: "Services" },
            { icon: "🛠️", label: "Ingénierie" },
          ],
        },
      ],
      notes:
        "Car Togo Academy n'avance pas seule. Nous sommes un département de Groupe BM, dont la devise est bâtir et moderniser. Nous nous appuyons sur ses ressources, sa crédibilité et son réseau, présents dans l'éducation, l'immigration, les services professionnels et l'ingénierie.",
    },
    {
      kind: "content",
      kicker: "Vision",
      title: "Du Togo à l'Afrique francophone",
      blocks: [
        {
          type: "steps",
          items: [
            { n: "1", title: "Consolider le Togo", body: "Compléter les contenus vidéo et convertir les premiers abonnés payants." },
            { n: "2", title: "Densifier et monétiser", body: "Tutorat, kits d'examen et partenariats écoles pour atteindre la rentabilité." },
            { n: "3", title: "Répliquer la recette", body: "Étendre aux pays voisins partageant le programme francophone." },
          ],
        },
      ],
      notes:
        "Notre trajectoire tient en trois temps. D'abord consolider le Togo : compléter les contenus et convertir nos premiers abonnés. Ensuite densifier et monétiser, grâce au tutorat, aux kits et aux partenariats, pour atteindre la rentabilité. Enfin répliquer la recette dans les pays voisins francophones.",
    },
    {
      kind: "content",
      kicker: "La levée",
      title: "Où ira votre investissement",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🎬", title: "Production vidéo STIM", body: "Compléter les modules vidéo dans toutes les matières et niveaux." },
            { icon: "⚙️", title: "Plateforme et IA", body: "Renforcer le tuteur IA, le moteur d'examens et l'expérience mobile." },
            { icon: "📣", title: "Marketing et acquisition", body: "Faire connaître la plateforme aux familles et convertir les abonnés." },
            { icon: "👥", title: "Équipe", body: "Recruter les talents pédagogiques et techniques clés." },
          ],
        },
      ],
      notes:
        "Venons-en à votre rôle. Nous levons des fonds pour accélérer sur quatre fronts : la production de nos vidéos, la plateforme et l'intelligence artificielle, le marketing et l'acquisition d'élèves, et le recrutement des talents clés. Si vous avez fixé le montant recherché, annoncez-le à ce moment.",
    },
    {
      kind: "closing",
      kicker: "Rejoignez-nous",
      title: "Investissons dans une génération.",
      body: "Rejoignez-nous pour démocratiser l'éducation de qualité au Togo et au-delà. Discutons de l'opportunité.",
      contacts: ["info@groupebm.net", "academie.groupebm.net"],
      notes:
        "Investir dans Togo Academy, c'est investir dans une génération d'élèves togolais, et dans un modèle qui peut essaimer dans toute l'Afrique francophone. Je serais heureux d'en discuter avec vous en détail. Vous pouvez me joindre à info arobase groupebm point net. Merci.",
    },
  ],
};

const parents: Deck = {
  slug: "parents",
  name: "Parents & apprenants",
  audience: "Parents et élèves",
  file: "2-Togo-Academy-Parents-Apprenants.pptx",
  slides: [
    {
      kind: "cover",
      kicker: "Pour les élèves et les parents",
      title: "Réussis tes examens, où que tu sois.",
      subtitle: "Des leçons claires et un tuteur toujours disponible, directement sur ton téléphone.",
      presenter: PRESENTER,
      notes:
        "Bonjour à toutes et à tous, et merci d'être venus. Je m'appelle Niyem Bawana, et je dirige Togo Academy. Aujourd'hui, je veux vous montrer comment votre enfant peut mieux comprendre ses cours et réussir ses examens, directement depuis un téléphone, où qu'il soit.",
    },
    {
      kind: "content",
      kicker: "Le défi",
      title: "Apprendre les sciences n'est pas toujours facile",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "😟", title: "Pas d'aide à la maison", body: "Les parents ne peuvent pas toujours expliquer les maths ou la physique." },
            { icon: "⏳", title: "Classes surchargées", body: "Difficile de poser ses questions et d'avancer à son rythme." },
            { icon: "📚", title: "Réviser seul", body: "Sans repères, on ne sait pas si on est vraiment prêt pour l'examen." },
          ],
        },
      ],
      notes:
        "Vous le savez mieux que moi : accompagner un enfant n'est pas toujours simple. À la maison, on ne peut pas toujours l'aider en maths ou en physique. En classe, les effectifs sont chargés et il n'ose pas toujours poser ses questions. Et quand il révise seul, il ne sait pas s'il est vraiment prêt. C'est exactement ce que nous venons résoudre.",
    },
    {
      kind: "content",
      kicker: "La solution",
      title: "Une nouvelle façon d'apprendre",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🎬", title: "Des vidéos claires", body: "Chaque leçon explique une seule idée, simplement et en images." },
            { icon: "🤖", title: "Un tuteur toujours là", body: "Il répond à tes questions et te donne des indices, jour et nuit." },
            { icon: "📝", title: "Des quiz qui corrigent", body: "Tu sais tout de suite si tu as compris, et pourquoi." },
            { icon: "🎓", title: "Des certificats", body: "Valide tes acquis et garde une preuve de ta réussite." },
          ],
        },
      ],
      notes:
        "Togo Academy, c'est une nouvelle façon d'apprendre. Des vidéos claires qui expliquent une seule idée à la fois. Un tuteur intelligent, disponible jour et nuit, qui répond aux questions de votre enfant. Des quiz qui corrigent tout de suite. Et des certificats pour valider ce qu'il a appris.",
    },
    {
      kind: "content",
      kicker: "En 3 étapes",
      title: "Comment ça marche",
      blocks: [
        {
          type: "steps",
          items: [
            { n: "1", title: "S'inscrire", body: "Crée ton compte en une minute. Des leçons sont gratuites, sans carte bancaire." },
            { n: "2", title: "Apprendre", body: "Regarde, réponds aux quiz, pose tes questions au tuteur IA, télécharge tes fiches." },
            { n: "3", title: "Réussir", body: "Passe les évaluations et les examens, obtiens ton certificat." },
          ],
        },
      ],
      notes:
        "Et c'est très simple à utiliser. En trois étapes : on crée un compte en une minute, on apprend en regardant les vidéos et en s'entraînant, puis on passe les examens et on obtient son certificat. Et rassurez-vous : plusieurs leçons sont gratuites, sans carte bancaire.",
    },
    {
      kind: "content",
      kicker: "Les matières",
      title: "Toutes tes matières, au même endroit",
      blocks: [
        {
          type: "tiles",
          items: [
            { icon: "➗", label: "Mathématiques" },
            { icon: "⚛️", label: "Physique" },
            { icon: "🧪", label: "Chimie" },
            { icon: "🔬", label: "Sciences physiques" },
            { icon: "🌱", label: "SVT" },
            { icon: "⚙️", label: "Technologie" },
            { icon: "🇬🇧", label: "Anglais" },
          ],
        },
      ],
      notes:
        "Toutes les matières de votre enfant sont réunies au même endroit : les mathématiques, la physique, la chimie, les sciences physiques, la SVT, la technologie et l'anglais. Sept matières, une seule plateforme.",
    },
    {
      kind: "content",
      kicker: "Ton compagnon d'étude",
      title: "Un tuteur rien que pour toi",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "💬", title: "Il répond à tes questions", body: "Pose ta question à tout moment, comme à un professeur patient." },
            { icon: "🧭", title: "Il te guide, sans tricher", body: "Il donne des indices pour t'aider à trouver la réponse toi-même." },
            { icon: "🌙", title: "Disponible jour et nuit", body: "À la maison, dans le transport ou tard le soir, il est toujours là." },
          ],
        },
      ],
      notes:
        "Le cœur de la plateforme, c'est le tuteur intelligent. Votre enfant peut lui poser une question à tout moment, comme à un professeur patient. Il ne donne jamais la réponse toute faite : il guide, il donne des indices, pour que l'enfant trouve par lui-même. Et il est là jour et nuit. Il ne remplace pas l'enseignant : il le prolonge à la maison.",
    },
    {
      kind: "content",
      kicker: "Ce que tu gagnes",
      title: "Apprends à ton rythme",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🔁", title: "Revois autant que tu veux", body: "Mets sur pause, recommence la vidéo, jusqu'à ce que ce soit clair." },
            { icon: "📈", title: "Suis tes progrès", body: "Vois tes leçons terminées et tes scores monter, semaine après semaine." },
            { icon: "🏁", title: "Entraîne-toi aux examens", body: "Des évaluations au vrai format, du CEPD au BAC, corrigées aussitôt." },
            { icon: "💪", title: "Gagne en confiance", body: "Comprendre vraiment, c'est arrêter de stresser et croire en soi." },
          ],
        },
      ],
      notes:
        "Concrètement, qu'est-ce que votre enfant y gagne ? Il peut revoir une leçon autant de fois qu'il le faut, à son rythme. Il suit ses progrès semaine après semaine. Il s'entraîne sur de vrais sujets d'examen, corrigés aussitôt. Et surtout, il reprend confiance en lui.",
    },
    {
      kind: "content",
      kicker: "Pour les familles",
      title: "Les parents gardent l'œil",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "👪", title: "Un compte parent", body: "Reliez vos enfants à votre compte et suivez leurs leçons, leurs scores et leur progression vers les certificats." },
            { icon: "💚", title: "Abordable et sûr", body: "Des leçons gratuites pour essayer, puis un abonnement à petit prix. Paiement par Flooz ou virement, sans engagement." },
          ],
        },
      ],
      notes:
        "Et vous, les parents, vous n'êtes pas laissés de côté. Avec un compte parent, vous suivez les leçons terminées, les scores aux quiz et la progression de votre enfant. Le tout à petit prix, payable simplement par Flooz ou par virement bancaire, sans engagement compliqué.",
    },
    {
      kind: "content",
      kicker: "Partout, tout le temps",
      title: "Tout tient dans ton téléphone",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "📱", title: "Pensé pour le mobile", body: "Léger et rapide, même quand la connexion est faible." },
            { icon: "📄", title: "Fiches à télécharger", body: "Garde tes résumés pour réviser, même hors ligne." },
            { icon: "💸", title: "Flooz ou virement", body: "Paiement mobile Flooz ou virement bancaire, sans carte requise." },
            { icon: "🇹🇬", title: "Programme togolais", body: "Un contenu fidèle à ce que tu apprends en classe." },
          ],
        },
      ],
      notes:
        "Tout cela tient dans un simple téléphone. La plateforme est légère et rapide, même quand la connexion est faible. Les fiches se téléchargent pour réviser hors ligne. Le paiement est local. Et le contenu suit fidèlement le programme togolais.",
    },
    {
      kind: "content",
      kicker: "Nos tarifs",
      title: "Un prix juste pour réussir",
      blocks: [
        {
          type: "pricing",
          items: [
            { label: "Pour essayer", price: "Gratuit", items: ["Leçons vidéo d'essai", "Quiz de découverte", "Sans carte bancaire"] },
            {
              label: "S'abonner",
              price: "Dès 1 000 F / sem",
              featured: true,
              items: [
                "1 matière — 1 000 FCFA / semaine",
                "Toute la classe — 3 000 FCFA / mois",
                "Trimestre, recommandé — 7 500 FCFA",
                "Toute la plateforme — 25 000 FCFA / an",
              ],
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "🎁 Primaire (CP1 à CM2) : 100% gratuit, sur la plateforme et sur notre chaîne YouTube.",
          ],
        },
      ],
      notes:
        "Parlons du prix, car nous l'avons voulu juste. On commence gratuitement, sans carte bancaire. Ensuite : dès mille francs par semaine pour une seule matière, trois mille francs par mois pour toute la classe, sept mille cinq cents francs par trimestre, notre formule recommandée, ou vingt-cinq mille francs par an pour toute la plateforme. Et je veux insister sur un point : tout le primaire, du CP1 au CM2, est entièrement gratuit, sur la plateforme comme sur notre chaîne YouTube.",
    },
    {
      kind: "content",
      kicker: "Questions fréquentes",
      title: "Vous vous demandez peut-être",
      blocks: [
        {
          type: "faq",
          items: [
            { q: "Peut-on essayer gratuitement ?", a: "Oui. Des leçons d'essai sont gratuites, sans carte bancaire." },
            { q: "Combien coûte l'abonnement ?", a: "Dès 1 000 FCFA/semaine pour une matière, ou 3 000 FCFA/mois pour toute la classe." },
            { q: "Comment payer ?", a: "Par Flooz ou par virement, depuis votre téléphone." },
            { q: "Faut-il un ordinateur ?", a: "Non. Un simple téléphone suffit pour tout suivre." },
            { q: "Est-ce le bon programme ?", a: "Oui, les leçons suivent le programme officiel togolais." },
            { q: "Puis-je suivre mon enfant ?", a: "Oui, le compte parent montre les leçons faites et les scores." },
          ],
        },
      ],
      notes:
        "Vous vous posez sûrement quelques questions. Peut-on essayer gratuitement ? Oui. Comment payer ? Par Flooz ou par virement. Faut-il un ordinateur ? Non, un simple téléphone suffit. Est-ce le bon programme ? Oui, celui du Togo. Je réponds volontiers à toutes vos autres questions dans un instant.",
    },
    {
      kind: "closing",
      kicker: "Rejoins-nous",
      title: "Commence aujourd'hui, gratuitement.",
      body: "Des leçons d'essai sont gratuites, sans carte bancaire. Abonnement dès 1 000 FCFA par semaine.",
      contacts: ["academie.groupebm.net"],
      notes:
        "Alors n'attendez pas. Créez un compte dès aujourd'hui et laissez votre enfant essayer gratuitement. Offrons-lui les moyens de réussir, où qu'il soit. Merci à toutes et à tous.",
    },
  ],
};

const experts: Deck = {
  slug: "experts",
  name: "Experts & partenaires",
  audience: "Institutions, écoles, ONG, experts référents",
  file: "3-Togo-Academy-Experts-Partenaires.pptx",
  slides: [
    {
      kind: "cover",
      kicker: "Experts et partenaires institutionnels",
      title: "Un partenaire crédible pour l'éducation au Togo.",
      subtitle: "Rigueur pédagogique, technologie et impact, adossés à Groupe BM.",
      presenter: PRESENTER,
      notes:
        "Bonjour, et merci de votre temps. Je suis Niyem Bawana, fondateur de Togo Academy. Je m'adresse à vous en tant qu'experts référents et partenaires institutionnels. Mon objectif : vous montrer que Togo Academy est un partenaire crédible et sérieux pour l'éducation au Togo, et vous proposer de construire ensemble.",
    },
    {
      kind: "content",
      kicker: "Pourquoi nous existons",
      title: "Notre mission",
      blocks: [
        {
          type: "text",
          paragraphs: [
            "Réduire l'inégalité d'accès à un enseignement scientifique de qualité au Togo, en portant les mêmes leçons et le même accompagnement à chaque élève.",
            "Une entreprise éducative durable autant qu'un outil de démocratisation : les abonnements financent la production de contenu et son accessibilité.",
          ],
        },
        {
          type: "stats",
          items: [
            { big: "27", label: "classes couvertes" },
            { big: "267", label: "leçons publiées" },
            { big: "7", label: "matières enseignées" },
            { big: "APC", label: "programme officiel" },
          ],
        },
      ],
      notes:
        "Notre mission est claire : réduire l'inégalité d'accès à un enseignement scientifique de qualité, en portant les mêmes leçons et le même accompagnement à chaque élève. Nous sommes à la fois une entreprise éducative durable et un outil de démocratisation. Et ce n'est pas théorique : vingt-sept classes, deux cent soixante-sept leçons, sept matières, tout en approche par compétences.",
    },
    {
      kind: "content",
      kicker: "Rigueur",
      title: "Une exigence pédagogique réelle",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "📘", title: "Programme officiel", body: "Chapitres, capacités et contenus fidèles au programme togolais, matière par matière." },
            { icon: "📝", title: "Examens officiels", body: "Du CEPD au BAC : situations problèmes notées sur la grille officielle (pertinence, correction, cohérence)." },
            { icon: "✅", title: "Seuils et certificats", body: "Évaluations à 70%, examens à 80%, certificats vérifiables en ligne." },
          ],
        },
      ],
      notes:
        "Notre première exigence, c'est la rigueur pédagogique. Nos contenus suivent fidèlement le programme togolais, matière par matière. Nos examens reprennent le format des épreuves officielles, du CEPD au BAC, notées sur la grille officielle. Et la progression est jalonnée de seuils et de certificats vérifiables.",
    },
    {
      kind: "content",
      kicker: "Notre méthode",
      title: "L'approche par compétences, appliquée",
      blocks: [
        {
          type: "steps",
          items: [
            { n: "01", title: "Un concept à la fois", body: "Chaque leçon isole une capacité précise du référentiel." },
            { n: "02", title: "Mise en situation", body: "Des situations problèmes ancrent la compétence dans un contexte réel." },
            { n: "03", title: "Évaluation sur grille", body: "Notation selon les critères officiels de pertinence et de cohérence." },
            { n: "04", title: "Progression mesurée", body: "Chaque acquis validé rapproche l'élève du certificat." },
          ],
        },
      ],
      notes:
        "Notre méthode, c'est l'approche par compétences, appliquée pas à pas. Un concept isolé à la fois. Une mise en situation qui ancre la compétence dans un contexte réel. Une évaluation sur grille, selon les critères officiels. Et une progression mesurée, où chaque acquis validé rapproche l'élève de son certificat.",
    },
    {
      kind: "content",
      kicker: "La technologie",
      title: "Une plateforme complète",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🎬", title: "Leçons vidéo APC", body: "Un concept à la fois, clair et visuel." },
            { icon: "🤖", title: "Tuteur IA", body: "Socratique, présent dans chaque leçon." },
            { icon: "📊", title: "Suivi de progression", body: "Visible par les parents et les élèves, jusqu'aux certificats." },
            { icon: "📶", title: "Mobile et faible débit", body: "Adapté aux conditions réelles du terrain togolais." },
          ],
        },
      ],
      notes:
        "La plateforme met tout cela en musique : des leçons vidéo, un tuteur intelligent dans chaque leçon, un suivi de progression visible par les élèves et les parents, le tout accessible sur mobile et à faible débit. La technologie est au service de la pédagogie, jamais l'inverse.",
    },
    {
      kind: "content",
      kicker: "Notre impact",
      title: "Un impact durable et mesurable",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "⚖️", title: "Équité d'accès", body: "Les mêmes leçons et le même accompagnement pour chaque élève, quelle que soit sa ville." },
            { icon: "♻️", title: "Modèle durable", body: "Les abonnements financent la production de contenu et son accessibilité au plus grand nombre." },
            { icon: "📈", title: "Qualité à grande échelle", body: "La technologie porte une exigence pédagogique constante à des milliers d'élèves." },
          ],
        },
      ],
      notes:
        "Notre impact se mesure sur trois plans. L'équité, d'abord : les mêmes leçons pour chaque élève, quelle que soit sa ville. La durabilité : les abonnements financent la production et son accessibilité. Et l'échelle : la technologie porte une exigence constante à des milliers d'élèves à la fois.",
    },
    {
      kind: "content",
      kicker: "Adossé à un groupe",
      title: "La force du Groupe BM",
      blocks: [
        {
          type: "text",
          paragraphs: [
            "Bâtir et moderniser. Togo Academy est un département de Groupe BM et s'appuie sur les ressources, la crédibilité et le réseau d'un groupe qui connecte les talents à l'excellence mondiale.",
          ],
        },
        {
          type: "tiles",
          items: [
            { icon: "🎓", label: "Éducation" },
            { icon: "🌍", label: "Immigration" },
            { icon: "💼", label: "Services professionnels" },
            { icon: "🛠️", label: "Ingénierie et recherche" },
          ],
        },
      ],
      notes:
        "Togo Academy s'appuie sur un socle solide : nous sommes un département de Groupe BM, dont la devise est bâtir et moderniser. Nous bénéficions de ses ressources, de sa crédibilité et de son réseau, dans l'éducation, l'immigration, les services professionnels et l'ingénierie.",
    },
    {
      kind: "content",
      kicker: "Opportunités",
      title: "Collaborons",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🧭", title: "Comité scientifique", body: "Cautionner la qualité et apporter votre regard d'expert de référence." },
            { icon: "🏫", title: "Partenariats institutionnels", body: "Écoles, ONG et programmes éducatifs : déploiement à grande échelle." },
            { icon: "🌍", title: "Expansion régionale", body: "Adapter la plateforme à d'autres pays francophones." },
            { icon: "🔗", title: "Écosystème Groupe BM", body: "Éducation, immigration, services professionnels, ingénierie et recherche." },
          ],
        },
      ],
      notes:
        "Alors, comment collaborer ? Plusieurs portes s'ouvrent : le conseil pédagogique pour valider et enrichir nos contenus ; les partenariats institutionnels avec les écoles et les ONG ; l'expansion régionale vers d'autres pays francophones ; et l'accès à l'écosystème Groupe BM.",
    },
    {
      kind: "content",
      kicker: "Une relation équilibrée",
      title: "Une collaboration gagnant-gagnant",
      blocks: [
        {
          type: "twocol",
          left: {
            title: "Votre expertise renforce notre rigueur",
            items: [
              "Relecture et validation des contenus par matière",
              "Alignement fin sur les référentiels officiels",
              "Accès à un réseau institutionnel et éducatif",
            ],
          },
          right: {
            title: "Notre plateforme amplifie votre impact",
            items: [
              "Une portée directe auprès des élèves togolais",
              "Un canal numérique mesurable et traçable",
              "Une vitrine pour votre mission éducative",
            ],
          },
        },
      ],
      notes:
        "Je veux insister sur l'équilibre de cette relation. Votre expertise renforce notre rigueur : vous relisez, vous validez, vous nous alignez sur les référentiels. Et en retour, notre plateforme amplifie votre impact : une portée directe auprès des élèves, un canal mesurable, et une vitrine pour votre mission.",
    },
    {
      kind: "content",
      kicker: "Vision régionale",
      title: "Du Togo à l'Afrique francophone",
      blocks: [
        {
          type: "steps",
          items: [
            { n: "1", title: "Consolider le Togo", body: "Compléter les contenus et asseoir la qualité sur tout le programme national." },
            { n: "2", title: "Densifier l'offre", body: "Tutorat, kits d'examen et partenariats institutionnels pour élargir l'impact." },
            { n: "3", title: "Répliquer la recette", body: "Adapter la plateforme aux pays voisins partageant le programme francophone." },
          ],
        },
      ],
      notes:
        "Notre vision dépasse le Togo. D'abord consolider la qualité sur tout le programme national. Ensuite densifier l'offre, avec le tutorat, les kits d'examen et les partenariats. Enfin répliquer la recette dans les pays voisins qui partagent le programme francophone.",
    },
    {
      kind: "content",
      kicker: "Pourquoi nous",
      title: "Un partenaire sur qui compter",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🇹🇬", title: "Programme togolais", body: "Un contenu fidèle à l'APC officielle, pas importé." },
            { icon: "🤖", title: "IA pédagogique", body: "Tuteur et correction par IA, à grande échelle." },
            { icon: "📲", title: "Déjà en ligne", body: "Une plateforme vivante, mobile et faible débit." },
            { icon: "🔗", title: "Appui Groupe BM", body: "Ressources, crédibilité et réseau d'un groupe établi." },
          ],
        },
      ],
      notes:
        "Pourquoi nous faire confiance ? Parce que notre contenu est fidèle au programme togolais, pas importé. Parce que notre pédagogie est portée par l'intelligence artificielle, à grande échelle. Parce que la plateforme est déjà en ligne et vivante. Et parce que nous avons derrière nous l'appui de Groupe BM.",
    },
    {
      kind: "closing",
      kicker: "Prendre contact",
      title: "Construisons ensemble la relève de demain.",
      body: "Nous cherchons des experts référents et des partenaires institutionnels. Votre expertise renforce notre rigueur ; notre plateforme amplifie votre impact.",
      contacts: ["info@groupebm.net", "academie.groupebm.net"],
      notes:
        "Construisons ensemble la relève de demain. Nous cherchons des experts, des consultants et des partenaires institutionnels comme vous. Votre expertise renforce notre rigueur ; notre plateforme amplifie votre impact. Écrivez-nous à info arobase groupebm point net. Merci.",
    },
  ],
};

const collaborateurs: Deck = {
  slug: "collaborateurs",
  name: "Collaborateurs",
  audience: "Tuteurs, consultants pédagogiques, ingénieurs, créateurs",
  file: "4-Togo-Academy-Collaborateurs.pptx",
  slides: [
    {
      kind: "cover",
      kicker: "Tuteurs · Consultants · Ingénieurs",
      title: "Rejoignez l'aventure Togo Academy.",
      subtitle: "Nous construisons la référence STIM de l'éducation en ligne au Togo.",
      presenter: PRESENTER,
      notes:
        "Bonjour, et merci d'être là. Je suis Niyem Bawana, fondateur de Togo Academy. Si vous êtes ici, c'est que vous avez envie de mettre votre talent au service d'un projet qui compte. Laissez-moi vous raconter l'aventure que nous construisons, et la place qui vous y attend.",
    },
    {
      kind: "content",
      kicker: "Pourquoi nous",
      title: "Notre mission",
      blocks: [
        {
          type: "text",
          paragraphs: [
            "Donner à chaque élève togolais, où qu'il soit, les mêmes leçons de qualité et le même accompagnement.",
            "Nous réunissons des enseignants, des pédagogues et des ingénieurs autour d'un objectif commun : démocratiser l'éducation STIM et ouvrir les portes de l'avenir.",
          ],
        },
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🌍", title: "Un impact réel", body: "Des milliers d'élèves à servir." },
            { icon: "🚀", title: "Une plateforme qui grandit", body: "Du Togo à l'Afrique francophone." },
          ],
        },
      ],
      notes:
        "Notre mission, c'est de donner à chaque élève togolais, où qu'il soit, les mêmes leçons de qualité et le même accompagnement. Pour y arriver, nous réunissons des enseignants, des pédagogues et des ingénieurs autour d'un même objectif : démocratiser l'éducation scientifique et ouvrir les portes de l'avenir.",
    },
    {
      kind: "content",
      kicker: "La plateforme",
      title: "Ce que nous construisons",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "🎬", title: "Contenu STIM", body: "Vidéos APC, cours, quiz et examens aux formats officiels (CEPD, BEPC, BAC)." },
            { icon: "🤖", title: "IA pédagogique", body: "Tuteur socratique et correction d'examens par IA." },
            { icon: "⚙️", title: "Plateforme moderne", body: "Rapide, fiable et pensée d'abord pour le mobile." },
          ],
        },
      ],
      notes:
        "Ce que nous construisons, c'est une plateforme complète. Du contenu scientifique en vidéo et en cours écrits. Une pédagogie augmentée par l'intelligence artificielle, avec un tuteur et une correction automatique des examens. Et une plateforme moderne, rapide et fiable, pensée d'abord pour le mobile.",
    },
    {
      kind: "content",
      kicker: "Notre stack",
      title: "Des outils modernes, un vrai terrain de jeu",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "⚡", title: "Interface rapide", body: "Une expérience fluide et moderne sur toute la plateforme." },
            { icon: "🗄️", title: "Données sécurisées", body: "Comptes, authentification et suivi en temps réel." },
            { icon: "🧠", title: "Intelligence artificielle", body: "Tutorat et correction d'examens à grande échelle." },
            { icon: "📱", title: "Mobile-first", body: "Pensé pour les connexions réelles du Togo." },
            { icon: "🔄", title: "Déploiement continu", body: "On livre vite, on itère souvent." },
            { icon: "🎯", title: "Un vrai impact produit", body: "Ce que vous construisez sert de vrais élèves." },
          ],
        },
      ],
      notes:
        "Côté technique, c'est un vrai terrain de jeu. Une interface rapide et fluide. Des données sécurisées. De l'intelligence artificielle à grande échelle. Une conception pensée pour le mobile, une livraison continue, et surtout un impact réel : ce que vous construisez sert de vrais élèves, tout de suite.",
    },
    {
      kind: "content",
      kicker: "Rejoignez-nous",
      title: "Les profils que nous cherchons",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "👨🏾‍🏫", title: "Tuteurs", body: "Enseignants togolais pour les séances en direct et la validation des contenus." },
            { icon: "🧭", title: "Consultants pédagogiques", body: "Experts par matière pour concevoir et relire les cours en APC." },
            { icon: "💻", title: "Ingénieurs développeurs", body: "Web, IA et data : construire et faire évoluer la plateforme." },
            { icon: "🎨", title: "Créateurs de contenu", body: "Scénarisation, voix et montage des leçons vidéo." },
          ],
        },
      ],
      notes:
        "Quels profils cherchons-nous ? Des tuteurs, enseignants togolais, pour les séances en direct et la validation des contenus. Des consultants pédagogiques, experts par matière. Des ingénieurs développeurs, en web, en intelligence artificielle et en données. Et des créateurs de contenu, pour scénariser et monter nos leçons.",
    },
    {
      kind: "content",
      kicker: "Notre façon de travailler",
      title: "Souple, à distance, en équipe",
      blocks: [
        {
          type: "cards",
          cols: 3,
          items: [
            { icon: "🏠", title: "À distance", body: "Contribuez d'où vous êtes, avec des outils simples et efficaces." },
            { icon: "🔀", title: "À la mission ou en continu", body: "Une collaboration ponctuelle ou un engagement régulier, selon votre disponibilité." },
            { icon: "🤝", title: "En équipe pluridisciplinaire", body: "Pédagogues et ingénieurs avancent ensemble, sur un même objectif." },
          ],
        },
      ],
      notes:
        "Comment travaillons-nous ? À distance, d'où que vous soyez. À la mission ou en continu, selon votre disponibilité. Et toujours en équipe pluridisciplinaire, où pédagogues et ingénieurs avancent côte à côte vers le même objectif.",
    },
    {
      kind: "content",
      kicker: "Ce qu'on offre",
      title: "Pourquoi nous rejoindre",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "💚", title: "Un travail qui a du sens", body: "Servir l'éducation de votre pays." },
            { icon: "📈", title: "De la croissance", body: "Grandir avec une plateforme en expansion." },
            { icon: "🕊️", title: "De la flexibilité", body: "À distance, à la mission ou en continu." },
            { icon: "🔗", title: "Écosystème Groupe BM", body: "Éducation, immigration, services, ingénierie, recherche." },
          ],
        },
      ],
      notes:
        "Pourquoi nous rejoindre ? Pour un travail qui a du sens, au service de l'éducation de votre pays. Pour grandir avec une plateforme en pleine expansion. Pour la flexibilité, à distance et à votre rythme. Et pour l'écosystème Groupe BM qui vous entoure.",
    },
    {
      kind: "content",
      kicker: "Nos valeurs",
      title: "Ce qui nous rassemble",
      blocks: [
        {
          type: "cards",
          cols: 2,
          items: [
            { icon: "🎯", title: "L'impact d'abord", body: "Chaque décision se juge à ce qu'elle apporte aux élèves." },
            { icon: "📐", title: "L'exigence pédagogique", body: "Fidélité au programme et qualité, sans compromis." },
            { icon: "🤝", title: "L'entraide entre métiers", body: "Pédagogie et technologie se renforcent l'une l'autre." },
            { icon: "🔍", title: "La curiosité", body: "On apprend en continu, comme les élèves que nous servons." },
          ],
        },
      ],
      notes:
        "Ce qui nous rassemble, ce sont nos valeurs. L'impact d'abord : chaque décision se juge à ce qu'elle apporte aux élèves. L'exigence pédagogique, sans compromis sur la qualité. L'entraide entre métiers. Et la curiosité : nous apprenons en continu, comme les élèves que nous servons.",
    },
    {
      kind: "content",
      kicker: "Adossé à un groupe",
      title: "La force du Groupe BM",
      blocks: [
        {
          type: "text",
          paragraphs: [
            "Bâtir et moderniser. Rejoindre Togo Academy, c'est aussi entrer dans un groupe déjà établi sur plusieurs métiers, avec des ressources et un réseau réels.",
          ],
        },
        {
          type: "tiles",
          items: [
            { icon: "🎓", label: "Éducation" },
            { icon: "🌍", label: "Immigration" },
            { icon: "💼", label: "Services" },
            { icon: "🛠️", label: "Ingénierie et recherche" },
          ],
        },
      ],
      notes:
        "Nous rejoindre, c'est aussi entrer dans un groupe déjà établi. Togo Academy est un département de Groupe BM, présent dans l'éducation, l'immigration, les services et l'ingénierie. Vous bénéficiez de ses ressources et de son réseau.",
    },
    {
      kind: "content",
      kicker: "Notre vision",
      title: "Grandissez avec la plateforme",
      blocks: [
        {
          type: "steps",
          items: [
            { n: "1", title: "Consolider le Togo", body: "Compléter les contenus et servir de plus en plus d'élèves au pays." },
            { n: "2", title: "Grandir en équipe", body: "Densifier l'équipe et l'offre, faire évoluer chacun avec le projet." },
            { n: "3", title: "Rayonner en Afrique", body: "Étendre la plateforme aux pays voisins francophones." },
          ],
        },
      ],
      notes:
        "Et vous grandirez avec la plateforme. D'abord consolider le Togo et servir de plus en plus d'élèves. Ensuite grandir en équipe, en faisant évoluer chacun avec le projet. Enfin rayonner dans toute l'Afrique francophone.",
    },
    {
      kind: "content",
      kicker: "Comment nous rejoindre",
      title: "Trois étapes, simplement",
      blocks: [
        {
          type: "steps",
          items: [
            { n: "1", title: "Écrivez-nous", body: "Présentez-vous via academie.groupebm.net/contact ou à info@groupebm.net." },
            { n: "2", title: "Échangeons", body: "Un échange pour comprendre votre profil, vos envies et vos disponibilités." },
            { n: "3", title: "Démarrons", body: "Une première mission ou collaboration pour bâtir ensemble." },
          ],
        },
      ],
      notes:
        "Nous rejoindre est très simple, en trois étapes. Écrivez-nous et présentez-vous. Échangeons pour comprendre votre profil et vos envies. Puis démarrons ensemble par une première mission. Vous pouvez nous joindre à info arobase groupebm point net.",
    },
    {
      kind: "closing",
      kicker: "Postuler, nous écrire",
      title: "Bâtissons l'avenir de l'éducation togolaise.",
      body: "Tuteurs, pédagogues, ingénieurs, créateurs : il y a une place pour vous. Rejoignez une équipe qui change des vies, une leçon à la fois.",
      contacts: ["info@groupebm.net", "academie.groupebm.net"],
      notes:
        "Bâtissons ensemble l'avenir de l'éducation togolaise. Que vous soyez tuteur, pédagogue, ingénieur ou créateur, il y a une place pour vous. Rejoignez une équipe qui change des vies, une leçon à la fois. Merci.",
    },
  ],
};

export const DECKS: Deck[] = [investisseurs, parents, experts, collaborateurs];

export function getDeck(slug: string): Deck | undefined {
  return DECKS.find((d) => d.slug === slug);
}
