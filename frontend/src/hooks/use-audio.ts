import { useAudioStore } from '@/store/audio-store'

// Legacy Web Audio API hook - deprecated in favor of use-howler-audio
export const useAudio = () => {
  const { isPlaying, currentTrack, volume, eqPreset } = useAudioStore()
  
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