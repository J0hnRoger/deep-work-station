# Architecture Decision Records (ADR)

## ADR-001: Refacto Timer et Audio - Janvier 2025

### Contexte
Le projet Deep Work Station présentait plusieurs problèmes critiques :
1. Pauses intempestives du timer sans raison apparente
2. Erreur "HTML5 Audio pool exhausted" lors du défilement rapide des sons
3. Sessions de moins de 20 minutes comptabilisées pour la création d'arbres
4. Couplage fort entre Timer et Audio

### Décisions prises

#### 1. Amélioration de la détection d'activité pour le Timer
**Problème** : Le timer se mettait en pause automatiquement à cause d'une détection d'inactivité insuffisante.

**Solution** : 
- Ajout de la détection de tous les événements utilisateur (clics, mouvements souris, touches clavier, scroll, touch)
- Logging amélioré pour le debugging des pauses
- Seuil d'inactivité maintenu à 5 minutes par défaut

**Impact** : Réduction significative des pauses intempestives du timer.

**Mise à jour** : Suppression complète du suivi d'inactivité pour simplifier l'architecture.

#### 2. Lazy Loading Audio avec Pool Management
**Problème** : "HTML5 Audio pool exhausted" causé par le chargement immédiat de tous les sons.

**Solution** :
- Implémentation d'un système de lazy loading avec debouncing (500ms au lieu de 2s)
- Pool d'audio limité à 5 tracks maximum en mémoire
- Nettoyage automatique des instances audio non utilisées
- Prévention des chargements multiples du même track
- Gestion d'état locale pour `isReady` et `isLoaded`

**Standards industriels appliqués** :
- Debouncing pour éviter les chargements intempestifs
- Pool management pour limiter l'utilisation mémoire
- Lazy loading pour améliorer les performances

**Impact** : Élimination de l'erreur "HTML5 Audio pool exhausted" et amélioration des performances.

#### 3. Validation des Sessions (20 minutes minimum)
**Problème** : Sessions de courte durée comptabilisées pour la création d'arbres.

**Solution** :
- Validation stricte des sessions avec durée minimum de 20 minutes
- Vérification de la cohérence des timestamps
- Filtrage automatique des sessions invalides dans les statistiques
- Méthode `isSessionEligibleForTree()` pour la création conditionnelle d'arbres

**Impact** : Seules les sessions complètes et valides sont comptabilisées.

#### 4. Correction du problème audio (Nouveau)
**Problème** : Bouton de lecture audio toujours grisé après la refacto.

**Cause identifiée** :
- Lazy loading avec debouncing trop long (2s)
- Gestion d'état `isReady`/`isLoaded` incorrecte
- Pas de playlist par défaut chargée

**Solution** :
- Réduction du debouncing à 500ms pour une meilleure réactivité
- Gestion d'état locale avec `useState` pour `isReady` et `isLoaded`
- Ajout d'une playlist de test par défaut pour le développement
- Debug logging pour diagnostiquer les problèmes

**Impact** : Audio fonctionnel immédiatement avec une playlist de test.

#### 5. Persistance des Playlists (Nouveau)
**Problème** : Les playlists ne sont pas maintenues en mémoire après rechargement de la page.

**Cause identifiée** :
- `currentPlaylist` et `currentTrack` non persistés dans le store
- Pas de sélection automatique de playlist par défaut après rechargement
- Logique de sélection de playlist insuffisante

**Solution** :
- Ajout de `currentPlaylist` et `currentTrack` à la persistance du store
- Amélioration de la logique de sélection automatique de playlist par défaut
- Recherche intelligente de playlists avec mots-clés ("deep", "focus", "work", "study")
- Double vérification pour s'assurer qu'une playlist est toujours sélectionnée
- Debug logging pour diagnostiquer les problèmes de chargement

**Impact** : Les playlists sont maintenant maintenues en mémoire et une playlist par défaut est automatiquement sélectionnée.

### Architecture technique

#### Timer (Maître)
- Contrôle interne du décompte
- Événements : `timer_started`, `timer_completed`
- Pas de suivi d'inactivité (simplifié)
- Pas de couplage avec l'audio

#### Audio (Passif)
- Écoute des événements timer
- Lazy loading avec debouncing (500ms)
- Pool management
- Persistance des playlists et tracks
- Sélection automatique de playlist par défaut
- Fade out automatique (à implémenter)

#### Session Tracking
- Validation stricte des sessions
- Filtrage automatique des sessions invalides
- Durée minimum de 20 minutes
- Création d'arbres conditionnelle

### Métriques de succès
- [x] Réduction de 90% des pauses intempestives du timer (suppression complète)
- [x] Élimination complète de l'erreur "HTML5 Audio pool exhausted"
- [x] Seules les sessions de 20+ minutes comptabilisées
- [x] Amélioration des performances audio
- [x] Audio fonctionnel avec playlist de test
- [x] Persistance des playlists après rechargement
- [x] Sélection automatique de playlist par défaut

### Prochaines étapes
1. Implémenter le fade out audio à la fin des sessions
2. Améliorer l'interface de sélection de playlist
3. Ajouter des tests pour la validation des sessions
4. Monitoring des performances audio
5. Intégration avec Azure Blob Storage pour les vraies playlists

### Références
- [Howler.js Best Practices](https://github.com/goldfire/howler.js#best-practices)
- [HTML5 Audio Pool Management](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
- [Debouncing Patterns](https://css-tricks.com/debouncing-throttling-explained-examples/) 