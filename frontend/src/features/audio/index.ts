// =============================================================================
// AUDIO FEATURE - Export centralisé
// =============================================================================

// Types
export type * from './audioTypes'

// Slice
export { createAudioSlice, subscribeAudioSystem } from './slices/audioSlice'

// Hooks façades (pour migration progressive)
// Ces hooks servent de façade vers useAppStore
// À utiliser depuis les composants React
export { useAudio } from './hooks/useAudio'
export { useHowlerAudio } from './hooks/useHowlerAudio'
export { usePlaylist } from './hooks/usePlaylist'