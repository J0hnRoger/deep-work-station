import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EQPreset = 'neutral' | 'light' | 'boost'

export interface AudioTrack {
  id: string
  title: string
  artist?: string
  url: string
  duration?: number // seconds
}

export interface Playlist {
  id: string
  name: string
  tracks: AudioTrack[]
}

export interface AudioState {
  // Playback state
  isPlaying: boolean
  isPaused: boolean
  currentTrack: AudioTrack | null
  currentPlaylist: Playlist | null
  currentTime: number // seconds
  duration: number // seconds
  
  // Audio settings
  volume: number // 0-100
  eqPreset: EQPreset
  crossfadeDuration: number // seconds
  
  // Playlists
  playlists: Playlist[]
  
  // Audio loading state
  isLoading: boolean
  error: string | null
  
  // Actions
  // Playback control
  play: () => void
  pause: () => void
  stop: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  
  // Playlist management
  setPlaylist: (playlist: Playlist) => void
  addPlaylist: (playlist: Playlist) => void
  removePlaylist: (playlistId: string) => void
  
  // Audio settings
  setVolume: (volume: number) => void
  setEQPreset: (preset: EQPreset) => void
  setCrossfadeDuration: (duration: number) => void
  
  // Track management
  setCurrentTrack: (track: AudioTrack) => void
  updateCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const defaultPlaylists: Playlist[] = []

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      isPaused: false,
      currentTrack: null,
      currentPlaylist: null,
      currentTime: 0,
      duration: 0,
      
      volume: 70,
      eqPreset: 'neutral',
      crossfadeDuration: 3,
      
      playlists: defaultPlaylists,
      
      isLoading: false,
      error: null,
      
      // Actions
      play: () => {
        const state = get()
        if (state.currentTrack) {
          set({ isPlaying: true, isPaused: false })
        }
      },
      
      pause: () => set({ isPlaying: false, isPaused: true }),
      
      stop: () => set({ 
        isPlaying: false, 
        isPaused: false, 
        currentTime: 0 
      }),
      
      next: () => {
        const state = get()
        if (state.currentPlaylist && state.currentTrack) {
          const currentIndex = state.currentPlaylist.tracks.findIndex(
            track => track.id === state.currentTrack!.id
          )
          const nextIndex = (currentIndex + 1) % state.currentPlaylist.tracks.length
          const nextTrack = state.currentPlaylist.tracks[nextIndex]
          
          if (nextTrack) {
            set({ 
              currentTrack: nextTrack,
              currentTime: 0,
              duration: nextTrack.duration || 0
            })
          }
        }
      },
      
      previous: () => {
        const state = get()
        if (state.currentPlaylist && state.currentTrack) {
          const currentIndex = state.currentPlaylist.tracks.findIndex(
            track => track.id === state.currentTrack!.id
          )
          const prevIndex = currentIndex === 0 
            ? state.currentPlaylist.tracks.length - 1 
            : currentIndex - 1
          const prevTrack = state.currentPlaylist.tracks[prevIndex]
          
          if (prevTrack) {
            set({ 
              currentTrack: prevTrack,
              currentTime: 0,
              duration: prevTrack.duration || 0
            })
          }
        }
      },
      
      seek: (time) => set({ currentTime: time }),
      
      setPlaylist: (playlist) => {
        console.log('Setting playlist:', playlist.name, 'tracks:', playlist.tracks.length)
        const firstTrack = playlist.tracks.length > 0 ? playlist.tracks[0] : null
        console.log('First track:', firstTrack)
        
        set({ 
          currentPlaylist: playlist,
          currentTrack: firstTrack,
          currentTime: 0,
          duration: firstTrack?.duration || 0
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
      
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
      
      setEQPreset: (preset) => set({ eqPreset: preset }),
      
      setCrossfadeDuration: (duration) => set({ 
        crossfadeDuration: Math.max(0.5, Math.min(10, duration)) 
      }),
      
      setCurrentTrack: (track) => set({ 
        currentTrack: track,
        currentTime: 0,
        duration: track.duration || 0
      }),
      
      updateCurrentTime: (time) => set({ currentTime: time }),
      
      setDuration: (duration) => set({ duration }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error })
    }),
    {
      name: 'audio-store',
      partialize: (state) => ({
        volume: state.volume,
        eqPreset: state.eqPreset,
        crossfadeDuration: state.crossfadeDuration,
        // Don't persist playlists or currentPlaylist - they'll be reloaded from Azure
      })
    }
  )
)