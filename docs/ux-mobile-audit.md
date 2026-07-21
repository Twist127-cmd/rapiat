# Audit UX mobile — Rapiat

> Revue de l'interface héritée d'`esthetique-app` (pensée desktop puis responsivisée à la
> marge), aux largeurs **360 px**, **390 px** et **768 px**, en thèmes **Classique** et
> **Mode Marie**, clair et sombre. Objectif : cibler précisément ce qui doit être repensé
> **mobile-first**. Aucune logique métier n'est remise en cause — refonte front uniquement.

## Méthodologie

- Largeurs testées : 360 (petit Android), 390 (iPhone 14/15), 768 (tablette / seuil `md`).
- Le seuil `md` (768 px) sépare l'affichage mobile (sidebar cachée, bottom bar visible) du
  desktop. La plupart des grilles passent en 1 colonne sous `sm` (640 px).
- Codes : 🔴 bloquant · 🟠 gênant · 🟡 à améliorer · 🟢 déjà correct.

---

## Constat transversal

### Navigation — `components/app-nav.tsx` (`BottomNav`) 🔴

- Barre fixe en bas affichant **5 entrées** (`mobile: true`) : Accueil, Comptes,
  Transactions (centre surélevé), Budgets, Rapports. À 360 px, libellés à **11 px** tassés,
  cibles étroites, l'entrée « centre surélevée » (`-mt-6`, bordures) est fragile et déборde
  visuellement selon le thème.
- Les entrées **secondaires** (Épargne, Dépenses fixes, Paramètres) ne sont **pas
  accessibles** depuis le mobile (pas de flag `mobile`) → **impasse de navigation**.
- La barre occupe en permanence ~64 px + safe-area en bas ; le contenu compense avec un
  `padding-bottom` important, réduisant l'espace utile.
- → **Chantier 1** : remplacer par une **bulle flottante dépliable** (FAB / speed-dial) en
  bas à droite, générée depuis un registre `navigation.ts` enrichi (primaires / action
  rapide / secondaires).

### Données tabulaires 🔴

- `TransactionsView` rend un **`<table>`** dans un conteneur `overflow-x-auto`. Sur mobile,
  colonnes masquées (`date` < sm, `compte` < md) mais il reste une **table à cases à
  cocher** peu tactile : pas de tap → détail, pas de swipe, actions dans un menu `⋮` petit.
- La primitive `ui/table.tsx` enveloppe toujours dans `overflow-x-auto` → **scroll
  horizontal** dès qu'une table est réutilisée.
- → **Chantier 3** : composant **`ResponsiveList`** (cartes empilées < md, table ≥ md) et
  refonte de la liste des transactions (carte par ligne, montant aligné, swipe/menu).

### Formulaires 🟠 (partiellement déjà bon)

- `ui/dialog.tsx` s'affiche **déjà en bottom-sheet** sous `sm` (`inset-x-0 bottom-0
  rounded-t-2xl`, safe-area) et en carte centrée ≥ sm. 🟢 Bonne base.
- Manques : **pas de barre d'action collante** au-dessus du clavier, pas de poignée de glisse
  (drag-to-dismiss), gestion du **scroll quand le clavier apparaît** non optimisée, largeurs
  de champs et pavé numérique non pensés mobile.
- → **Chantier 4** : composant **`Sheet`** dédié (bottom-sheet < md avec header/poignée +
  zone scrollable + footer collant ; `Dialog` centré ≥ md) et migration des formulaires.

### Sélecteurs `select` / `dropdown-menu` 🟡

- Triggers à hauteur standard (~36 px) un peu justes pour le pouce ; les menus contextuels
  d'actions (`⋮`) sont petits. Cibles à porter à **≥ 44 px** sur mobile.

### En-tête — `app/(dashboard)/layout.tsx` 🟠

- Sur mobile : logo + nom Rapiat **dupliqués** (déjà présents ailleurs), + `ThemeSwitcher`
  (masqué < sm), + theme-toggle + déconnexion empilés sur peu d'espace. Pas de **titre
  d'écran contextuel**.
- → **Chantier 6** : header mobile minimal (logo + titre d'écran) ; theme-toggle et
  déconnexion déplacés dans « Plus »/profil.

### Saisie rapide 🔴

- L'action principale (**ajouter une transaction**) n'est atteignable qu'en allant sur
  `/transactions` puis « Ajouter ». Aucune saisie rapide au pouce.
- → **Chantiers 1 + 2** : entrée « + Nouvelle transaction » mise en avant dans la bulle,
  ouvrant un **bottom-sheet de saisie rapide** (pavé numérique, type en gros boutons,
  catégorie/compte en chips).

### Densité & typographie 🟡

- Paddings et tailles calibrés desktop (`p-6`, titres `text-3xl`), `gap` larges. À réviser
  pour le mobile (échelle typo, espacements), `tabular-nums` systématique sur les montants
  (déjà présent par endroits, à généraliser).

### États & micro-interactions 🟡

- Empty states présents (`EmptyState`) 🟢, toasts `sonner` 🟢. Manquent : **skeletons** de
  chargement, transitions d'ouverture de sheets soignées, pull-to-refresh, swipe.

### Accessibilité 🟡

- Bonne base (`aria-*`, focus, `prefers-reduced-motion` pour le décor Marie). À garantir sur
  les nouveaux composants : **focus trap** de la bulle, `aria-expanded/controls`,
  `role=menu/menuitem`, navigation clavier, contrastes AA dans les deux thèmes.

---

## Revue écran par écran

| Écran | 360 / 390 px | 768 px | Verdict |
| --- | --- | --- | --- |
| **Connexion / Inscription** | Formulaires server-action pleine largeur (`max-w-sm`), panneau de marque masqué < lg. Corrigé récemment (fonctionne sans JS). | Panneau de marque + formulaire côte à côte. | 🟢 OK |
| **Tableau de bord** (`(dashboard)/page.tsx`) | Cartes en 1 colonne, StatCards passent 2-col dès `sm`. Graphiques `ResponsiveContainer` tiennent en largeur mais **légende du donut** à l'étroit ; beaucoup de défilement vertical ; dernier bloc chevauché par la bottom bar. | 2 colonnes. | 🟠 réorganiser/prioriser (**Chantier 5**) |
| **Transactions** | **Table** + cases à cocher, filtres empilés en colonne (hauts), pas de tap→détail ni swipe. | Table complète OK. | 🔴 (**Chantiers 3, 4**) |
| **Budgets** | Cartes 1 colonne, barres de progression lisibles, actions en menu `⋮`. | 2 colonnes. | 🟡 (cibles tactiles, sheet) |
| **Épargne** | Cartes 1 colonne ; « Contribuer » ouvre déjà un sheet. | 2 colonnes. | 🟡 |
| **Comptes** | Solde consolidé + cartes ; OK mais densité desktop. | Grille 3 col. | 🟡 |
| **Dépenses fixes** | Liste de cartes empilées, résumé « reste à vivre ». Convenable. | idem | 🟡 |
| **Rapports** | `MonthNav` + boutons export **wrap** un peu serré ; graphiques OK ; liste catégories lisible. | 2 colonnes. | 🟡 |
| **Paramètres** | `TabsList` en `flex-wrap` (onglets qui passent à la ligne) ; formulaires en cartes. | idem | 🟡 (sheets, densité) |

---

## Synthèse priorisée → chantiers

| Priorité | Problème | Chantier |
| --- | --- | --- |
| P0 🔴 | Bottom bar surchargée + entrées secondaires inaccessibles | 1 — Bulle flottante dépliable |
| P0 🔴 | Pas de saisie rapide de transaction | 2 — Bottom-sheet de saisie rapide |
| P0 🔴 | Tableaux en scroll horizontal | 3 — `ResponsiveList` |
| P1 🟠 | Formulaires : action collante + clavier + glisse | 4 — Composant `Sheet` |
| P1 🟠 | Tableau de bord non priorisé mobile | 5 — Dashboard mobile |
| P1 🟠 | En-tête dupliqué, sans titre d'écran | 6 — Header & densité |
| P2 🟡 | Skeletons, swipe, transitions | 7 — États & gestes |
| P2 🟡 | Vérif thèmes/clair-sombre/AA | 8 — Thèmes préservés |

Les fondations transverses (composant `Sheet`, tokens de densité, safe-areas, échelle typo)
sont prérequises et traitées en premier (voir plan).
