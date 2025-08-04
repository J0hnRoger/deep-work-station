// =============================================================================
// AUDIO FEATURE TYPES
// =============================================================================

export interface AudioTrack {
  id: string
  title: string
  url: string
  duration?: number
  artist?: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  tracks: AudioTrack[]
  category?: 'focus' | 'break' | 'ambient' | 'classical'
}

export type EQPreset = 'neutral' | 'light' | 'boost'

export interface AudioState {
  // Playback state
  isPlaying: boolean
  isPaused: boolean
  currentTrack: AudioTrack | null
  currentTime: number // secondes
  duration: number // secondes
  
  // Playlist management
  currentPlaylist: Playlist | null
  playlists: Playlist[]
  shuffleMode: boolean
  repeatMode: 'none' | 'one' | 'all'
  
  // Audio settings
  volume: number // 0-100
  eqPreset: EQPreset
  crossfadeDuration: number // secondes
  gaplessPlayback: boolean
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Auto-sync avec Timer
  autoPlayOnTimerStart: boolean
  autoPauseOnTimerPause: boolean
  autoStopOnTimerComplete: boolean
  focusPlaylistId: string | null
  breakPlaylistId: string | null
}

// Audio Actions Types
export interface AudioActions {
  // Playback controls
  play: () => void
  pause: () => void
  stop: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  
  // Volume controls
  setVolume: (volume: number) => void
  mute: () => void
  unmute: () => void
  
  // Playlist management
  setCurrentPlaylist: (playlist: Playlist) => void
  addPlaylist: (playlist: Playlist) => void
  removePlaylist: (playlistId: string) => void
  setPlaylists: (playlists: Playlist[]) => void
  
  // Track management
  setCurrentTrack: (track: AudioTrack) => void
  updateCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  
  // Settings
  setEQPreset: (preset: EQPreset) => void
  setShuffleMode: (enabled: boolean) => void
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void
  setCrossfadeDuration: (duration: number) => void
  setGaplessPlayback: (enabled: boolean) => void
  
  // Auto-sync settings
  setAutoPlayOnTimerStart: (enabled: boolean) => void
  setAutoPauseOnTimerPause: (enabled: boolean) => void
  setAutoStopOnTimerComplete: (enabled: boolean) => void
  setFocusPlaylistId: (playlistId: string) => void
  setBreakPlaylistId: (playlistId: string) => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Audio Domain Logic
export class AudioDomain {
  static calculateProgress(currentTime: number, duration: number): number {
    if (duration === 0) return 0
    return Math.max(0, Math.min(100, (currentTime / duration) * 100))
  }
  
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  static getNextTrackIndex(
    currentIndex: number, 
    playlistLength: number, 
    shuffleMode: boolean,
    repeatMode: 'none' | 'one' | 'all'
  ): number | null {
    if (repeatMode === 'one') {
      return currentIndex
    }
    
    if (shuffleMode) {
      const availableIndices = Array.from({ length: playlistLength }, (_, i) => i)
        .filter(i => i !== currentIndex)
      return availableIndices[Math.floor(Math.random() * availableIndices.length)] ?? null
    }
    
    const nextIndex = currentIndex + 1
    if (nextIndex >= playlistLength) {
      return repeatMode === 'all' ? 0 : null
    }
    
    return nextIndex
  }
  
  static getPreviousTrackIndex(
    currentIndex: number, 
    playlistLength: number, 
    shuffleMode: boolean
  ): number | null {
    if (shuffleMode) {
      const availableIndices = Array.from({ length: playlistLength }, (_, i) => i)
        .filter(i => i !== currentIndex)
      return availableIndices[Math.floor(Math.random() * availableIndices.length)] ?? null
    }
    
    const prevIndex = currentIndex - 1
    return prevIndex < 0 ? playlistLength - 1 : prevIndex
  }
  
  static shouldAutoSwitchPlaylist(
    timerEvent: 'started' | 'break_started' | 'completed',
    focusPlaylistId: string | null,
    breakPlaylistId: string | null
  ): string | null {
    switch (timerEvent) {
      case 'started':
        return focusPlaylistId
      case 'break_started':
        return breakPlaylistId
      case 'completed':
        return null // Arrêter la musique
      default:
        return null
    }
  }
}

// Combined Audio Slice Type
export interface AudioSlice extends AudioState, AudioActions {}