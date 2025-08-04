# Frontend Development Guidelines 

## 🏗️ Architecture Globale

### **Pattern Feature-Slice Architecture**
- **Organisation** : Chaque feature est un dossier complet avec sa propre structure
- **Structure** : `src/features/{feature}/` contient :
  - `domain/` - Logique métier pure (DDD)
  - `application/` - Services et orchestration
  - `slices/` - Zustand slices - sert d'`Adapter` (hexagonal archi) entre les services Application et le reste de l'app, et gère les side-effects
  - `components/` - UI React propres à cette feature
  - `hooks/` - Hooks custom pour cette feature (notamment les call API)
  - `api/` - Calls API (si applicable) - avec react-query (exposé via `useQueries`)
  - `{feature}Types.ts` - Types centralisés

### **State Management avec Zustand**
- **Store unique** : `useAppStore` combine tous les slices
- **Slices modulaires** : Chaque feature expose son slice via `create{Feature}Slice`
- **Event-driven** : Utilisation de `subscribeWithSelector` pour découpler les features
- **Persistence** : Middleware `persist` avec `partialize` pour sélectionner les données à sauvegarder

### **Routing avec TanStack Router**
- **File-based routing** : Routes définies dans `src/routes/`
- **Type safety** : Validation des search params avec Zod
- **Navigation** : `useNavigate()` pour les redirections programmatiques
- **BeforeLoad** : Logique de pré-chargement et redirections

## 🎯 Principes de Design

### **Domain-Driven Design (DDD)**
- **Aggregates** : Entités métier dans `domain/` 
- **Services** : Logique métier pure dans `application/` 
- **Anti-Corruption Layer** : Mappers entre contextes 
- **Pure Functions** : Pas d'effets de bord dans le domaine, on privilegie plutôt la FP (sauf pour les entités DDD, State Machine, ...)

### **Functional Programming**
- **Immutabilité** : Toujours retourner de nouveaux objets, jamais de mutation
- **Composition** : Fonctions pures qui se composent
- **Injection de dépendances** : RNG, services externes passés en paramètres
- **Pattern Command** : Actions encapsulées dans des objets
- **Monad** Utiliser des class `Result` pour les retours d'API avec des types génériques (T) 

### **Event-Driven Architecture**
- **EventBus global** : Zustand comme bus d'événements central pour la communication *cross-feature* et ainsi garder isolé les features dans leur dossier
- **Séparation locale/globale** : 
  - Événements locaux pour la logique métier
  - Événements globaux pour l'UI
- **Subscriptions** : Chaque slice peut s'abonner aux événements qui l'intéressent (dans le <feature>Slice)
- **Pattern Observer** : `subscribe{Feature}System()` pour réagir aux événements

## 🛠️ Patterns Techniques

### **Slices Zustand**
Une seule `source of truth`: 
```ts
// --- Store Creation ---
export const useAppStore = create<GlobalStore>()(
  devtools(
  subscribeWithSelector(
    persist(
      (...a) => ({
        ...createEventSlice(...a),
        ...create<Feature>Slice(...a),
      }),
      {
        name: '<app>-store',
        partialize: (state) => ({ 
          // if needed 
        }),
      }
    ),
  ))
);

// Subscription centralisée pour tous les systèmes
useAppStore.subscribe(
  (state) => state.events,
  (events) => {
    // Déléguer la logique de gestion des événements aux slices concernés
    subscribePlayerSystem(events, useGameStore.getState());
    subscribeEventSystem(events, useGameStore.getState());
    subscribeInventorySystem(events, useGameStore.getState());
    subscribeExplorationSystem(events, useGameStore.getState());
  }
);
```

Puis dans chaque slices vertical-slice: @src/features/<feature-name>: 

```ts
const initialState = {
  // feature stuff... 
  isLoading: false,
  error: null
};

// Extended interface with store management
export interface BikeCatalogSliceWithStores extends BikeCatalogSlice, StoreState, StoreActions {}

export const createBikeCatalogSlice: StateCreator<BikeCatalogSliceWithStores> = (set, get) => ({
  ...initialState,

  // Features actions
  setBikes: (response) => {
    set({
      bikes: response.bikes,
      pagination: response.pagination,
      isLoading: false,
      error: null
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ 
      error,
      isLoading: false
    });
  },

  setPagination: (pagination) => {
    set({ pagination });
  },

  ...
});
```
Globalement, le pattern à utiliser pour la fonction de slice: 
```typescript
export const create{Feature}Slice: StateCreator<GameStore> = (set, get) => ({
  // State
  feature: initialState,
  
  // Actions
  actionName: (params) => {
    const state = get();
    // Logique avec accès au store complet
    set((state) => ({ /* mutations */ }));
  },
  
  // Selectors (optionnel)
  selectFeature: (state) => state.feature,
});

/**
 * Fonction d'abonnement aux événements pour le système de la feature 
 * Centralise toute la logique de réaction aux événements globaux pour tracker les events qui interessent cette feature
 * 
 * @param events - Liste des événements globaux
 * @param state - Store complet pour accéder aux actions
 */
export function subscribeExplorationSystem(
  events: AppEvent[], 
  state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]; // Le plus récent est en premier
  if (!latestEvent) return;

  // Tracking des types d'events, en mode Redux 
  if (latestEvent.kind === 'victory') {
    // On track le kill uniquement s'il y a un ennemi vaincu
    // Pour l'instant on utilise un Combatant fictif, sera amélioré quand on aura les vraies données
    const enemyCombatant: Combatant = {
      id: 'unknown',
      sysbeastId: 0,
      name: 'Enemy',
      type1: 'Application',
      level: 5,
      stats: { hp: 100, attack: 50, defense: 50, speed: 50 },
      moves: [],
      integrityMax: 100,
      captureRate: 0.5,
      xp: 0,
      hp: { current: 0, max: 100 },
      side: 'enemy'
    };
    state.trackKill(enemyCombatant);
    
    // Logique de drop d'Entropy Node après victoire
    if (latestEvent.position) {
      // Niveau estimé de l'ennemi (sera amélioré avec les vraies données)
      const enemyLevel = Math.floor(state.runStats.currentDepth / 2) + 1;
      const droppedItem = state.createDrop(latestEvent.position, enemyLevel);
      
      if (droppedItem) {
        console.log(`🎁 Entropy Node ${droppedItem.entropyNode.quality} dropped at ${latestEvent.position.x},${latestEvent.position.y}`);
      }
    }
  }

  // Tracking des captures réussies
  if (latestEvent.kind === 'capture' && latestEvent.beast) {
    state.trackCapture(latestEvent.beast);
  }

  // Tracking du loot collecté
  if (latestEvent.kind === 'loot' && latestEvent.loot) {
    state.trackLoot(latestEvent.loot);
  }

  // Increment depth lors du passage d'une gate
  if (latestEvent.kind === 'gate') {
    state.incrementDepth();
  }

  // Futurs événements avec placeholders
  // if (latestEvent.kind === 'levelUp') {
  //   // Potentiel tracking d'autres stats
  // }
} 
```
Ces fonctions d'abonnement sont utilisées dans le store global `useAppStore`: 


### **Composants React**
- Logique de Dumb Component. Toujours passer par des hooks pour la gestion d'API

### **Hooks customs Clean Architecture**

Hooks minimalistes qui servent d'adaptateurs entre React Query et les Services Application :

// ✅ APRÈS : Hook minimaliste Clean Architecture
```ts
export const useBikeDetail = (bikeId: number) => {
  const query = useQuery({
    queryKey: ['bike-detail', bikeId],
    queryFn: async () => {
      const result = await bikeDetailService.getBikeDetail(bikeId);
      if (result.isError()) {
        throw new Error(result.getError().message);
      }
      return result.getValue();
    },
    enabled: !!bikeId,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  return {
    // ✅ React Query gère tout l'état
    data: query.data,
    bike: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch
  };
};
```

## 🎨 UI/UX Guidelines

### **Design System**
- Tailwind V4
- ShadCN pour la bibliothèque de composants
- utiliser toujours la méthode `cn` pour la concaténation de classes

### **Animations**
- **Framer Motion** : Animations fluides et performantes

## 📡 API & Data Management

### **Calls API**
- **React Query** : Pour les calls API résilients
- **Hooks exposés** : `use{Feature}Query()`, `use{Feature}Mutation()`
- **MSW** : Mock Service Worker pour les tests et le développement - toujours fournir un mock en attendant que le vrai endpoint soit développé coté backend
- **Error boundaries** : Gestion gracieuse des erreurs

### **Functional Programming API Architecture**

#### **AuthenticatedApi - Composition Pattern**
```typescript
// Core: Function composition pour API calls
const makeAuthenticatedRequest = (config: Required<ApiConfig>) => 
  async <T>(endpoint: string, options: ApiOptions = {}): Promise<Result<T, AuthenticatedApiError>> => {
    // Pure function avec injection config + token
  };

// Higher-Order Functions pour HTTP methods
const withMethod = (method: string) => 
  (baseFn: ReturnType<typeof makeAuthenticatedRequest>) => 
    <T>(endpoint: string, token: string) =>
      baseFn<T>(endpoint, { method, token });

// Factory pattern pour instances configurées
export const createAuthenticatedApi = (userConfig: ApiConfig = {}) => {
  const config = { ...defaultConfig, ...userConfig };
  const baseRequest = makeAuthenticatedRequest(config);
  
  return {
    get: withMethod('GET')(baseRequest),
    post: withMethodAndBody('POST')(baseRequest),
    // ... autres méthodes HTTP par composition
  };
};

// Instance globale
export const api = createAuthenticatedApi();
```

#### **React Query Helpers - Functional Composition**
```typescript
// Helper pour queries - évite boilerplate dans hooks
export const createQueryFn = <T>(
  endpoint: string,
  getToken: () => Promise<string | null>
) => async (): Promise<T> => {
  const token = await getToken();
  if (!token) throw new Error('No authentication token available');
  
  const result = await api.get<T>(endpoint, token);
  if (result.isError()) {
    const error = result.getError();
    throw new Error(`${error.message}`);
  }
  return result.getValue();
};

// Helper pour mutations - composition réutilisable
export const createMutationFn = <T, D>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete',
  getToken: () => Promise<string | null>
) => async (data?: D): Promise<T> => {
  // Logic mutation avec error handling uniforme
};
```

#### **Usage dans Hooks - SoC Respectée**
```typescript
// Hook utilisant functional helpers
export const useStores = () => {
  const { getToken, isAuthenticated } = useVelocAuth();
  
  const query = useQuery({
    queryKey: ['stores'],
    queryFn: createQueryFn<Store[]>('/api/stores', getToken), // ✅ Composition FP
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    retry: 2
  });
  
  // Auto-selection business logic
  useEffect(() => {
    if (query.data && !currentStore) {
      setStores(query.data);
      setCurrentStoreByName(BERNAUDEAU_STORE_NAME);
    }
  }, [query.data, currentStore]);

  return {
    stores: query.data || [],
    currentStore,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    // ... actions
  };
};
```

#### **Principes Architecture API**
- **Pure Functions** : Pas d'effets de bord dans core functions
- **Composition over Inheritance** : HoF pour créer méthodes HTTP
- **Factory Pattern** : createAuthenticatedApi pour configuration
- **Separation of Concerns** : Core/Infrastructure/Presentation layers
- **Result Pattern** : Result<T, E> pour error handling fonctionnel

### **Clean Architecture Pattern pour SPA**

#### **Repository Pattern (Infrastructure)**
```typescript
// features/{feature}/api/{feature}Api.ts
export interface I{Feature}Repository {
  findById(id: number): Promise<{Feature}Response>;
}

export class {Feature}Repository implements I{Feature}Repository {
  async findById(id: number): Promise<{Feature}Response> {
    const response = await fetch(`/api/{feature}/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}

export const {feature}Repository = new {Feature}Repository();
```

#### **Application Service (Use Cases)**
```typescript
// features/{feature}/application/{Feature}Service.ts
export class {Feature}Service {
  constructor(private repository: I{Feature}Repository = {feature}Repository) {}

  async get{Feature}(id: number): Promise<Result<{Feature}Response, {Feature}Error>> {
    try {
      // Validation métier (Domain)
      if (!{Feature}Domain.validateId(id)) {
        return Result.failure(this.createError('VALIDATION_ERROR', 'ID invalide'));
      }

      // Délégation Infrastructure
      const data = await this.repository.findById(id);
      
      // Validation données (Domain)
      if (!data.id) {
        return Result.failure(this.createError('VALIDATION_ERROR', 'Données invalides'));
      }

      return Result.success(data);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const {feature}Service = new {Feature}Service();
```

#### **Hook minimaliste (Presentation)**
```typescript
// features/{feature}/hooks/use{Feature}.ts
export const use{Feature} = (id: number) => {
  const query = useQuery({
    queryKey: ['{feature}', id],
    queryFn: async () => {
      const result = await {feature}Service.get{Feature}(id);
      if (result.isError()) {
        throw new Error(result.getError().message);
      }
      return result.getValue();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  return {
    // Data (React Query gère l'état)
    data: query.data,
    {feature}: query.data || null,
    
    // State (React Query gère tout)
    isLoading: query.isLoading,
    error: query.error?.message || null,
    
    // Actions
    refetch: query.refetch
  };
};
```

### **MSW Setup (Futur)**
```typescript
// Dans src/mocks/
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// Dans handlers.ts
export const handlers = [
  rest.get('/api/feature', (req, res, ctx) => {
    return res(ctx.json(mockData));
  }),
];
```

## 🔧 Configuration & Tooling

### **Vite + TypeScript**
- **Config stricte** : `strict: true`, `noUnusedLocals: true`
- **Path mapping** : Alias pour les imports propres
- **Hot reload** : Développement rapide avec HMR

### **Structure de fichiers Clean Architecture**
```
src/
├── features/           # Feature slices (Clean Architecture)
│   ├── {feature}/
│   │   ├── domain/            # Logique métier pure (Domain Layer)
│   │   │   └── {Feature}Domain.ts
│   │   ├── application/       # Use Cases & Orchestration (Application Layer)
│   │   │   └── {Feature}Service.ts
│   │   ├── api/              # Repository & Infrastructure (Infrastructure Layer)
│   │   │   └── {feature}Api.ts
│   │   ├── hooks/            # Adapters React (Presentation Layer)
│   │   │   └── use{Feature}.ts
│   │   ├── components/       # UI React (Presentation Layer)
│   │   └── {feature}Types.ts # Types centralisés
├── store/             # Store global (seulement pour état partagé)
├── routes/            # TanStack Router
├── pages/             # Pages React
├── components/        # Composants partagés
├── hooks/             # Hooks globaux
└── core/              # Types/classes transverses (ex: Result)
```

### **Principes Clean Architecture SPA**
- **Domain** : Logique métier pure, aucune dépendance externe
- **Application** : Use cases, orchestration, coordination des flux
- **Infrastructure** : Repository pattern, appels API, persistence
- **Presentation** : Hooks React Query, composants UI, adapters
- **Une seule source de vérité** : React Query pour l'état serveur
- **Store minimal** : Seulement pour l'état applicatif vraiment partagé

## 🧪 Testing Strategy

- Pas de tests si je ne les demandes pas 
- Utiliser `Vitest`

### **Pattern de test recommandé**
```typescript
describe('{Feature}Service', () => {
  it('should perform action correctly', () => {
    const mockDependencies = { /* mocks */ };
    const result = performAction(state, action, mockDependencies);
    
    expect(result.nextState).toEqual(expectedState);
    expect(result.events).toContainEqual(expectedEvent);
  });
});
```

## 🚀 Performance & Optimisation

### **Memoization**
- **React.memo** : Pour les composants coûteux
- **useMemo/useCallback** : Pour les calculs et callbacks
- **Zustand selectors** : Sélection fine pour éviter les re-renders

### **Code Splitting**
- **TanStack Router** : Auto-code splitting par route
- **Lazy loading** : Composants chargés à la demande
- **Bundle analysis** : Monitoring de la taille des bundles

## 🔄 Workflow de Développement

### **Nouvelle Feature**
1. **Créer le dossier** : `src/features/{feature}/`
2. **Définir les types** : `{feature}Types.ts`
3. **Implémenter le domaine** : `domain/` (logique pure)
4. **Créer le service** : `application/` (orchestration)
5. **Ajouter le slice** : `slices/` (état Zustand)
6. **Développer l'UI** : `components/` (React)
7. **Tester** : Tests unitaires et d'intégration

### **Modification d'une Feature**
1. **Commencer par le domaine** : Logique métier d'abord
2. **Propager les changements** : Domain → Application → Slice → UI
3. **Maintenir la cohérence** : Types, événements, tests
4. **Documenter** : ADR si changement architectural

### **Debugging**
- **Zustand DevTools** : Inspection du state
- **Event logging** : Traçage des événements
- **React DevTools** : Profiling des composants
- **Console warnings** : Gestion d'erreurs gracieuse

## 📚 Bonnes Pratiques

### **Code Quality**
- **Type safety** : TypeScript strict partout
- **Immutabilité** : Jamais de mutation directe
- **Composition** : Préférer la composition à l'héritage
- **Single Responsibility** : Une fonction = une responsabilité

### **Naming Conventions**
- **Features** : `camelCase` (ex: `battle`, `roster`)
- **Types** : `PascalCase` (ex: `BattleState`, `SysBeast`)
- **Functions** : `camelCase` (ex: `performAction`, `createSlice`)
- **Constants** : `UPPER_SNAKE_CASE` (ex: `VIS_RADIUS`)

### **Documentation**
- **ADR** : Architecture Decision Records pour les décisions importantes

### **Error Handling**
- **Graceful degradation** : L'application continue de fonctionner
- **User feedback** : Messages d'erreur clairs
- **Logging** : Traçage des erreurs pour le debugging
- **Recovery** : Mécanismes de récupération automatique

---

**Note** : Ces guidelines évoluent avec le projet. Consultez les ADR pour les décisions architecturales spécifiques et adaptez ces guidelines selon les besoins du projet. 
