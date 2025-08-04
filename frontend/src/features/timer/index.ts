// =============================================================================
// TIMER FEATURE - Export centralisé
// =============================================================================

// Types
export type * from './timerTypes'

// Slice
export { createTimerSlice, subscribeTimerSystem } from './slices/timerSlice'

// Hooks façades (pour migration progressive)
// Ces hooks servent de façade vers useAppStore
// À utiliser depuis les composants React
export { useTimer } from './hooks/useTimer'