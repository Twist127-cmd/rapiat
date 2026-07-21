# Prompt — Refonte front-end de Rapiat pour une expérience mobile de premier ordre

> À copier-coller dans un agent de développement (Claude Code, Cursor, etc.), à la
> racine du projet Rapiat. Objectif : **refondre entièrement l'ergonomie mobile** du
> front-end sans casser l'expérience desktop ni toucher au métier (server/domain/DB).

---

## Contexte

Rapiat est une application de gestion des finances personnelles (Next.js 16 App Router,
React 19, TypeScript strict, Tailwind CSS 4 + shadcn/ui, next-themes, react-hook-form +
Zod). **Le front-end actuel est un héritage direct de l'app `esthetique-app`** : il a été
pensé pour le desktop puis « responsivisé » à la marge. Sur téléphone, l'ergonomie est
insatisfaisante et doit être repensée en **mobile-first**.

Le shell applicatif actuel se trouve dans :

- `src/app/(dashboard)/layout.tsx` — coquille protégée (sidebar + header + bottom bar).
- `src/components/app-nav.tsx` — `SideNav` (desktop) et `BottomNav` (mobile).
- `src/config/navigation.ts` — registre déclaratif des entrées de menu (`NAV_ITEMS`, flags `mobile` / `mobileCenter`).
- `src/components/ui/*` — primitives shadcn (`table`, `dialog`, `select`, `input`, `card`, `tabs`, `button`, …).
- Les modules (`transactions`, `budgets`, `savings`, `accounts`, `recurring`, `reports`, `settings`) exposent leurs écrans via `components/` — souvent une **table** + un **Dialog** de formulaire.

---

## Rôle & mission

Tu es un ingénieur front-end senior spécialiste UX mobile. Refonds l'interface pour qu'elle
soit **excellente sur téléphone** — fluide, lisible, utilisable au pouce d'une seule main —
tout en **préservant (voire améliorant) le desktop**. La refonte est **purement front-end** :
tu ne modifies ni les server actions, ni les services, ni le `domain/`, ni le schéma Prisma.
Tu peux ajouter des composants UI, des hooks front, et ajuster le layout et les styles.

Commence par un **audit** puis un **plan** validable avant de coder, puis avance
**écran par écran**, en committant à chaque étape (Conventional Commits).

---

## Principes directeurs (mobile-first)

1. **Pouce d'abord.** Les actions primaires vivent dans la zone atteignable en bas de
   l'écran. Cibles tactiles **≥ 44 × 44 px**, espacées d'au moins 8 px.
2. **Une tâche par écran.** Sur mobile, on ne montre que l'essentiel ; le secondaire passe
   en second niveau (sheet, détail, « voir plus »).
3. **Listes, pas tableaux.** Les données tabulaires deviennent des **cartes/lignes
   empilées** sur mobile ; le tableau reste réservé au desktop (≥ md).
4. **Feuilles plutôt que modales.** Les formulaires et sélecteurs s'ouvrent en **bottom
   sheet** sur mobile (glissable, plein largeur), en `Dialog` centré sur desktop.
5. **Feedback immédiat.** États de chargement (skeletons), vide (empty states utiles),
   erreur et succès (toasts `sonner`) systématiques ; transitions courtes (≤ 200 ms).
6. **Lisibilité financière.** Les montants restent parfaitement lisibles, alignés,
   avec hiérarchie claire (couleur pour crédit/débit, tabular-nums), dans les deux thèmes.
7. **Ne rien régresser sur desktop** et **conserver les deux thèmes** (Classique + Mode
   Marie), l'accessibilité et le mode clair/sombre.

---

## Audit attendu (à produire en premier, dans `docs/ux-mobile-audit.md`)

Passe en revue chaque écran aux largeurs **360 px, 390 px et 768 px** et documente les
problèmes concrets. Points de départ connus à traiter en priorité :

- **Bottom bar surchargée** (`BottomNav`) : trop d'entrées `mobile` tassées, libellés à
  11 px, la logique de « centre surélevé » rend le tout fragile. → **Remplacer par un menu
  en bulle flottante dépliable** en bas à droite (voir chantier 1).
- **Tableaux qui débordent** (`ui/table.tsx` + tables des modules) : scroll horizontal,
  colonnes illisibles, actions inaccessibles au pouce.
- **Formulaires en `Dialog`** : modales étriquées, clavier qui masque les champs, boutons
  d'action hors de portée.
- **Sélecteurs `select` / `dropdown-menu`** peu tactiles.
- **En-tête** qui duplique la marque et empile theme-toggle + logout sur peu d'espace.
- **Aucune saisie rapide** de la principale action (ajouter une transaction).
- **Densité et typographie** calibrées desktop (padding, tailles de police, `gap`).

---

## Chantiers de refonte (spécifications)

### 1. Navigation mobile — bulle flottante dépliable (remplace la bottom bar)

Abandonne la barre d'onglets fixe en bas (`BottomNav`) au profit d'un **menu en bulle
flottante ancrée en bas à droite** de l'écran, qui **se déplie au tap** pour révéler les
onglets — pattern « speed-dial » / menu radial.

- **État replié** : une seule bulle circulaire (FAB) en bas à droite, dans la zone
  atteignable au pouce, avec le logo/l'icône Rapiat ou une icône « menu ». Elle **flotte
  au-dessus du contenu** et respecte `env(safe-area-inset-bottom/right)`. Discrète, ombre
  douce, ne masque jamais le contenu important (léger décalage du padding de contenu si
  nécessaire).
- **État déplié** (au tap) : les entrées de navigation **jaillissent** de la bulle — en
  **arc/éventail** au-dessus et à gauche, ou en **pile verticale** — chacune sous forme de
  pastille icône **+ libellé** lisible, cible ≥ 44 px. Un **fond semi-transparent (scrim)**
  couvre l'écran ; taper à côté, choisir un item, ou `Échap` referme le menu. L'icône de la
  bulle se transforme (menu → croix) pendant l'ouverture.
- **Entrées** : onglets primaires (ex. Accueil, Transactions, Budgets, Rapports) + accès aux
  entrées secondaires (Comptes, Épargne, Dépenses fixes, Paramètres). Si la liste est
  longue, priorise les principales dans l'éventail et regroupe le reste sous un item
  « Plus ». Indique clairement l'**onglet actif** (surbrillance) et affiche le **badge de
  notification** sur la bulle repliée + sur l'item concerné.
- **Action rapide** : inclus une entrée proéminente **« + Nouvelle transaction »** dans le
  menu déplié (première position, mise en avant), ou un appui long sur la bulle qui ouvre
  directement la saisie rapide.
- **Ergonomie & accessibilité** : animation d'ouverture fluide et rapide (≤ 200 ms,
  décalage léger entre items), respect de `prefers-reduced-motion` (apparition simple sans
  translation), **focus trap** dans le menu ouvert, `aria-expanded`/`aria-controls` sur la
  bulle, `role="menu"`/`menuitem`, navigation clavier complète. Prévois une **option de
  positionnement** (bas droite par défaut, possibilité bas gauche pour les gauchers, à
  exposer dans les paramètres ou au moins prévue dans le composant).
- Implémente ce menu comme un composant dédié (ex. `components/mobile-nav-bubble.tsx`),
  affiché **< md uniquement** ; la `SideNav` desktop est conservée telle quelle (≥ md).
- Fais évoluer `src/config/navigation.ts` pour distinguer proprement *onglets primaires*,
  *action rapide*, et *entrées secondaires* — la bulle se génère toujours depuis ce registre.

### 2. Saisie rapide de transaction

- L'entrée « + Nouvelle transaction » du menu bulle ouvre un **bottom sheet « Nouvelle
  transaction »** optimisé mobile : pavé numérique clair pour le montant, gros sélecteurs de
  type (Dépense / Revenu / Transfert), catégorie et compte en chips/scroll horizontal, date
  par défaut = aujourd'hui, validation en un tap. Réutilise la server action existante —
  **UI seulement**.

### 3. Listes de données (remplacer les tableaux sur mobile)

- Crée un composant **`ResponsiveList`** (ou pattern équivalent) : rend une **liste de
  cartes** empilées < md et le **tableau** ≥ md, à partir de la même source de données.
- Chaque ligne de transaction en carte : icône/couleur de catégorie, libellé, date, montant
  aligné à droite (vert crédit / rouge débit), tap → détail, **actions par swipe** ou menu
  contextuel (éditer / dupliquer / supprimer) accessibles au pouce.
- Filtres et recherche : barre compacte + **sheet de filtres** sur mobile (période,
  catégorie, compte), pas une rangée de selects serrés.

### 4. Formulaires en bottom sheet

- Introduis un composant **`Sheet`** (Radix Dialog stylé en bottom sheet < md, `Dialog`
  centré ≥ md) et bascule tous les formulaires modules dessus.
- Champs à hauteur confortable, `inputMode`/`type` adaptés (numérique, date native),
  **barre d'action collante** en bas du sheet au-dessus du clavier, gestion du focus et du
  scroll quand le clavier apparaît.

### 5. Tableau de bord mobile

- Réorganise l'accueil en **cartes empilées, priorisées** : solde global en tête, carrousel
  des comptes, « reste à vivre » du mois, avancement des budgets (barres), objectifs
  d'épargne, prochaines échéances, dernières transactions. Graphiques **responsive** qui ne
  débordent pas (donut/barres tenant dans la largeur, légende repositionnée).

### 6. En-tête & densité

- En-tête mobile minimal : logo Rapiat + titre d'écran contextuel ; theme-toggle et
  déconnexion déplacés dans « Plus »/profil. Header collant, compact, avec safe-area top.
- Révise l'échelle typographique et les espacements pour le mobile (tokens Tailwind),
  `tabular-nums` sur les montants.

### 7. États, gestes et micro-interactions

- Skeletons de chargement par écran, empty states orientés action (« Ajoutez votre première
  transaction »), erreurs récupérables, toasts de succès.
- Pull-to-refresh là où pertinent, swipe sur les lignes, transitions d'ouverture des sheets
  fluides, `prefers-reduced-motion` respecté.

### 8. Thèmes préservés

- Toute la refonte fonctionne à l'identique dans le **thème Classique** (bleu marine / or /
  blush, dérivé du logo) **et le Mode Marie** (plage kitsch), en clair et en sombre. Les
  éléments décoratifs du Mode Marie ne doivent jamais gêner la lisibilité mobile.

---

## Contraintes techniques

- **Front-end uniquement** : interdiction de modifier `src/server/**`, `src/modules/**/{actions,services,domain}`, `prisma/**`. Tu touches aux `components/`, `app/(dashboard)/layout.tsx`, `config/navigation.ts`, `app/globals.css`, et tu ajoutes des primitives UI.
- **Stack imposée** : réutilise shadcn/ui + Radix + Tailwind 4 + next-themes ; pas de nouvelle librairie UI lourde. Une petite lib de gestes/sheet légère est acceptable si justifiée.
- **Accessibilité** : navigation clavier, rôles/aria, contrastes AA (les deux thèmes), focus visibles, `prefers-reduced-motion`.
- **Performance** : pas de régression de bundle notable ; composants client seulement quand nécessaire ; images/icônes optimisées.
- **Réutilisation** : ne réécris pas les server actions ; l'UI consomme les mêmes.

---

## Livrables & vérification

1. `docs/ux-mobile-audit.md` (constat + captures/annotations) puis un **plan** validé.
2. La refonte, livrée **écran par écran** en commits atomiques.
3. **Tests Playwright en viewport mobile** (ex. 390 × 844) sur les parcours clés : ouvrir la
   saisie rapide et créer une transaction, naviguer entre onglets, filtrer la liste, éditer
   via bottom sheet, basculer de thème.
4. **Preuves visuelles** : captures aux largeurs 360/390/768 px, avant/après, dans les deux
   thèmes et en clair/sombre. Vérifie qu'aucun élément n'est masqué par la bottom bar ni le
   clavier.
5. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` **verts**. Score Lighthouse
   mobile (Performance/Accessibilité/Best-practices) contrôlé et rapporté.
6. Mets à jour le README (section UI/mobile) et le CHANGELOG.

## Déroulé suggéré

1. Audit mobile documenté + plan.
2. Fondations : composant `Sheet`, tokens de densité, safe-areas, échelle typo mobile.
3. Navigation : menu en **bulle flottante dépliable** (bas droite) remplaçant `BottomNav`, généré depuis `navigation.ts`.
4. Saisie rapide de transaction (bottom sheet), déclenchée depuis la bulle.
5. `ResponsiveList` + refonte de la liste des transactions (cartes, swipe, filtres en sheet).
6. Migration des autres écrans (budgets, comptes, épargne, dépenses fixes) vers listes + sheets.
7. Tableau de bord mobile (cartes priorisées + graphiques responsive).
8. En-tête/profil, états & micro-interactions.
9. Vérif dans les deux thèmes (Classique + Mode Marie), clair/sombre.
10. Tests Playwright mobile, captures avant/après, lint/typecheck/build, README + CHANGELOG.

Commence par l'audit et le plan, et attends ma validation avant d'implémenter.
