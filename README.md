<p align="center">
  <img src="public/logo.png" alt="Rapiat" width="120" height="120" />
</p>

<h1 align="center">Rapiat</h1>

<p align="center">
  <em>Près de ses sous, sans se prendre la tête.</em><br />
  Application de gestion des finances personnelles — revenus, dépenses fixes &amp; variables,
  épargne et budgets.
</p>

---

## Statut

| Élément | État |
| --- | --- |
| App en ligne HTTPS | ✅ https://rapiat.vercel.app |
| Base Neon (migrations + seed) | ✅ atteinte depuis Vercel |
| Variables d'env (prod/preview/dev) | ✅ `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_NAME` |
| Dépôt GitHub public + CI | ✅ https://github.com/Twist127-cmd/rapiat |
| Auto-déploiement (push → Vercel) | ✅ activé sur `main` |

> Démo : `demo@rapiat.ch` / `Demo1234!`

---

## Sommaire

- [Aperçu](#aperçu)
- [Pile technique](#pile-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données Neon (migrations via HTTPS)](#base-de-données-neon-migrations-via-https)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Thèmes](#thèmes)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Déploiement Vercel](#déploiement-vercel)
- [Pièges connus](#pièges-connus)

## Aperçu

Rapiat suit vos **comptes**, **transactions** (revenus / dépenses / transferts), **dépenses
fixes récurrentes**, **budgets par catégorie** et **objectifs d'épargne**, avec un tableau de
bord synthétique, des graphiques, des rapports et des exports **PDF/Excel**. L'app est
**responsive** (barre latérale sur PC, barre de navigation basse sur mobile), **installable
en PWA** avec écran hors-ligne, et propose **deux thèmes commutables** (Classique &amp; Mode
Marie), chacun en clair/sombre.

## Pile technique

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict**
- **PostgreSQL (Neon)** via `@prisma/adapter-neon` (HTTPS, port 443) · **Prisma 7**
- **Auth.js v5** (Credentials, sessions JWT, mots de passe **bcrypt**)
- **Zod 4** (validation des entrées + config au démarrage)
- **Tailwind CSS 4** + **shadcn/ui** (Radix / base-ui) + `lucide-react` + `sonner` + `next-themes`
- **react-hook-form** + `@hookform/resolvers` · **date-fns** + `@date-fns/tz`
- **recharts** (graphiques) · **exceljs** + **@react-pdf/renderer** (exports)
- **Vitest** + Testing Library · **Playwright** (e2e) · **ESLint** + **Prettier**
- **PWA** (manifest + service worker) · **pnpm** · déploiement **Vercel**

## Démarrage rapide

```bash
pnpm install            # installe les dépendances + génère le client Prisma
cp .env.example .env    # puis renseignez les valeurs (voir ci-dessous)
pnpm db:migrate:http    # applique les migrations sur Neon (HTTPS)
pnpm db:seed            # (optionnel) données de démonstration
pnpm dev                # http://localhost:3000
```

## Variables d'environnement

Toutes les variables sont validées au démarrage par **Zod** (`src/lib/env.ts`) : l'app refuse
de démarrer si une valeur requise manque. Voir `.env.example`.

| Variable                   | Requis | Rôle                                                        |
| -------------------------- | :----: | ----------------------------------------------------------- |
| `DATABASE_URL`             |   ✅   | URL Neon **avec pooling** (runtime, HTTPS 443)              |
| `DIRECT_URL`               |   —    | URL Neon **directe** (migrations Prisma)                    |
| `AUTH_SECRET`              |   ✅   | Secret Auth.js (≥ 32 caractères — `openssl rand -base64 32`)|
| `AUTH_URL`                 |   —    | URL publique (requis en prod)                               |
| `NEXT_PUBLIC_APP_NAME`     |   —    | Nom affiché (défaut `Rapiat`)                               |
| `NEXT_PUBLIC_ALLOW_SIGNUP` |   —    | `true`/`false` — verrouiller l'inscription après le 1er compte |

> Ne **jamais** committer de secret. Les `.env*` sont git-ignorés ; les valeurs réelles vivent
> en local et dans les variables Vercel/GitHub (chiffrées).

## Base de données Neon (migrations via HTTPS)

Neon bloque le protocole Postgres brut (port 5432) sur certains réseaux ; l'app se connecte via
le **driver serverless Neon en HTTPS (443)** (`src/lib/db.ts`). Pour les migrations, Prisma
utilise `DIRECT_URL` si disponible (`prisma.config.ts`). Deux chemins :

- `pnpm db:migrate` — Prisma Migrate classique (nécessite `DIRECT_URL`).
- `pnpm db:migrate:http` — applique le SQL des migrations via le driver HTTPS Neon
  (`prisma/migrate-http.ts`), utile quand seul `DATABASE_URL` (pooled) est accessible.

## Scripts

| Script                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| `pnpm dev`              | Serveur de développement                     |
| `pnpm build` / `start`  | Build / serveur de production                |
| `pnpm lint`             | ESLint                                       |
| `pnpm typecheck`        | `tsc --noEmit`                               |
| `pnpm test` / `:watch`  | Tests unitaires Vitest                       |
| `pnpm test:e2e`         | Tests end-to-end Playwright                  |
| `pnpm icons`            | Régénère les icônes PWA depuis `public/logo.png` |
| `pnpm db:migrate:http`  | Migrations Neon via HTTPS                     |
| `pnpm db:seed`          | Données de démonstration (idempotent)        |
| `pnpm db:studio`        | Prisma Studio                                |

## Architecture

Découpage strict en couches, **par modules métier**. Chaque module expose son API via son
`index.ts` (barrel). Flux : `components → actions → services → domain + data-access`. Le dossier
`domain/` est **pur** (aucune dépendance framework/DB) et testé unitairement. Un composant
**n'appelle jamais Prisma directement**.

```
src/
├─ app/(auth)/…            # connexion / inscription
├─ app/(dashboard)/…       # app protégée (comptes, transactions, budgets, épargne, rapports…)
├─ app/api/…               # auth [...nextauth], exports (pdf/excel)
├─ modules/…               # cœur métier : auth, accounts, transactions, recurring,
│                          #   budgets, savings, categories, reports, settings
│  └─ <module>/{domain,services,actions,components,__tests__,index.ts}
├─ server/                 # auth(.config), session, guards, user-db (isolation), data-access, audit
├─ lib/                    # env, db, money, dates, utils, errors, action-result
├─ components/             # ui/ (shadcn), app-nav, thèmes, brand-logo
└─ config/                 # constants, navigation, catégories par défaut
```

### Isolation par utilisateur

`src/server/user-db.ts` étend Prisma pour injecter automatiquement le `userId` de la session
dans **chaque** requête sur un modèle utilisateur. Le code métier ne reçoit que ce client scellé
(`getUserContext()`), rendant techniquement impossible l'accès aux données d'un autre utilisateur.

## Thèmes

Deux familles commutables sans rechargement, via variables CSS **OKLCH** dans `globals.css` :

- **Classique** (défaut) — palette dérivée du logo : bleu marine, or, rose blush, base crème.
- **Mode Marie** — ambiance plage/vacances (turquoise, corail, sable, soleil) avec décor animé
  (respecte `prefers-reduced-motion`).

Chaque famille a sa déclinaison **clair/sombre** (`next-themes`). La famille est stockée sur
`data-theme` (`<html>`) avec un script anti-flash, persistée en local et sur le profil.

## Sécurité

Pare-feux en couches : **route** (`proxy.ts` + `authorized`), **session** (`requireSession`),
**isolation par `userId`** (extension Prisma), **validation Zod** sur toutes les entrées.
Cookies httpOnly/secure, en-têtes **CSP/HSTS** (`next.config.ts`), journal d'audit, comparaison
bcrypt anti-énumération à la connexion. Montants stockés en **centimes entiers** (`Int`).

## Tests

- **Unitaires** (Vitest) : règles `domain/` (montants, dates, budgets, récurrences, soldes).
- **E2E** (Playwright) : connexion, ajout de transaction, création de budget, bascule de thème.

## Déploiement Vercel

1. Importer le repo GitHub dans Vercel.
2. Renseigner les variables d'environnement (voir plus haut) dans le projet Vercel.
3. Chaque push sur `main` déclenche un build. Récupérer les variables en local :
   `vercel env pull .env`. Appliquer les migrations Neon : `pnpm db:migrate:http`.

## Pièges connus

- **Client Prisma généré** (`src/generated/`) et `.env*` sont git-ignorés ; le client est
  régénéré par `postinstall`.
- **Identité Git / Vercel** : utilisez un e-mail reconnu par Vercel, sinon le build échoue.
- **Port 5432 bloqué** : utilisez toujours l'URL Neon **pooler** en runtime (HTTPS 443).

---

Dépôt : https://github.com/Twist127-cmd/rapiat
