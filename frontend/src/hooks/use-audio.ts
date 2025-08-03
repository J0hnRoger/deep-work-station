import { useEffect, useRef, useCallback } from 'react'
import { useAudioStore } from '@/store/audio-store'
import { useSettingsStore } from '@/store/settings-store'

export interface AudioNodes {
  audioContext: AudioContext
  sourceNode: AudioBufferSourceNode | null
  gainNode: GainNode
  eqNodes: {
    lowShelf: BiquadFilterNode
    peaking: BiquadFilterNode
    highShelf: BiquadFilterNode
  }
}

export const useAudio = () => {
  const audioNodesRef = useRef<AudioNodes | null>(null)
  const currentBufferRef = useRef<AudioBuffer | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(0)
  
  const {
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    eqPreset,
    audioContext,
    isLoading,
    play,
    pause: pauseAudio,
    stop,
    next,
    previous,
    seek,
    setCurrentTrack,
    updateCurrentTime,
    setDuration,
    initAudioContext,
    setLoading,
    setError
  } = useAudioStore()
  
  const { app: { enableWebAudio } } = useSettingsStore()
  
  // Initialize audio context
  useEffect(() => {
    if (enableWebAudio && !audioContext) {
      initAudioContext()
    }
  }, [enableWebAudio, audioContext, initAudioContext])
  
  // Create audio nodes when context is ready
  useEffect(() => {
    if (!audioContext || audioNodesRef.current) return
    
    try {
      const gainNode = audioContext.createGain()
      
      // EQ Nodes
      const lowShelf = audioContext.createBiquadFilter()
      lowShelf.type = 'lowshelf'
      lowShelf.frequency.value = 200
      
      const peaking = audioContext.createBiquadFilter()
      peaking.type = 'peaking'
      peaking.frequency.value = 1000
      peaking.Q.value = 1
      
      const highShelf = audioContext.createBiquadFilter()
      highShelf.type = 'highshelf'
      highShelf.frequency.value = 8000
      
      // Connect nodes: source -> lowShelf -> peaking -> highShelf -> gain -> destination
      lowShelf.connect(peaking)
      peaking.connect(highShelf)
      highShelf.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      audioNodesRef.current = {
        audioContext,
        sourceNode: null,
        gainNode,
        eqNodes: { lowShelf, peaking, highShelf }
      }
      
      console.log('Audio nodes initialized')
      
    } catch (error) {
      console.error('Failed to create audio nodes:', error)
      setError('Failed to initialize audio system')
    }
  }, [audioContext, setError])
  
  // Update volume
  useEffect(() => {
    if (audioNodesRef.current) {
      audioNodesRef.current.gainNode.gain.value = volume / 100
    }
  }, [volume])
  
  // Update EQ
  useEffect(() => {
    if (!audioNodesRef.current) return
    
    const { lowShelf, peaking, highShelf } = audioNodesRef.current.eqNodes
    
    switch (eqPreset) {
      case 'neutral':
        lowShelf.gain.value = 0
        peaking.gain.value = 0
        highShelf.gain.value = 0
        break
      case 'light':
        lowShelf.gain.value = 2
        peaking.gain.value = 1
        highShelf.gain.value = 3
        break
      case 'boost':
        lowShelf.gain.value = 4
        peaking.gain.value = 2
        highShelf.gain.value = 6
        break
    }
  }, [eqPreset])
  
  // Load audio buffer
  const loadAudioBuffer = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    if (!audioContext) return null
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      setLoading(false)
      return audioBuffer
      
    } catch (error) {
      console.error('Error loading audio buffer:', error)
      setError(error instanceof Error ? error.message : 'Failed to load audio')
      setLoading(false)
      return null
    }
  }, [audioContext, setLoading, setError])
  
  // Play audio buffer
  const playAudioBuffer = useCallback((buffer: AudioBuffer, startOffset = 0) => {
    if (!audioNodesRef.current || !buffer) return
    
    const { audioContext, gainNode, eqNodes } = audioNodesRef.current
    
    // Stop current source if playing
    if (audioNodesRef.current.sourceNode) {
      audioNodesRef.current.sourceNode.stop()
      audioNodesRef.current.sourceNode.disconnect()
    }
    
    // Create new source node
    const sourceNode = audioContext.createBufferSource()
    sourceNode.buffer = buffer
    
    // Connect to audio graph
    sourceNode.connect(eqNodes.lowShelf)
    
    // Start playback
    sourceNode.start(0, startOffset)
    startTimeRef.current = audioContext.currentTime - startOffset
    
    // Handle playback end
    sourceNode.onended = () => {
      if (audioNodesRef.current?.sourceNode === sourceNode) {
        next() // Auto-advance to next track
      }
    }
    
    audioNodesRef.current.sourceNode = sourceNode
    currentBufferRef.current = buffer
    
    console.log(`Started playback at offset ${startOffset}s`)
    
  }, [next])
  
  // Stop current playback
  const stopPlayback = useCallback(() => {
    if (audioNodesRef.current?.sourceNode) {
      audioNodesRef.current.sourceNode.stop()
      audioNodesRef.current.sourceNode.disconnect()
      audioNodesRef.current.sourceNode = null
    }
    currentBufferRef.current = null
    startTimeRef.current = 0
    pauseTimeRef.current = 0
  }, [])
  
  // Handle play action
  useEffect(() => {
    if (!isPlaying || !currentTrack || !audioContext) return
    
    const handlePlay = async () => {
      // If we have a paused buffer, resume it
      if (currentBufferRef.current && pauseTimeRef.current > 0) {
        playAudioBuffer(currentBufferRef.current, pauseTimeRef.current)
        pauseTimeRef.current = 0
        return
      }
      
      // Load and play new track
      const buffer = await loadAudioBuffer(currentTrack.url)
      if (buffer) {
        setDuration(buffer.duration)
        playAudioBuffer(buffer)
      }
    }
    
    handlePlay()
  }, [isPlaying, currentTrack, audioContext, playAudioBuffer, loadAudioBuffer, setDuration])
  
  // Handle pause action
  useEffect(() => {
    if (isPlaying || !audioContext) return
    
    if (audioNodesRef.current?.sourceNode && currentBufferRef.current) {
      // Calculate current playback position
      const elapsed = audioContext.currentTime - startTimeRef.current
      pauseTimeRef.current = Math.min(elapsed, currentBufferRef.current.duration)
      
      stopPlayback()
      console.log(`Paused at ${pauseTimeRef.current}s`)
    }
  }, [isPlaying, audioContext, stopPlayback])
  
  // Update current time
  useEffect(() => {
    if (!isPlaying || !audioContext || !currentBufferRef.current) return
    
    const updateInterval = setInterval(() => {
      const elapsed = audioContext.currentTime - startTimeRef.current
      const currentPos = Math.min(elapsed, currentBufferRef.current!.duration)
      updateCurrentTime(currentPos)
    }, 1000)
    
    return () => clearInterval(updateInterval)
  }, [isPlaying, audioContext, updateCurrentTime])
  
  // Seek functionality
  const handleSeek = useCallback((time: number) => {
    if (!currentBufferRef.current || !audioContext) return
    
    const wasPlaying = isPlaying
    
    if (wasPlaying) {
      stopPlayback()
    }
    
    pauseTimeRef.current = Math.max(0, Math.min(time, currentBufferRef.current.duration))
    updateCurrentTime(pauseTimeRef.current)
    
    if (wasPlaying) {
      playAudioBuffer(currentBufferRef.current, pauseTimeRef.current)
      pauseTimeRef.current = 0
    }
  }, [isPlaying, audioContext, stopPlayback, playAudioBuffer, updateCurrentTime])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [stopPlayback])
  
  return {
    isReady: !!audioNodesRef.current,
    handleSeek,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
  }
}