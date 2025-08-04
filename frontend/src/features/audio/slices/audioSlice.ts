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
  repeatMode: 'none',
  
  // Audio settings
  volume: 70,
  eqPreset: 'neutral',
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
  breakPlaylistId: null
}

export const createAudioSlice: StateCreator<AppStore> = (set, get) => ({
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
      set({ currentTrack: nextTrack, currentTime: 0 })
      
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
      set({ currentTrack: prevTrack, currentTime: 0 })
      
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
    set({ 
      currentPlaylist: playlist,
      currentTrack: playlist.tracks[0] || null,
      currentTime: 0
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
    set({ currentTrack: track, currentTime: 0 })
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
  
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
  
  setError: (error) => {
    set({ error, isLoading: false })
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
    if (state.autoPlayOnTimerStart && state.focusPlaylistId) {
      const focusPlaylist = state.playlists.find(p => p.id === state.focusPlaylistId)
      if (focusPlaylist) {
        state.setCurrentPlaylist(focusPlaylist)
        state.play()
      }
    }
  }
  
  if (latestEvent.type === 'timer_paused') {
    if (state.autoPauseOnTimerPause) {
      state.pause()
    }
  }
  
  if (latestEvent.type === 'timer_resumed') {
    if (state.autoPauseOnTimerPause && state.isPaused) {
      state.play()
    }
  }
  
  if (latestEvent.type === 'timer_stopped' || latestEvent.type === 'session_completed') {
    if (state.autoStopOnTimerComplete) {
      state.stop()
    }
  }
  
  if (latestEvent.type === 'break_started') {
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