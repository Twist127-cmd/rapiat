# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- **Refonte mobile-first** de l'interface : navigation en bulle flottante dépliable (remplace
  la barre du bas), saisie rapide de transaction en bottom-sheet, listes en cartes glissables
  (swipe/tap) sur mobile avec tableau conservé sur desktop, feuilles adaptatives (vaul) pour
  formulaires/filtres, en-tête compact avec titre d'écran. Audit dans `docs/ux-mobile-audit.md`,
  tests Playwright en viewport 390×844, captures dans `docs/screenshots/`.
- Modules métier (comptes, transactions, dépenses fixes, budgets, épargne), tableau de bord,
  rapports et exports PDF/Excel.

### Corrigé

- Connexion/inscription robustes sur mobile (formulaires liés à des server actions,
  fonctionnent sans JS).
- Disparition d'un décalage d'hydratation sur le sélecteur clair/sombre (icônes pilotées en CSS).
- **Compatibilité Safari plus ancien** (ex. iPhone 13 mini) : ciblage `browserslist` iOS ≥ 15.4
  pour que le bundle JS s'exécute (l'interactivité ne fonctionnait pas sur ces appareils).
- Service worker auto-actualisant (plus de version figée en cache après un déploiement).

## [0.1.0] - 2026-07-20

### Ajouté

- Scaffolding initial : Next.js 16 (App Router), React 19, TypeScript strict.
- Prisma 7 + adapter Neon (HTTPS), schéma scellé par `userId`, montants en centimes.
- Auth.js v5 (Credentials, sessions JWT, bcrypt) : connexion, inscription, déconnexion.
- Couche serveur : firewall d'isolation par utilisateur, gardes de session, journal d'audit.
- Deux thèmes commutables (Classique &amp; Mode Marie), chacun en clair/sombre, via OKLCH.
- PWA (manifest, service worker, écran hors-ligne), icônes générées depuis le logo officiel.
- Coquille responsive (barre latérale desktop / navigation basse mobile).
- Intégration continue GitHub Actions (lint, typecheck, tests, build).
