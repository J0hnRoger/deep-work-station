// =============================================================================
// TIMER HOOK - Façade vers useAppStore
// =============================================================================

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

export const useTimer = () => {
  const intervalRef = useRef<number | null>(null)
  const lastActiveRef = useRef<number>(Date.now())
  
  // Accès au store unifié via sélecteurs
  const isRunning = useAppStore(state => state.isRunning)
  const isPaused = useAppStore(state => state.isPaused)
  const currentTime = useAppStore(state => state.currentTime)
  const isBreak = useAppStore(state => state.isBreak)
  const autoPauseInactive = useAppStore(state => state.autoPauseInactive)
  const inactiveThreshold = useAppStore(state => state.inactiveThreshold)
  const currentPreset = useAppStore(state => state.currentPreset)
  const enableNotifications = useAppStore(state => state.ui.enableNotifications)
  const soundEnabled = useAppStore(state => state.ui.soundEnabled)
  
  // Actions du store unifié
  const completeSession = useAppStore(state => state.completeSession)
  const pauseTimer = useAppStore(state => state.pauseTimer)
  const updateCurrentTime = useAppStore(state => state.updateCurrentTime)
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle timer countdown
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const newTime = Math.max(0, useAppStore.getState().currentTime - 1)
        updateCurrentTime(newTime)
        
        // Check if timer completed
        if (newTime <= 0) {
          completeSession()
          
          // Notification for session complete
          if (enableNotifications && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Session Complete! 🎉', {
                body: isBreak ? 'Break time is over' : 'Focus session completed',
                icon: '/favicon.ico',
                silent: !soundEnabled
              })
            }
          }
        }
      }, 1000) as unknown as number
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, isBreak, completeSession, enableNotifications, soundEnabled, updateCurrentTime])
  
  // Handle window focus/blur for activity tracking
  useEffect(() => {
    const handleFocus = () => {
      lastActiveRef.current = Date.now()
    }
    
    const handleBlur = () => {
      lastActiveRef.current = Date.now()
    }
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus()
      } else {
        handleBlur()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  // Auto-pause on inactivity
  useEffect(() => {
    if (!autoPauseInactive || !isRunning || isPaused) return
    
    const checkInactivity = setInterval(() => {
      const now = Date.now()
      const inactiveTime = (now - lastActiveRef.current) / 1000 / 60 // minutes
      
      if (inactiveTime >= inactiveThreshold) {
        pauseTimer()
        
        if (enableNotifications && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Timer Paused', {
              body: `Timer paused due to ${Math.round(inactiveTime)} minutes of inactivity`,
              icon: '/favicon.ico',
              silent: !soundEnabled
            })
          }
        }
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(checkInactivity)
  }, [autoPauseInactive, inactiveThreshold, isRunning, isPaused, pauseTimer, enableNotifications, soundEnabled])
  
  // Request notification permission on first use
  useEffect(() => {
    if (enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [enableNotifications])
  
  return {
    formatTime,
    timeDisplay: formatTime(currentTime),
    progress: currentTime > 0 ? ((currentPreset.workDuration * 60 - currentTime) / (currentPreset.workDuration * 60)) * 100 : 0
  }
}