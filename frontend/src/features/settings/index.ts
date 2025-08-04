// =============================================================================
// SETTINGS FEATURE - Export centralisé
// =============================================================================

// Types
export type * from './settingsTypes'

// Slice
export { createSettingsSlice, subscribeSettingsSystem } from './slices/settingsSlice'

// Hooks façades (pour migration progressive)
// Ces hooks servent de façade vers useAppStore
// À utiliser depuis les composants React