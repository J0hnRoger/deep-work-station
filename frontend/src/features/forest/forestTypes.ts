// =============================================================================
// FOREST FEATURE TYPES - Types et interfaces pour la scène 3D forêt
// =============================================================================

export type TreeSize = 'seed' | 'bush' | 'tree'
export type ForestMode = 'timer' | 'exploration'

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface TreeData {
  id: string
  sessionId?: string // Pour les vrais arbres issus de sessions
  position: Vector3
  size: TreeSize
  rotation: number // Rotation Y en radians
  metadata: {
    title: string
    duration: number // en minutes
    date: string
    type?: 'pomodoro' | 'deep-work' | 'custom'
  }
}

export interface CameraState {
  position: Vector3
  target: Vector3
  rotation: {
    yaw: number // Rotation horizontale
    pitch: number // Rotation verticale
  }
}

export interface ForestState {
  // Mode et état de la scène
  mode: ForestMode
  isSceneLoaded: boolean
  isFirstVisit: boolean
  
  // Données des arbres
  trees: TreeData[]
  treeCount: number
  
  // État caméra persisté
  cameraState: CameraState
  
  // Zone de placement
  worldRadius: number
  gridSize: number
  
  // UI
  showControls: boolean
  showWelcomeMessage: boolean
}

export interface ForestActions {
  // Mode management
  setMode: (mode: ForestMode) => void
  setSceneLoaded: (loaded: boolean) => void
  setFirstVisit: (isFirst: boolean) => void
  
  // Tree management
  addTree: (tree: Omit<TreeData, 'id'>) => void
  plantTreeFromSession: (sessionData: { title: string; duration: number; date: string; type?: string }) => void
  clearAllTrees: () => void
  
  // Camera management
  updateCameraState: (state: Partial<CameraState>) => void
  resetCameraState: () => void
  
  // UI management
  setShowControls: (show: boolean) => void
  setShowWelcomeMessage: (show: boolean) => void
  
  // Initialization
  initializeForest: () => void
  generateMockTrees: () => void
}

export interface ForestSlice extends ForestState, ForestActions {}

// Domaine Forest - logique métier et utilitaires
export class ForestDomain {
  // Constantes
  static readonly DEFAULT_WORLD_RADIUS = 50
  static readonly DEFAULT_GRID_SIZE = 5
  static readonly MIN_TREE_DISTANCE = 8
  
  // Mapping durée → taille d'arbre
  static getTreeSizeFromDuration(durationMinutes: number): TreeSize {
    if (durationMinutes < 15) return 'seed'
    if (durationMinutes < 45) return 'bush'
    return 'tree'
  }
  
  // Génération d'ID unique pour arbre
  static generateTreeId(): string {
    return `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Position aléatoire dans la grille avec évitement d'overlap
  static generateTreePosition(
    existingTrees: TreeData[], 
    worldRadius: number = ForestDomain.DEFAULT_WORLD_RADIUS,
    seed?: string
  ): Vector3 {
    const maxAttempts = 20
    let attempts = 0
    
    // Utiliser seed pour randomness déterministe si fourni
    const random = seed ? this.seededRandom(seed) : Math.random
    
    while (attempts < maxAttempts) {
      // Position aléatoire dans un cercle
      const angle = random() * Math.PI * 2
      const radius = Math.sqrt(random()) * worldRadius * 0.8 // 80% du rayon pour éviter les bords
      
      const position: Vector3 = {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius
      }
      
      // Vérifier distance minimale avec autres arbres
      const tooClose = existingTrees.some(tree => 
        this.distance2D(position, tree.position) < ForestDomain.MIN_TREE_DISTANCE
      )
      
      if (!tooClose) {
        return position
      }
      
      attempts++
    }
    
    // Si impossible de placer, position par défaut
    return { x: 0, y: 0, z: 0 }
  }
  
  // Distance 2D entre deux points
  static distance2D(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x
    const dz = pos1.z - pos2.z
    return Math.sqrt(dx * dx + dz * dz)
  }
  
  // Random seeded (pour placement déterministe)
  static seededRandom(seed: string): () => number {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return function() {
      hash = ((hash * 9301 + 49297) % 233280)
      return hash / 233280
    }
  }
  
  // Rotation aléatoire pour variété visuelle
  static generateTreeRotation(seed?: string): number {
    const random = seed ? this.seededRandom(seed + '_rotation')() : Math.random()
    return random * Math.PI * 2 // 0 à 2π radians
  }
  
  // Génération données factices pour tests
  static generateMockTreeData(): Omit<TreeData, 'id'>[] {
    const mockSessions = [
      { title: 'Deep Work Session', duration: 25, date: '2024-01-15', type: 'pomodoro' },
      { title: 'Focus Time', duration: 45, date: '2024-01-14', type: 'deep-work' },
      { title: 'Learning Rust', duration: 15, date: '2024-01-13', type: 'custom' }
    ]
    
    const trees: Omit<TreeData, 'id'>[] = []
    
    mockSessions.forEach((session, index) => {
      const position = this.generateTreePosition([], this.DEFAULT_WORLD_RADIUS, `mock_${index}`)
      const size = this.getTreeSizeFromDuration(session.duration)
      const rotation = this.generateTreeRotation(`mock_${index}`)
      
      trees.push({
        sessionId: `mock_session_${index}`,
        position,
        size,
        rotation,
        metadata: {
          title: session.title,
          duration: session.duration,
          date: session.date,
          type: session.type as any
        }
      })
    })
    
    return trees
  }
}

// États par défaut
export const DEFAULT_CAMERA_STATE: CameraState = {
  position: { x: 0, y: 5, z: 15 },
  target: { x: 0, y: 0, z: 0 },
  rotation: {
    yaw: 0,
    pitch: -0.1 // Légèrement vers le bas
  }
}

export const DEFAULT_FOREST_STATE: ForestState = {
  mode: 'timer',
  isSceneLoaded: false,
  isFirstVisit: true,
  trees: [],
  treeCount: 0,
  cameraState: DEFAULT_CAMERA_STATE,
  worldRadius: ForestDomain.DEFAULT_WORLD_RADIUS,
  gridSize: ForestDomain.DEFAULT_GRID_SIZE,
  showControls: false,
  showWelcomeMessage: true
}