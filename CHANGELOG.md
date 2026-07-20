# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Modules métier (comptes, transactions, dépenses fixes, budgets, épargne), tableau de bord,
  rapports et exports PDF/Excel — en cours.

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
