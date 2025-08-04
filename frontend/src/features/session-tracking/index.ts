// =============================================================================
// SESSION TRACKING FEATURE - Export centralisé
// =============================================================================

// Types
export type * from './sessionTypes'

// Slice
export { createSessionTrackingSlice, subscribeSessionTrackingSystem } from './slices/sessionSlice'

// Hooks façades (pour migration progressive)
// Ces hooks servent de façade vers useAppStore
// À utiliser depuis les composants React