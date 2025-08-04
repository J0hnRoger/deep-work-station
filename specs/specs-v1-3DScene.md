# PRD - Scene 3D de forêt

**brief Produit pour la Scène 3D “Forêt” en React Three Fiber (R3F), à afficher à la place de la splash screen. 

Référence de contrôleur : le repo que tu as partagé (3rd-person controller) sera la base d’inspiration pour l’input/caméra — sans modèle de personnage (mode “fantôme”).
github: https://github.com/wass08/r3f-3rd-person-controller-final

## 1) Objectif

Renforcer le Core Drive #2 — Accomplishment via une visualisation 3D : la scene de forêt démarre vide, et chaque session de focus “plante” un arbre. Une nouvelle commande (cf @command-palette ) permet à l’utilisateur de passer en mode Exploration (full screen, plus aucune interface autour) et peut se balader dans la scene pour admirer sa progression.

## 2) Périmètre V0 (POC)

- Affichage d’une plaine simple (sol + ciel, ambiance lumineuse, studio Ghibli style) — pas d’assets lourds.

- Contrôleur 3D libre (inspiration 3rd-person du repo, mais avatar invisible / fantôme).
- Arbres placeholders : primitives (ex. cône + cylindre ou billboard) ; pas encore de modèle glTF.
- Placement déterministe des arbres à partir des sessions.
- Étiquette (label) par arbre : titre de la session et durée (visible au survol ou à l’approche).
- Transition Page d'accueil normale ↔ Scène via commande (palette Ctrl+K) + raccourci clavier dédié.

- Lazy-load de tout le bundle 3D (code-split) ; le timer reste la vue par défaut.

**Hors V0 :** collisions/physiques complexes, météo/jour-nuit, sons 3D, assets d’arbres réalistes, mini-map, export/partage.

## 3) Parcours & UX

Commande/palette :

- forest open → passe en plein écran 3D, capture du pointeur et enable des contrôles.
- forest close → revient à l’écran Timer et désactive les contrôles.

Indications à l’écran (help overlay) : au premier forest open, afficher un petit panneau avec les touches (voir §4).

### Affichage des arbres :

- Si aucune session : plaine vide + message “Commence ta première session pour planter un arbre.”
- À chaque fin de session : un nouvel arbre est ajouté (animation simple de “pousse”, ex. scale Y - sur 3 niveaux: germe -> buisson -> arbre).

- Label (survol/approche) : [Titre de session] — [Durée] — [Date].
Retour : Esc affiche le curseur et suspend les contrôles (sans quitter la scène), forest close revient au Timer.

## 4) Contrôles (mode “fantôme”)

Déplacement : W/A/S/D.
Souris : orientation de la caméra (yaw/pitch), pointer lock.
Aide : H bascule l’overlay des commandes.

Basculer Timer/Scène : commande palette 

Note : on ne rend pas de mesh d’avatar ; le contrôleur garde la caméra/rig et la gestion des inputs du repo de référence, avec la partie “physiques” désactivée ou neutre (pas de collisions).

## 5) Règles de mapping “Sessions → Arbres”

1 session = 1 arbre.
Taille (scale) par durée : courte (<25 min) = petite, standard (25–50 min) = moyenne, longue (≥50 min) = grande.

Positionnement : distribution pseudo-aléatoire mais déterministe (seed utilisateur + id session) dans un disque ou grille jitter (distance minimale entre arbres pour éviter l’overlap).

Orientation : légère variation (±10°) pour casser la répétition.
Label : title (ou “Deep Work” par défaut) + duration + date.

Données d’entrée côté scène (agrégées depuis localStorage pour l'instant, accessibles via le store Zustand) :

```
TreeLike = {
  id, date, durationSec, title, project? // depuis Session
}
```
La scène résout position, scale, variant à partir de ces champs, et ajoute la position dans le store (dans un nouveau slice "forest"?).

## 6) Environnement & rendu

Monde : plaine (plane géant), fog doux, sky simple, lumière ambiante + directionnelle très soft (pas d’ombres en V0 si coût GPU).

Arbre placeholder : primitive géométrique (ou sprite billboard) en attendant un glTF.

Labels : overlay HTML ou Text 3D (lisible, contraste OK, culling à distance).

Animation “pousse” : apparition par scale (0 → target) + léger offset vertical.

Empty state : pas d’arbres, message central discret ; FPS stable.

## 7) États & navigation

Modes : TIMER (par défaut), FOREST_SCENE.
Transition :
forest open → charger de manière lazy le module 3D (splash courte “Loading 3D…”), entrer en plein écran, lock pointeur.
forest close → détruire proprement la scène (ou la laisser suspendue selon mesure perf), libérer le pointeur.
Audio : la musique (howler/Blob) continue à jouer en arrière-plan.

## 8) Commandes (palette Ctrl+K)

forest open → ouvre la scène 3D en plein écran.
forest close → revient à l’écran Timer.
forest help → affiche l’overlay des contrôles.
(debug) forest plant <minutes> → ajoute un arbre test.

## 9) Évolutions prévues (post-V0)

- Modèles glTF d’arbres (variétés par durée/streak) + instanced meshes.
- Sons d’ambiance calmes (optionnels).
- Cycle jour/nuit lié aux plages de travail.
- Screenshots export/partage réseaux.



