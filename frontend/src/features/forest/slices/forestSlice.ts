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
  // Evolution stages based on session progress
  evolutionStage: 'seed' | 'bush' | 'tree' // seed -> bush (mid-session) -> tree (completed)
  sessionProgress?: number // 0-1, current session progress (for active sessions)
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
  updateActiveSessionProgress: (sessionId: string, progress: number) => void
  
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
    // Ensure minimum distance from center (where character spawns)
    let spiralRadius = Math.max(4, Math.sqrt(sessionIndex) * 2) // Minimum 4 units from center
    let angle = normalizedHash * Math.PI * 2 + sessionIndex * 0.618 // golden ratio for nice distribution
    
    let x = Math.cos(angle) * spiralRadius
    let z = Math.sin(angle) * spiralRadius
    
    // Add some variation based on session duration
    const durationVariation = (session.duration / 3600) * 2 // max 2 units variation for 1 hour
    x += (normalizedHash - 0.5) * durationVariation
    z += ((hash % 1000) / 1000 - 0.5) * durationVariation
    
    // Ensure minimum distance from other trees AND from center (character spawn)
    let attempts = 0
    while (attempts < 50) {
      const tooCloseToTrees = existingTrees.some(tree => {
        const dx = tree.position.x - x
        const dz = tree.position.z - z
        return Math.sqrt(dx * dx + dz * dz) < minDistance
      })
      
      // Also check distance from center (0,0,0) where character spawns
      const distanceFromCenter = Math.sqrt(x * x + z * z)
      const tooCloseToCenter = distanceFromCenter < 3 // Minimum 3 units from center
      
      if (!tooCloseToTrees && !tooCloseToCenter) break
      
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
  
  /**
   * Determine tree evolution stage based on session status and progress
   * seed: session started (0-50% progress)
   * bush: session mid-way (50-100% progress) 
   * tree: session completed
   */
  static determineEvolutionStage(session: TrackedSession, sessionProgress?: number): 'seed' | 'bush' | 'tree' {
    if (session.completed) {
      return 'tree'
    }
    
    // For active sessions, use progress
    if (sessionProgress !== undefined) {
      return sessionProgress >= 0.5 ? 'bush' : 'seed'
    }
    
    // For incomplete sessions without progress, assume early stage
    return 'seed'
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
    
    // Check if this is an active session by looking at app state
    const appState = get()
    const isActiveSession = appState.currentSession?.id === session.id
    const sessionProgress = isActiveSession && appState.currentSession ? 
      1 - (appState.timerCurrentTime / (appState.currentSession.plannedDuration * 60)) : undefined
    
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
      health: ForestDomain.calculateTreeHealth(session),
      evolutionStage: ForestDomain.determineEvolutionStage(session, sessionProgress),
      sessionProgress: sessionProgress
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
  },
  
  // Update active session progress (called from timer system)
  updateActiveSessionProgress: (sessionId: string, progress: number) => {
    const trees = get().trees
    const treeIndex = trees.findIndex(tree => tree.sessionId === sessionId)
    
    if (treeIndex !== -1) {
      // const currentTree = trees[treeIndex] // For future use
      const session = get().sessions?.find(s => s.id === sessionId)
      
      if (session) {
        const newStage = ForestDomain.determineEvolutionStage(session, progress)
        
        set(state => ({
          trees: state.trees.map((tree, index) => 
            index === treeIndex ? {
              ...tree,
              sessionProgress: progress,
              evolutionStage: newStage
            } : tree
          )
        }))
      }
    }
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
  
  // Créer immédiatement un arbre seed quand une session démarre
  if (latestEvent.type === 'timer_started') {
    console.log('Forest: Timer started, creating seed tree...')
    // Create a temporary session object for the tree
    const currentSession = state.currentSession
    if (currentSession) {
      const tempSession = {
        id: currentSession.id,
        date: new Date().toISOString().split('T')[0],
        startTime: currentSession.startTime,
        endTime: currentSession.startTime, // Will be updated when completed
        duration: 0, // Will be updated as session progresses
        plannedDuration: currentSession.plannedDuration,
        mode: currentSession.mode,
        completed: false
      }
      
      // Check if tree already exists
      const existingTree = state.trees.find(tree => tree.sessionId === currentSession.id)
      if (!existingTree) {
        const newTree = state.transformSessionToTree(tempSession)
        state.addTree(newTree)
      }
    }
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
  
  // Mettre à jour le progrès des sessions actives
  if (latestEvent.type === 'timer_tick') {
    const currentSession = state.currentSession
    if (currentSession) {
      const plannedDurationSeconds = currentSession.plannedDuration * 60
      const progress = 1 - (state.timerCurrentTime / plannedDurationSeconds)
      state.updateActiveSessionProgress(currentSession.id, progress)
    }
  }
}