import type { DeepWorkEvent } from "@/core/messaging/deepWorkEventTypes"
import type { AppStore } from "@/store"
import type { StateCreator } from "zustand"
import type { TrackedSession } from "@/features/session-tracking/sessionTypes"

// Enhanced tree interface with session metadata
export interface ForestTree {
  id: string // Matches session ID
  position: {
    x: number
    y: number
    z: number
  }
  // Session-derived properties
  sessionId: string
  duration: number // minutes
  mode: 'pomodoro' | 'deep-work' | 'custom'
  completed: boolean
  quality?: 'low' | 'medium' | 'high'
  plantedDate: string // YYYY-MM-DD
  // Tree visualization properties
  treeType: 'oak' | 'pine' | 'birch' | 'willow'
  scale: number // based on session duration
  health: number // 0-1, based on completion and quality
}

export interface ForestState {
  trees: ForestTree[]
  // Placement algorithm settings
  forestSize: number // radius of the forest
  minTreeDistance: number // minimum distance between trees
  lastUpdateTime: number // timestamp of last sync with sessions
}

export interface ForestActions {
  // Session-to-tree transformation (ACL methods)
  syncWithSessions: () => void
  transformSessionToTree: (session: TrackedSession) => ForestTree
  updateTreeFromSession: (sessionId: string) => void
  
  // Tree management
  addTree: (tree: ForestTree) => void
  removeTree: (id: string) => void
  clearTrees: () => void
  
  // Forest settings
  setForestSize: (size: number) => void
  setMinTreeDistance: (distance: number) => void
}

export type ForestSlice = ForestState & ForestActions 

// Forest Domain Logic for session-to-tree transformation
export class ForestDomain {
  /**
   * Deterministic position algorithm based on session properties
   */
  static calculateTreePosition(session: TrackedSession, existingTrees: ForestTree[], forestSize: number, minDistance: number): { x: number; y: number; z: number } {
    // Use session properties to create deterministic but seemingly random placement
    const hash = ForestDomain.hashString(session.id)
    const normalizedHash = hash / 2147483647 // normalize to 0-1
    
    // Create spiral placement based on session count and hash
    const sessionIndex = existingTrees.length
    let spiralRadius = Math.sqrt(sessionIndex) * 2
    let angle = normalizedHash * Math.PI * 2 + sessionIndex * 0.618 // golden ratio for nice distribution
    
    let x = Math.cos(angle) * spiralRadius
    let z = Math.sin(angle) * spiralRadius
    
    // Add some variation based on session duration
    const durationVariation = (session.duration / 3600) * 2 // max 2 units variation for 1 hour
    x += (normalizedHash - 0.5) * durationVariation
    z += ((hash % 1000) / 1000 - 0.5) * durationVariation
    
    // Ensure minimum distance from other trees
    let attempts = 0
    while (attempts < 50) {
      const tooClose = existingTrees.some(tree => {
        const dx = tree.position.x - x
        const dz = tree.position.z - z
        return Math.sqrt(dx * dx + dz * dz) < minDistance
      })
      
      if (!tooClose) break
      
      // Adjust position
      angle += 0.1
      spiralRadius += 0.5
      x = Math.cos(angle) * spiralRadius
      z = Math.sin(angle) * spiralRadius
      attempts++
    }
    
    // Clamp to forest bounds
    const maxRadius = forestSize / 2
    const distance = Math.sqrt(x * x + z * z)
    if (distance > maxRadius) {
      x = (x / distance) * maxRadius
      z = (z / distance) * maxRadius
    }
    
    return { x, y: 0, z }
  }
  
  /**
   * Simple hash function for deterministic positioning
   */
  static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }
  
  /**
   * Determine tree type based on session properties
   */
  static determineTreeType(session: TrackedSession): ForestTree['treeType'] {
    switch (session.mode) {
      case 'deep-work':
        return 'oak' // Strong, long-lasting sessions
      case 'pomodoro':
        return 'birch' // Quick, focused sessions
      case 'custom':
        return session.duration > 2400 ? 'pine' : 'willow' // > 40min = pine, else willow
      default:
        return 'oak'
    }
  }
  
  /**
   * Calculate tree scale based on session duration
   */
  static calculateTreeScale(session: TrackedSession): number {
    const baseDuration = 1500 // 25 minutes in seconds
    const scale = Math.max(0.5, Math.min(2.0, session.duration / baseDuration))
    return session.completed ? scale : scale * 0.7 // Incomplete sessions are smaller
  }
  
  /**
   * Calculate tree health based on completion and quality
   */
  static calculateTreeHealth(session: TrackedSession): number {
    let health = session.completed ? 1.0 : 0.4
    
    if (session.quality) {
      switch (session.quality) {
        case 'high': health = Math.min(1.0, health * 1.2); break
        case 'medium': health = health; break
        case 'low': health = health * 0.8; break
      }
    }
    
    return Math.max(0.1, Math.min(1.0, health))
  }
}

const initialForestState: ForestState = {
  trees: [],
  forestSize: 50,
  minTreeDistance: 3,
  lastUpdateTime: 0
}

export const createForestSlice: StateCreator<AppStore, [], [], ForestSlice> = (set, get) => ({
  ...initialForestState,
  
  // ACL: Session-to-tree transformation methods
  syncWithSessions: () => {
    const appState = get()
    const sessions = appState.sessions || []
    const currentTrees = get().trees
    
    // Find sessions that don't have trees yet
    const newSessions = sessions.filter(session => 
      !currentTrees.some(tree => tree.sessionId === session.id)
    )
    
    // Transform new sessions to trees
    const newTrees = newSessions.map(session => get().transformSessionToTree(session))
    
    if (newTrees.length > 0) {
      set(state => ({
        trees: [...state.trees, ...newTrees],
        lastUpdateTime: Date.now()
      }))
    }
  },
  
  transformSessionToTree: (session: TrackedSession): ForestTree => {
    const currentTrees = get().trees
    const forestSize = get().forestSize
    const minDistance = get().minTreeDistance
    
    return {
      id: `tree_${session.id}`,
      sessionId: session.id,
      position: ForestDomain.calculateTreePosition(session, currentTrees, forestSize, minDistance),
      duration: Math.round(session.duration / 60), // convert to minutes
      mode: session.mode,
      completed: session.completed,
      quality: session.quality,
      plantedDate: session.date,
      treeType: ForestDomain.determineTreeType(session),
      scale: ForestDomain.calculateTreeScale(session),
      health: ForestDomain.calculateTreeHealth(session)
    }
  },
  
  updateTreeFromSession: (sessionId: string) => {
    const appState = get()
    const session = appState.sessions?.find(s => s.id === sessionId)
    if (!session) return
    
    const existingTreeIndex = get().trees.findIndex(tree => tree.sessionId === sessionId)
    if (existingTreeIndex === -1) {
      // Create new tree if it doesn't exist
      const newTree = get().transformSessionToTree(session)
      set(state => ({
        trees: [...state.trees, newTree]
      }))
    } else {
      // Update existing tree
      const updatedTree = get().transformSessionToTree(session)
      set(state => ({
        trees: state.trees.map((tree, index) => 
          index === existingTreeIndex ? { ...updatedTree, position: tree.position } : tree
        )
      }))
    }
  },
  
  // Tree management
  addTree: (tree: ForestTree) => {
    set(state => ({
      trees: [...state.trees, tree]
    }))
  },
  
  removeTree: (id: string) => {
    set(state => ({
      trees: state.trees.filter(tree => tree.id !== id)
    }))
  },
  
  clearTrees: () => {
    set({ trees: [], lastUpdateTime: Date.now() })
  },
  
  // Forest settings
  setForestSize: (size: number) => {
    set({ forestSize: size })
  },
  
  setMinTreeDistance: (distance: number) => {
    set({ minTreeDistance: distance })
  }
})

/**
 * Fonction d'abonnement aux événements pour le système Forest
 * Synchronise automatiquement les sessions avec les arbres de la forêt
 */
export function subscribeForestSystem(
  events: DeepWorkEvent[], 
  state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]
  if (!latestEvent) return
  
  // Synchroniser avec les sessions quand une nouvelle session est ajoutée
  if (latestEvent.type === 'session_added') {
    console.log('Forest: New session added, syncing trees...')
    state.syncWithSessions()
  }
  
  // Synchroniser aussi quand une session est mise à jour
  if (latestEvent.type === 'session_updated') {
    console.log('Forest: Session updated, updating tree...')
    const sessionId = latestEvent.payload.sessionId
    if (sessionId) {
      state.updateTreeFromSession(sessionId)
    }
  }
  
  // Synchroniser quand une session timer est complétée
  if (latestEvent.type === 'timer_completed') {
    console.log('Forest: Timer completed, will sync trees on next session_added event')
    // The timer will trigger session_added, so we'll sync then
  }
}