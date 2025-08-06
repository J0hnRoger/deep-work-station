// =============================================================================
// AUDIO SLICE - Zustand slice pour la feature Audio
// =============================================================================

import type { StateCreator } from 'zustand'
import { AudioDomain } from '../audioTypes'
import type { AudioSlice } from '../audioTypes'
import type { DeepWorkEvent } from '@/core/messaging/deepWorkEventTypes'
import type { AppStore } from '@/store/useAppStore'

const initialState = {
  // Playback state
  isPlaying: false,
  isPaused: false,
  currentTrack: null,
  currentTime: 0,
  duration: 0,
  
  // Playlist management
  currentPlaylist: null,
  playlists: [],
  shuffleMode: false,
  repeatMode: 'none' as const,
  
  // Audio settings
  volume: 70,
  eqPreset: 'neutral' as const,
  crossfadeDuration: 3,
  gaplessPlayback: true,
  
  // Loading states
  isLoading: false,
  error: null,
  
  // Auto-sync avec Timer
  autoPlayOnTimerStart: true,
  autoPauseOnTimerPause: true,
  autoStopOnTimerComplete: false,
  focusPlaylistId: null,
  breakPlaylistId: null,
  
  // Timer-specific loop behavior
  loopDuringTimer: true, // Loop audio during timer by default
  originalRepeatMode: null
}

export const createAudioSlice: StateCreator<AppStore, [], [], AudioSlice> = (set, get) => ({
  ...initialState,
  
  // Audio Actions
  play: () => {
    set({ isPlaying: true, isPaused: false })
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'audio_play',
      payload: {},
      timestamp: Date.now(),
      id: `audio_play_${Date.now()}`
    })
  },
  
  pause: () => {
    set({ isPlaying: false, isPaused: true })
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'audio_pause',
      payload: {},
      timestamp: Date.now(),
      id: `audio_pause_${Date.now()}`
    })
  },
  
  stop: () => {
    set({ 
      isPlaying: false, 
      isPaused: false, 
      currentTime: 0 
    })
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'audio_stop',
      payload: {},
      timestamp: Date.now(),
      id: `audio_stop_${Date.now()}`
    })
  },
  
  next: () => {
    const state = get()
    if (!state.currentPlaylist || !state.currentTrack) return
    
    // Stop current playback to avoid double audio
    const wasPlaying = state.isPlaying
    if (wasPlaying) {
      console.log('Audio: Stopping playback for track change (next)')
      set({ isPlaying: false, isPaused: false })
    }
    
    const currentIndex = state.currentPlaylist.tracks.findIndex(
      track => track.id === state.currentTrack?.id
    )
    
    const nextIndex = AudioDomain.getNextTrackIndex(
      currentIndex,
      state.currentPlaylist.tracks.length,
      state.shuffleMode,
      state.repeatMode
    )
    
    if (nextIndex !== null) {
      const nextTrack = state.currentPlaylist.tracks[nextIndex]
      console.log('Audio: Changing to next track:', nextTrack.title, wasPlaying ? '(auto-resume)' : '(stopped)')
      set({ 
        currentTrack: nextTrack, 
        currentTime: 0,
        // Resume playback if it was playing before
        isPlaying: wasPlaying,
        isPaused: false
      })
      
      // Dispatch event
      get().dispatchGlobalEvent({
        type: 'audio_track_changed',
        payload: { trackId: nextTrack.id, direction: 'next' },
        timestamp: Date.now(),
        id: `audio_next_${Date.now()}`
      })
    }
  },
  
  previous: () => {
    const state = get()
    if (!state.currentPlaylist || !state.currentTrack) return
    
    // Stop current playback to avoid double audio
    const wasPlaying = state.isPlaying
    if (wasPlaying) {
      console.log('Audio: Stopping playback for track change (previous)')
      set({ isPlaying: false, isPaused: false })
    }
    
    const currentIndex = state.currentPlaylist.tracks.findIndex(
      track => track.id === state.currentTrack?.id
    )
    
    const prevIndex = AudioDomain.getPreviousTrackIndex(
      currentIndex,
      state.currentPlaylist.tracks.length,
      state.shuffleMode
    )
    
    if (prevIndex !== null) {
      const prevTrack = state.currentPlaylist.tracks[prevIndex]
      console.log('Audio: Changing to previous track:', prevTrack.title, wasPlaying ? '(auto-resume)' : '(stopped)')
      set({ 
        currentTrack: prevTrack, 
        currentTime: 0,
        // Resume playback if it was playing before
        isPlaying: wasPlaying,
        isPaused: false
      })
      
      // Dispatch event
      get().dispatchGlobalEvent({
        type: 'audio_track_changed',
        payload: { trackId: prevTrack.id, direction: 'previous' },
        timestamp: Date.now(),
        id: `audio_prev_${Date.now()}`
      })
    }
  },
  
  seek: (time) => {
    set({ currentTime: Math.max(0, Math.min(time, get().duration)) })
  },
  
  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(100, volume)) })
  },
  
  mute: () => {
    set({ volume: 0 })
  },
  
  unmute: () => {
    set({ volume: 70 }) // Default volume
  },
  
  setCurrentPlaylist: (playlist) => {
    const state = get()
    
    // Stop current playback to avoid double audio when switching playlists
    const wasPlaying = state.isPlaying
    if (wasPlaying) {
      set({ isPlaying: false, isPaused: false })
    }
    
    set({ 
      currentPlaylist: playlist,
      currentTrack: playlist.tracks[0] || null,
      currentTime: 0,
      // Resume playback if it was playing before
      isPlaying: wasPlaying && playlist.tracks.length > 0,
      isPaused: false
    })
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'audio_playlist_changed',
      payload: { playlistId: playlist.id },
      timestamp: Date.now(),
      id: `playlist_change_${Date.now()}`
    })
  },
  
  addPlaylist: (playlist) => {
    set(state => ({
      playlists: [...state.playlists, playlist]
    }))
  },
  
  removePlaylist: (playlistId) => {
    set(state => ({
      playlists: state.playlists.filter(p => p.id !== playlistId)
    }))
  },
  
  setPlaylists: (playlists) => {
    set({ playlists })
  },
  
  setCurrentTrack: (track) => {
    const state = get()
    
    // Stop current playback to avoid double audio when manually changing tracks
    const wasPlaying = state.isPlaying
    if (wasPlaying) {
      set({ isPlaying: false, isPaused: false })
    }
    
    set({ 
      currentTrack: track, 
      currentTime: 0,
      // Resume playback if it was playing before
      isPlaying: wasPlaying && track !== null,
      isPaused: false
    })
  },
  
  updateCurrentTime: (time) => {
    set({ currentTime: time })
  },
  
  setDuration: (duration) => {
    set({ duration })
  },
  
  setEQPreset: (preset) => {
    set({ eqPreset: preset })
  },
  
  setShuffleMode: (enabled) => {
    set({ shuffleMode: enabled })
  },
  
  setRepeatMode: (mode) => {
    set({ repeatMode: mode })
  },
  
  setCrossfadeDuration: (duration) => {
    set({ crossfadeDuration: Math.max(0.5, Math.min(10, duration)) })
  },
  
  setGaplessPlayback: (enabled) => {
    set({ gaplessPlayback: enabled })
  },
  
  setAutoPlayOnTimerStart: (enabled) => {
    set({ autoPlayOnTimerStart: enabled })
  },
  
  setAutoPauseOnTimerPause: (enabled) => {
    set({ autoPauseOnTimerPause: enabled })
  },
  
  setAutoStopOnTimerComplete: (enabled) => {
    set({ autoStopOnTimerComplete: enabled })
  },
  
  setFocusPlaylistId: (playlistId) => {
    set({ focusPlaylistId: playlistId })
  },
  
  setBreakPlaylistId: (playlistId) => {
    set({ breakPlaylistId: playlistId })
  },
  
  setLoopDuringTimer: (enabled) => {
    set({ loopDuringTimer: enabled })
  },
  
  enableTimerLoop: () => {
    const state = get()
    if (state.loopDuringTimer) {
      // Save current repeat mode and switch to 'all' for looping
      set({ 
        originalRepeatMode: state.repeatMode,
        repeatMode: 'all' 
      })
      console.log('Audio: Timer loop enabled (repeatMode: all)')
    }
  },
  
  disableTimerLoop: () => {
    const state = get()
    if (state.originalRepeatMode !== null) {
      // Restore original repeat mode
      set({ 
        repeatMode: state.originalRepeatMode,
        originalRepeatMode: null 
      })
      console.log('Audio: Timer loop disabled, restored repeatMode:', state.originalRepeatMode)
    }
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
  
  setError: (error) => {
    set({ error, isLoading: false })
  },
  
  // Handle track end during timer - automatically loop or go to next
  onTrackEnd: () => {
    const state = get()
    
    // Check if we should handle track end differently during timer
    const isTimerActive = state.isRunning && !state.isPaused && !state.isBreak
    
    if (isTimerActive && state.loopDuringTimer) {
      // During timer with loop enabled: ensure continuous playback
      if (state.repeatMode === 'one') {
        // Replay current track
        set({ currentTime: 0 })
        // Note: Actual replay would be handled by audio component
      } else if (state.repeatMode === 'all' && state.currentPlaylist) {
        // Go to next track (will loop back to start if at end)
        get().next()
      } else {
        // Fallback: replay current track to maintain focus
        set({ currentTime: 0 })
      }
    } else {
      // Normal behavior: respect user's repeat mode
      if (state.repeatMode === 'one') {
        set({ currentTime: 0 })
      } else if (state.repeatMode === 'all') {
        get().next()
      } else {
        // Stop playback
        get().stop()
      }
    }
  }
})

/**
 * Fonction d'abonnement aux événements pour le système Audio
 * Centralise toute la logique de réaction aux événements globaux
 */
export function subscribeAudioSystem(
  events: DeepWorkEvent[], 
  state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]
  if (!latestEvent) return
  
  // Réagir aux événements timer
  if (latestEvent.type === 'timer_started') {
    console.log('Audio: Timer started, enabling audio loop mode')
    
    // Enable loop mode for continuous focus music
    state.enableTimerLoop()
    
    // Auto-play audio when timer starts (only if audio is available and not already playing)
    if (state.autoPlayOnTimerStart && !state.isPlaying) {
      // Try focus playlist first, then current track
      if (state.focusPlaylistId) {
        const focusPlaylist = state.playlists.find(p => p.id === state.focusPlaylistId)
        if (focusPlaylist && focusPlaylist.tracks.length > 0) {
          console.log('Audio: Auto-starting focus playlist:', focusPlaylist.name)
          state.setCurrentPlaylist(focusPlaylist)
          state.play()
        } else {
          console.log('Audio: Focus playlist not found or empty')
        }
      } else if (state.currentTrack) {
        console.log('Audio: Auto-starting current track:', state.currentTrack.title)
        state.play()
      } else {
        console.log('Audio: No audio configured, nothing to auto-start')
      }
    } else if (state.isPlaying) {
      console.log('Audio: Audio already playing, keeping current playback')
    } else {
      console.log('Audio: Auto-play disabled or no audio available')
    }
  }
  
  // NOTE: Timer pause/resume events are no longer dispatched since timer logic is internal
  // Audio pause/resume should be handled via UI controls or settings, not automatic sync
  
  // Handle both old timer_completed and new timer_end events
  if (latestEvent.type === 'timer_completed' || latestEvent.type === 'timer_end') {
    console.log('Audio: Timer ended, disabling audio loop mode')
    
    // Disable loop mode and restore original repeat mode
    state.disableTimerLoop()
    
    // Stop audio if configured
    if (state.autoStopOnTimerComplete) {
      state.stop()
    }
  }
  
  if (latestEvent.type === 'break_started') {
    console.log('Audio: Break started, temporarily disabling timer loop')
    
    // Temporarily restore normal repeat mode during breaks
    state.disableTimerLoop()
    
    // Switch to break playlist if configured
    if (state.breakPlaylistId) {
      const breakPlaylist = state.playlists.find(p => p.id === state.breakPlaylistId)
      if (breakPlaylist) {
        state.setCurrentPlaylist(breakPlaylist)
        state.play()
      }
    }
  }
  
  // Réagir aux changements de settings
  if (latestEvent.type === 'settings_updated') {
    if (latestEvent.payload.section === 'audio') {
      // Appliquer les nouveaux paramètres audio
      console.log('Audio system: Settings updated', latestEvent.payload)
    }
  }
}