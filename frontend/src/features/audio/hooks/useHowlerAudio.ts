// =============================================================================
// HOWLER AUDIO HOOK - Façade vers useAppStore avec Lazy Loading
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import { Howl, Howler } from 'howler'
import { useAppStore } from '@/store/useAppStore'

// Audio pool management to prevent "HTML5 Audio pool exhausted"
const audioPool = new Map<string, Howl>()
const loadingTracks = new Map<string, Promise<Howl>>()
const DEBOUNCE_DELAY = 500 // Reduced to 500ms for better responsiveness
const MAX_POOL_SIZE = 5 // Maximum number of loaded tracks in memory

export const useHowlerAudio = () => {
  const howlRef = useRef<Howl | null>(null)
  const updateIntervalRef = useRef<number | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Sélecteurs du store unifié
  const isPlaying = useAppStore(state => state.isPlaying)
  const currentTrack = useAppStore(state => state.currentTrack)
  const volume = useAppStore(state => state.volume)
  const eqPreset = useAppStore(state => state.eqPreset)
  
  // Actions du store unifié
  const next = useAppStore(state => state.next)
  const updateCurrentTime = useAppStore(state => state.updateCurrentTime)
  const setDuration = useAppStore(state => state.setDuration)
  const setLoading = useAppStore(state => state.setLoading)
  const setError = useAppStore(state => state.setError)
  
  // Progress update functions (defined early to avoid dependency issues)
  const stopProgressUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }
  }, [])
  
  const startProgressUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
    }
    
    updateIntervalRef.current = setInterval(() => {
      if (howlRef.current && howlRef.current.playing()) {
        const currentTime = howlRef.current.seek() as number
        // Only update if there's a meaningful change to avoid unnecessary re-renders
        const previousTime = useAppStore.getState().currentTime
        if (Math.abs(currentTime - previousTime) >= 0.5) {
          updateCurrentTime(currentTime)
        }
      }
    }, 1000) as unknown as number
  }, [updateCurrentTime])
  
  // Audio pool management
  const cleanupAudioPool = useCallback(() => {
    if (audioPool.size > MAX_POOL_SIZE) {
      // Remove oldest tracks (excluding current)
      const currentTrackId = currentTrack?.id
      const tracksToRemove = Array.from(audioPool.keys())
        .filter(id => id !== currentTrackId)
        .slice(0, audioPool.size - MAX_POOL_SIZE)
      
      tracksToRemove.forEach(trackId => {
        const howl = audioPool.get(trackId)
        if (howl) {
          console.log(`Cleaning up audio track: ${trackId}`)
          howl.stop()
          howl.unload()
          audioPool.delete(trackId)
        }
      })
    }
  }, [currentTrack?.id])
  
  // Lazy load track with debouncing
  const loadTrackLazy = useCallback(async (track: any): Promise<Howl> => {
    const trackId = track.id
    
    // Check if already loading
    if (loadingTracks.has(trackId)) {
      console.log(`Track already loading: ${track.title}`)
      return loadingTracks.get(trackId)!
    }
    
    // Check if already loaded
    if (audioPool.has(trackId)) {
      console.log(`Track already loaded: ${track.title}`)
      const howl = audioPool.get(trackId)!
      setIsReady(true)
      setIsLoaded(howl.state() === 'loaded')
      return howl
    }
    
    // Create loading promise
    const loadPromise = new Promise<Howl>((resolve, reject) => {
      console.log(`Loading track with Howler (lazy): ${track.title}`)
      
      const howl = new Howl({
        src: [track.url],
        html5: true, // Use HTML5 Audio for streaming
        preload: true,
        volume: volume / 100,
        
        onload: () => {
          console.log('Track loaded successfully:', track.title)
          setDuration(howl.duration())
          setLoading(false)
          setIsReady(true)
          setIsLoaded(true)
          resolve(howl)
        },
        
        onloaderror: (_, error) => {
          console.error('Error loading track:', error)
          setError(`Failed to load track: ${track.title}`)
          setLoading(false)
          setIsReady(false)
          setIsLoaded(false)
          loadingTracks.delete(trackId)
          reject(error)
        },
        
        onplay: () => {
          console.log('Track started playing:', track.title)
          startProgressUpdates()
        },
        
        onpause: () => {
          console.log('Track paused')
          stopProgressUpdates()
        },
        
        onstop: () => {
          console.log('Track stopped')
          stopProgressUpdates()
          updateCurrentTime(0)
        },
        
        onend: () => {
          console.log('Track ended, playing next')
          stopProgressUpdates()
          next() // Auto-advance to next track
        },
        
        onplayerror: (_, error) => {
          console.error('Playback error:', error)
          setError('Playback failed')
          
          // Retry once with HTML5 audio
          howl.once('unlock', () => {
            howl.play()
          })
        }
      })
      
      // Add to pool
      audioPool.set(trackId, howl)
      cleanupAudioPool()
    })
    
    loadingTracks.set(trackId, loadPromise)
    
    // Clean up loading promise after completion
    loadPromise.finally(() => {
      loadingTracks.delete(trackId)
    })
    
    return loadPromise
  }, [volume, setDuration, setLoading, setError, next, startProgressUpdates, stopProgressUpdates, cleanupAudioPool])
  
  // Set global volume
  useEffect(() => {
    Howler.volume(volume / 100)
  }, [volume])
  
  // Lazy load new track with debouncing
  useEffect(() => {
    if (!currentTrack) {
      if (howlRef.current) {
        howlRef.current.stop()
        howlRef.current = null
      }
      setIsReady(false)
      setIsLoaded(false)
      return
    }
    
    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set loading state immediately
    setLoading(true)
    setError(null)
    setIsReady(false)
    setIsLoaded(false)
    
    // Debounced loading
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const howl = await loadTrackLazy(currentTrack)
        howlRef.current = howl
      } catch (error) {
        console.error('Failed to load track:', error)
        setLoading(false)
        setIsReady(false)
        setIsLoaded(false)
      }
    }, DEBOUNCE_DELAY)
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [currentTrack, loadTrackLazy, setLoading, setError])
  
  // Handle play/pause state changes
  useEffect(() => {
    if (!howlRef.current) return
    
    if (isPlaying) {
      console.log('Starting playback...')
      howlRef.current.play()
    } else {
      console.log('Pausing playback...')
      howlRef.current.pause()
      stopProgressUpdates() // Stop updates when not playing
    }
  }, [isPlaying, stopProgressUpdates])
  
  // Seek functionality
  const handleSeek = useCallback((time: number) => {
    if (howlRef.current) {
      howlRef.current.seek(time)
      updateCurrentTime(time)
      console.log(`Seeked to ${time}s`)
    }
  }, [updateCurrentTime])
  
  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressUpdates()
      if (howlRef.current) {
        howlRef.current.stop()
        howlRef.current = null
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [stopProgressUpdates])
  
  // EQ simulation (Howler doesn't have built-in EQ, but we can adjust volume)
  useEffect(() => {
    if (!howlRef.current) return
    
    // Simple EQ simulation by adjusting volume based on preset
    let volumeMultiplier = 1
    
    switch (eqPreset) {
      case 'light':
        volumeMultiplier = 1.1
        break
      case 'boost':
        volumeMultiplier = 1.2
        break
      case 'neutral':
      default:
        volumeMultiplier = 1
        break
    }
    
    const adjustedVolume = Math.min(1, (volume / 100) * volumeMultiplier)
    howlRef.current.volume(adjustedVolume)
  }, [eqPreset, volume])
  
  return {
    isReady,
    isLoaded,
    handleSeek,
    formatTime,
  }
}