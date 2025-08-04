// =============================================================================
// AUDIO HOOK - Façade vers useAppStore (deprecated)
// =============================================================================

import { useAppStore } from '@/store/useAppStore'

// Legacy Web Audio API hook - deprecated in favor of useHowlerAudio
export const useAudio = () => {
  const isPlaying = useAppStore(state => state.isPlaying)
  const currentTrack = useAppStore(state => state.currentTrack)
  const volume = useAppStore(state => state.volume)
  const eqPreset = useAppStore(state => state.eqPreset)
  
  // Return minimal interface for backward compatibility
  return {
    isPlaying,
    currentTrack,
    volume,
    eqPreset,
    // Deprecated functions - use useHowlerAudio instead
    loadAudio: () => console.warn('useAudio is deprecated, use useHowlerAudio'),
    play: () => console.warn('useAudio is deprecated, use useHowlerAudio'),
    pause: () => console.warn('useAudio is deprecated, use useHowlerAudio'),
    stop: () => console.warn('useAudio is deprecated, use useHowlerAudio'),
    seek: () => console.warn('useAudio is deprecated, use useHowlerAudio'),
  }
}