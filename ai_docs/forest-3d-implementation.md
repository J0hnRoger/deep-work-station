# Forest 3D Implementation - Architecture Decisions

## Problèmes identifiés et solutions

### 1. Erreur de positionnement des arbres
**Problème** : `Cannot assign to read only property 'position' of object '#<Group>'`

**Cause** : Passage d'un objet `{x, y, z}` au lieu d'un tableau `[x, y, z]` pour la propriété position

**Solution** : Conversion de `t.position` en `[t.position.x, t.position.y, t.position.z]`

### 2. Structure de données incohérente
**Problème** : Le slice définissait `size: "tree"` mais le type ne l'incluait pas

**Solution** : Nettoyage de la structure de données et ajout d'actions CRUD

### 3. Manque de gestion des échelles
**Problème** : Pas de contrôle sur la taille des arbres

**Solution** : Ajout de la propriété `scale` avec valeur par défaut et contrôles Leva

### 4. Améliorations apportées

#### Structure de données ForestSlice
```typescript
export type ForestSlice = {
    tree: {
        id: string
        position: {
            x: number
            y: number
            z: number
        }
    }[]
    addTree: (position: { x: number; y: number; z: number }) => void
    removeTree: (id: string) => void
    clearTrees: () => void
}
```

#### Composant Tree amélioré
- Types TypeScript appropriés
- Configuration des ombres automatique
- Gestion de l'échelle configurable
- Position correctement typée

#### Contrôles utilisateur
- Toggle pour afficher/masquer les arbres
- Contrôle de l'échelle des arbres
- Compteur d'arbres en temps réel

## Décisions d'architecture

### 1. Identifiants uniques
- Utilisation d'IDs string pour chaque arbre
- Génération automatique basée sur la longueur du tableau
- Permet d'avoir plusieurs arbres identiques sur la scène

### 2. Gestion des collisions
- Utilisation de `RigidBody` avec `colliders="trimesh"`
- Type "fixed" pour éviter les mouvements non désirés
- Configuration des ombres pour le réalisme

### 3. Ordre de rendu
- Les arbres sont rendus avant la Map pour éviter les problèmes de z-index
- Utilisation de `Physics` pour gérer les interactions

### 4. Performance
- Chargement des modèles GLB avec `useGLTF`
- Configuration des ombres une seule fois au montage
- Utilisation de `useRef` pour éviter les re-renders inutiles

## Prochaines améliorations suggérées

1. **Système de placement interactif** : Permettre de cliquer pour placer des arbres
2. **Variété d'arbres** : Différents modèles GLB pour plus de diversité
3. **Optimisation des collisions** : Utiliser des colliders plus simples pour les arbres
4. **Système de sauvegarde** : Persister la position des arbres
5. **Gestion des LOD** : Différents niveaux de détail selon la distance

## Mode Debug

### Fonctionnalités ajoutées
- **Toggle Debug Mode** : Active/désactive tous les helpers de debug
- **Grille de référence** : Grille 20x20 avec sections colorées
- **Axes globaux** : Repère XYZ au centre de la scène
- **OrbitControls** : Navigation libre en mode debug
- **Points de position** : Sphères rouges sur chaque arbre
- **Axes locaux** : Repère XYZ pour chaque arbre
- **Bounding boxes** : Cubes jaunes wireframe pour visualiser les zones
- **Interface de debug** : Panel avec coordonnées en temps réel

### Utilisation
1. Activer "Debug Mode" dans les contrôles Leva
2. Utiliser OrbitControls pour naviguer librement
3. Observer les helpers visuels sur chaque arbre
4. Consulter le panel de debug pour les coordonnées exactes

## Notes techniques

- Les arbres utilisent le modèle `models/tree.glb`
- Position par défaut : `[0, 1, 1]` pour le premier arbre
- Échelle par défaut : 5
- Les ombres sont configurées automatiquement sur tous les meshes 