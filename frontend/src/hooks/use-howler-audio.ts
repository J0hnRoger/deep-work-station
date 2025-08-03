import { useEffect, useRef, useCallback } from 'react'
import { Howl, Howler } from 'howler'
import { useAudioStore } from '@/store/audio-store'
import { useSettingsStore } from '@/store/settings-store'

export const useHowlerAudio = () => {
  const howlRef = useRef<Howl | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    isPlaying,
    currentTrack,
    volume,
    eqPreset,
    play,
    pause: pauseAudio,
    next,
    updateCurrentTime,
    setDuration,
    setLoading,
    setError
  } = useAudioStore()
  
  const { app: { enableNotifications } } = useSettingsStore()
  
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
        const previousTime = useAudioStore.getState().currentTime
        if (Math.abs(currentTime - previousTime) >= 0.5) {
          updateCurrentTime(currentTime)
        }
      }
    }, 1000)
  }, [updateCurrentTime])
  
  // Set global volume
  useEffect(() => {
    Howler.volume(volume / 100)
  }, [volume])
  
  // Load new track
  useEffect(() => {
    if (!currentTrack) {
      if (howlRef.current) {
        howlRef.current.stop()
        howlRef.current.unload()
        howlRef.current = null
      }
      return
    }
    
    console.log('Loading track with Howler:', currentTrack.title)
    setLoading(true)
    setError(null)
    
    // Stop and unload previous track
    if (howlRef.current) {
      howlRef.current.stop()
      howlRef.current.unload()
    }
    
    // Create new Howl instance
    const howl = new Howl({
      src: [currentTrack.url],
      html5: true, // Use HTML5 Audio for streaming
      preload: true,
      volume: volume / 100,
      
      onload: () => {
        console.log('Track loaded successfully:', currentTrack.title)
        setDuration(howl.duration())
        setLoading(false)
      },
      
      onloaderror: (id, error) => {
        console.error('Error loading track:', error)
        setError(`Failed to load track: ${currentTrack.title}`)
        setLoading(false)
      },
      
      onplay: () => {
        console.log('Track started playing:', currentTrack.title)
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
      
      onplayerror: (id, error) => {
        console.error('Playback error:', error)
        setError('Playback failed')
        
        // Retry once with HTML5 audio
        howl.once('unlock', () => {
          howl.play()
        })
      }
    })
    
    howlRef.current = howl
    
    return () => {
      stopProgressUpdates()
      if (howl) {
        howl.stop()
        howl.unload()
      }
    }
  }, [currentTrack, volume, setDuration, setLoading, setError, next])
  
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
        howlRef.current.unload()
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
  
  const isReady = !!howlRef.current
  const isLoaded = howlRef.current?.state() === 'loaded'
  
  return {
    isReady,
    isLoaded,
    handleSeek,
    formatTime,
  }
}