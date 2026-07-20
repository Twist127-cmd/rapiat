# Prompt — « Rapiat », application de gestion bancaire personnelle

> À copier-coller tel quel dans un agent de développement (Claude Code, Cursor, etc.).
> Le prompt est volontairement exhaustif : architecture, fonctionnalités, écrans,
> modèle de données, thèmes visuels, mise sous Git/GitHub et critères de qualité.

**Nom du produit : Rapiat.** Clin d'œil assumé (« près de ses sous ») mais élégant et savoureux.
Le nom s'affiche dans l'app (logo/titre), le manifest PWA et le README. Ton de marque :
malicieux et bienveillant, jamais culpabilisant.

### Logo officiel (fourni — ne pas en générer un autre)

Le logo de l'application est **déjà fourni** dans le dépôt : `rapiat-proposition-1.png`
(tirelire 3D au visage malicieux, groin en porte de coffre-fort doré, sur fond bleu
marine cerclé d'or). **Utilise ce fichier tel quel** comme logo et base de l'icône
d'application — n'en dessine ni n'en génère aucun autre.

- Place le fichier dans `public/` (ex. `public/logo.png`) et génère à partir de lui
  les déclinaisons nécessaires : favicon, `apple-touch-icon`, icônes PWA **192×192**
  et **512×512** (via un script type `scripts/gen-icons.mjs` + `sharp`, comme dans
  esthetique-app). Référence-les dans `src/app/manifest.ts` et les métadonnées.
- **Palette de marque dérivée du logo**, à utiliser pour le thème « Classique » :
  **bleu marine profond** (fond/`primary` sombre), **or** (accent/`--chart`), **rose
  blush** (secondaire/touches douces), sur base crème claire. Décline en clair/sombre.
- Affiche le logo dans l'écran de connexion, l'en-tête/sidebar et le splash PWA.

---

## Rôle & mission

Tu es un ingénieur logiciel senior. Construis **Rapiat**, une **application de gestion des finances personnelles** de qualité professionnelle, simple et agréable à utiliser, qui permet de suivre : **revenus, dépenses fixes, dépenses variables, épargne et budgets**. L'application doit être **entièrement responsive** (utilisable aussi bien sur téléphone que sur PC) et proposer **deux thèmes visuels commutables** (voir section « Thèmes »).

Le niveau attendu est celui d'un produit fini : code typé strictement, testé, sécurisé, documenté, **versionné sur GitHub** et déployable.

---

## Pile technique imposée

Reprends **exactement** la même stack et les mêmes conventions que mon application existante `esthetique-app` (monolithe modulaire Next.js). Ne dévie pas de cette pile :

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict**
- **PostgreSQL** (hébergé sur **Neon**, driver serverless via `@prisma/adapter-neon`, connexion HTTPS port 443) · **Prisma 7** (driver adapters ; client généré dans `src/generated/prisma`, git-ignoré ; connexion runtime via adapter, migrations via `prisma.config.ts`)
- **Auth.js v5** (next-auth 5 beta) — provider **Credentials**, sessions **JWT**, mots de passe **bcrypt**
- **Zod 4** pour toute validation d'entrée (server actions + config au démarrage)
- **Tailwind CSS 4** + **shadcn/ui** (base Radix / base-ui) + `lucide-react` + `sonner` (toasts) + `next-themes` (bascule de thème)
- **react-hook-form** + `@hookform/resolvers` pour les formulaires
- **date-fns** + `@date-fns/tz` pour les dates/fuseaux
- **exceljs** + **@react-pdf/renderer** pour les exports Excel & PDF
- Un moteur de **graphiques** (recharts ou équivalent compatible React 19) pour les visualisations
- **Vitest** + Testing Library (unitaire) · **Playwright** (e2e) · **ESLint** + **Prettier**
- **PWA** installable (manifest + service worker, écran hors-ligne)
- Gestionnaire de paquets **pnpm** · déploiement **Vercel** (push git → build auto)

### Règles techniques non négociables (issues de mon écosystème)

1. **Montants en centimes entiers** (`Int`) partout, jamais de float. Formatage centralisé via un helper `formatMoney(cents, currency)`. Devise configurable par utilisateur (CHF/EUR/USD/GBP), défaut **CHF**.
2. **Dates & fuseaux** : dates stockées en instants UTC, converties en heure « murale » via des helpers dédiés (`src/lib/dates.ts`). Fuseau par défaut `Europe/Zurich`.
3. **Config validée au démarrage** (`src/lib/env.ts`) : l'app refuse de démarrer si un secret est manquant.
4. Le **client Prisma généré** et les fichiers `.env` sont **git-ignorés**.

---

## Architecture imposée (calquée sur esthetique-app)

Découpage strict en couches, organisation **par modules métier**. Chaque module expose son API **uniquement via son `index.ts`** (barrel). Flux de dépendances : `components → actions → services → domain + data-access`. Le dossier `domain/` est **pur** (aucune dépendance framework ni DB) et testé unitairement. Un composant **n'appelle jamais Prisma directement**.

```
src/
├─ app/
│  ├─ (auth)/login              # écran de connexion + inscription
│  ├─ (dashboard)/              # app protégée (voir "Écrans")
│  │   ├─ page.tsx              #   tableau de bord
│  │   ├─ comptes/              #   comptes bancaires
│  │   ├─ transactions/         #   toutes les transactions
│  │   ├─ depenses-fixes/       #   dépenses récurrentes
│  │   ├─ budgets/              #   budgets par catégorie
│  │   ├─ epargne/              #   objectifs & suivi d'épargne
│  │   ├─ rapports/             #   analyses, graphiques, exports
│  │   └─ parametres/           #   profil, devise, catégories, thème
│  └─ api/                      # auth [...nextauth], exports (pdf/excel)
├─ modules/                     # cœur métier — un dossier par domaine
│  ├─ auth/  accounts/  transactions/  recurring/  budgets/
│  │  savings/  categories/  reports/  settings/
│  │   ├─ domain/               # règles pures + tests
│  │   ├─ services/             # cas d'usage (DB scellée par utilisateur)
│  │   ├─ actions/              # Server Actions (entrée validée Zod)
│  │   ├─ components/           # UI du module
│  │   └─ __tests__/
├─ server/
│  ├─ auth.ts / auth.config.ts / session.ts
│  ├─ guards.ts                 # requireSession / requireUser
│  ├─ user-db.ts                # extension Prisma scellée par userId
│  ├─ data-access.ts            # getUserContext() → {user, currency, db}
│  └─ audit.ts                  # journal d'activité (best-effort)
├─ lib/                         # env, db, money, dates(+tz), utils, errors
├─ components/                  # ui/ (shadcn), app-nav, theme-switcher
└─ config/                      # constants, navigation
```

### Sécurité (pare-feux en couches)

1. **Route** : middleware + `authorized` d'Auth.js → redirige vers `/login` sans session.
2. **Session** : `requireSession()` avant toute logique métier.
3. **Isolation par utilisateur** : une extension Prisma injecte le `userId` de la session dans **chaque** requête ; aucun accès aux données d'un autre utilisateur (renvoie `null`/404). C'est l'équivalent, pour un usage perso, du multi-tenant de esthetique-app.
4. **Validation Zod** sur toutes les entrées ; cookies httpOnly/secure ; en-têtes CSP/HSTS ; journalisation des actions sensibles ; anti-énumération à la connexion.

---

## Fonctionnalités (inspirées des meilleures apps payantes)

Inspire-toi fortement des applications de référence — **YNAB, Copilot Money, Bankin', Linxo, Money Manager, Monarch, Emma** — pour définir un jeu de fonctionnalités riche mais **simple d'usage**. Implémente au minimum :

### 1. Comptes
- Plusieurs comptes (courant, épargne, espèces, carte de crédit…), chacun avec solde, devise, couleur/icône.
- Solde global consolidé + solde par compte, mis à jour à chaque transaction.
- Transferts entre comptes (ne comptent ni comme revenu ni comme dépense).

### 2. Transactions
- Saisie rapide : montant, date, catégorie, compte, note, tags, pièce jointe optionnelle.
- Types : **revenu**, **dépense**, **transfert**.
- Distinction claire **dépense fixe** (récurrente) vs **dépense variable** (ponctuelle).
- Liste filtrable/triable (par période, catégorie, compte, montant, texte) avec recherche instantanée.
- Édition en masse, duplication, suppression.
- Import CSV de relevés bancaires (mapping de colonnes) — bonus apprécié.

### 3. Dépenses fixes / récurrentes
- Modèles récurrents (loyer, abonnements, assurances, salaire…) : montant, fréquence (hebdo/mensuel/annuel/personnalisée), prochaine échéance.
- Génération automatique des transactions à échéance + rappel à venir.
- Vue « charges mensuelles » : total des engagements fixes, reste à vivre calculé (revenus − fixes).

### 4. Budgets (par catégorie)
- Budget mensuel par catégorie, avec suivi consommé / restant et barre de progression.
- Alerte visuelle en cas de dépassement (proche / atteint / dépassé).
- Report ou remise à zéro en début de période (au choix).
- Vue d'ensemble « budget du mois » type enveloppes.

### 5. Épargne & objectifs
- Objectifs d'épargne (nom, montant cible, échéance, montant actuel, progression %).
- Suivi de l'épargne dans le temps, contributions manuelles ou automatiques (règle « X par mois »).
- Taux d'épargne (épargne / revenus) affiché sur le tableau de bord.

### 6. Catégories & tags
- Catégories hiérarchiques (parent > sous-catégorie) avec icône + couleur, séparées revenus / dépenses.
- Jeu par défaut fourni (logement, alimentation, transport, loisirs, santé, abonnements, salaire, etc.), entièrement personnalisable.
- Tags libres transverses.

### 7. Tableau de bord (accueil)
- Synthèse du mois : revenus, dépenses (fixes vs variables), solde net, taux d'épargne.
- Graphiques : évolution du solde, répartition des dépenses par catégorie (donut), tendance revenus/dépenses (barres), avancement des budgets et objectifs.
- Prochaines échéances récurrentes, dernières transactions.

### 8. Rapports & exports
- Analyses par jour / mois / année, filtres par catégorie et compte.
- Comparaison entre périodes (ce mois vs mois précédent).
- **Export PDF** (rapport mis en page via @react-pdf/renderer) et **Export Excel** (via exceljs).

### 9. Paramètres
- Profil, mot de passe, devise, fuseau, format de date.
- Gestion des catégories et comptes.
- **Sélecteur de thème** (Classique / Mode Marie) + clair/sombre.
- Export/suppression de toutes ses données (RGPD-friendly).

---

## Thèmes visuels (exigence clé)

Deux thèmes commutables via `next-themes`, appliqués par **variables CSS** dans `globals.css` (approche OKLCH + `@theme inline`, exactement comme esthetique-app — chaque thème redéfinit `--background`, `--foreground`, `--primary`, `--card`, `--radius`, `--font-*`, `--chart-*`, etc.). Un sélecteur dans la barre de navigation permet de basculer instantanément, sans rechargement, et le choix est persisté. Chaque thème doit aussi avoir sa déclinaison **clair/sombre**.

### Thème 1 — « Classique » (par défaut)
Sobre, moderne, épuré et agréable. Typographie nette (sans-serif pour le corps, éventuel serif élégant pour les titres). Palette calme et professionnelle, beaucoup d'espace blanc, coins arrondis doux, ombres discrètes, animations subtiles. C'est le thème de référence pour la lisibilité des chiffres et graphiques.

### Thème 2 — « Mode Marie » (format vacances, kitsch assumé)
Bascule l'app en ambiance **plage / vacances** : palette turquoise/corail/sable/jaune soleil, dégradés ensoleillés, typographie plus fun et ronde, coins très arrondis. Éléments décoratifs **kitsch** intégrés avec goût (SVG/emoji stylisés) : **palmiers, poissons, baleine, sable, coquillages, soleil, vagues, cocktails**. Idées : bandeau de vagues animées, petits poissons flottants en fond, une baleine qui « nage » discrètement, motif de sable, boutons façon bouée. Le tout doit rester **utilisable** : la hiérarchie de l'information et la lisibilité des montants sont préservées ; le kitsch est décoratif, jamais gênant. Performances soignées (animations CSS légères, `prefers-reduced-motion` respecté).

> Contrainte : les deux thèmes partagent **exactement les mêmes composants et le même layout** — seules les variables CSS, les éléments décoratifs et quelques accents changent. Aucune duplication de logique.

---

## Modèle de données (Prisma — point de départ)

Adapte/complète, mais respecte l'esprit (centimes entiers, scellé par `userId`) :

- **User** : id, email, passwordHash, name, currency, timezone, dateFormat, themePreference, createdAt.
- **Account** : id, userId, name, type (CHECKING/SAVINGS/CASH/CREDIT), balanceCents, currency, color, icon, archived.
- **Category** : id, userId, name, kind (INCOME/EXPENSE), parentId?, color, icon, isDefault.
- **Transaction** : id, userId, accountId, categoryId?, type (INCOME/EXPENSE/TRANSFER), amountCents, date (UTC), note, tags[], expenseKind (FIXED/VARIABLE)?, recurringRuleId?, transferAccountId?, createdAt.
- **RecurringRule** : id, userId, accountId, categoryId?, type, amountCents, frequency (WEEKLY/MONTHLY/YEARLY/CUSTOM), interval, nextRunDate, endDate?, label, active.
- **Budget** : id, userId, categoryId, periodType (MONTHLY…), amountCents, rollover (bool), startDate.
- **SavingsGoal** : id, userId, name, targetCents, currentCents, deadline?, accountId?, color.
- **AuditLog** : id, userId, action, meta (JSON), createdAt.

Fournis les **migrations** et un **seed idempotent** (catégories par défaut, 1 compte, quelques transactions de démo, 1 budget, 1 objectif d'épargne).

---

## Versionnement Git & création automatique du repo GitHub (exigence)

Dès l'initialisation du projet, mets-le **automatiquement** sous Git et pousse-le sur un **repo GitHub privé neuf**, sans intervention manuelle.

### Étapes attendues (à scripter / exécuter)

1. **`git init`** à la racine du projet + branche par défaut **`main`**.
2. **`.gitignore`** adapté à Next.js : `node_modules/`, `.next/`, `out/`, `.env*` (sauf `.env.example`), `src/generated/`, `coverage/`, `test-results/`, `playwright-report/`, `.vercel/`, `*.tsbuildinfo`, `.DS_Store`.
3. **Fichiers de dépôt** : `README.md` (document de reprise complet — voir plus bas), `LICENSE` (au choix, privé), `CHANGELOG.md` (format Keep a Changelog), `.env.example` documentant **toutes** les variables sans valeurs secrètes.
4. **Création du repo distant via GitHub CLI** :
   ```bash
   gh repo create <owner>/<nom-du-repo> --private --source=. --remote=origin --push
   ```
   - Détermine `<owner>` et l'authentification via `gh auth status` (l'utilisateur est déjà authentifié). Si `gh` n'est pas dispo, se rabattre sur l'API GitHub avec un token, sinon **demander** avant de continuer.
   - Nom du repo suggéré : `rapiat` (ou celui indiqué par l'utilisateur).
5. **Identité Git** : s'assurer que `git config user.name` / `user.email` sont renseignés avec un e-mail **valide reconnu par Vercel** (sinon le build Vercel échoue).
6. **Premier commit** en Conventional Commits : `chore: initial scaffold (next 16 + prisma 7 + auth.js v5)` puis **push** sur `origin main`.
7. **Tag de version initiale** : `git tag -a v0.1.0 -m "Initial scaffold"` + `git push --tags`.
8. **Commits atomiques** ensuite, un par étape logique du déroulé (Conventional Commits : `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `build:`, `ci:`).

### CI & déploiement

- Ajouter un workflow **GitHub Actions** (`.github/workflows/ci.yml`) qui, sur push et PR : installe pnpm, lance `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Préparer le **déploiement Vercel** connecté au repo (push sur `main` → build auto). Documenter dans le README la récupération des variables d'env (`vercel env pull`) et l'application des migrations Neon via HTTPS.

> Ne **jamais** committer de secret. Les valeurs réelles vivent dans `.env` (local, git-ignoré) et dans les variables Vercel/GitHub (chiffrées).

---

## Qualité & livrables attendus

- **Tests** : règles `domain/` couvertes en unitaire (Vitest) ; parcours critiques en e2e (Playwright) — connexion, ajout de transaction, création de budget, bascule de thème.
- **TypeScript strict** sans `any` non justifié ; ESLint + Prettier passent sans erreur ; `pnpm typecheck` propre.
- **Accessibilité** : navigation clavier, contrastes suffisants (y compris en Mode Marie), `aria-*` sur les composants interactifs, `prefers-reduced-motion` respecté.
- **Responsive réel** : navigation latérale sur PC, barre de navigation basse (bottom nav) sur mobile ; formulaires et tableaux adaptés au tactile.
- **PWA** installable + écran hors-ligne.
- **README de reprise** complet (démarrage, pièges, migrations Neon via HTTPS, variables d'environnement, architecture, déploiement, lien du repo GitHub) dans le style de celui d'esthetique-app.
- Code **commenté là où c'est non-évident**, commits en **Conventional Commits**.

## Déroulé de travail suggéré

1. Scaffolding Next.js 16 + Prisma 7 + Auth.js v5 + Tailwind 4/shadcn, avec l'arborescence modulaire ci-dessus.
2. **Mise sous Git + création auto du repo GitHub privé + premier commit + push + tag `v0.1.0` + workflow CI** (voir section Versionnement).
3. Schéma Prisma + migrations + seed.
4. Auth (inscription/connexion) + garde de session + isolation par `userId`.
5. Modules cœur : comptes → transactions → catégories → dépenses fixes/récurrentes → budgets → épargne.
6. Tableau de bord + graphiques + rapports + exports PDF/Excel.
7. Système de thèmes (Classique + Mode Marie) via variables CSS + `next-themes`.
8. Responsive, PWA, accessibilité.
9. Tests unitaires + e2e, lint, typecheck.
10. README + déploiement Vercel connecté au repo.

Commence par proposer un plan détaillé et l'arborescence de fichiers avant de coder, puis avance module par module, en committant à chaque étape.
```
