// =============================================================================
// TIMER HOOK - Façade vers useAppStore
// =============================================================================

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

export const useTimer = () => {
  const lastActiveRef = useRef<number>(Date.now())
  
  // Accès au store unifié via sélecteurs
  const isRunning = useAppStore(state => state.isRunning)
  const isPaused = useAppStore(state => state.isPaused)
  const timerCurrentTime = useAppStore(state => state.timerCurrentTime)
  const isBreak = useAppStore(state => state.isBreak)
  const autoPauseInactive = useAppStore(state => state.autoPauseInactive)
  const inactiveThreshold = useAppStore(state => state.inactiveThreshold)
  const currentPreset = useAppStore(state => state.currentPreset)
  const enableNotifications = useAppStore(state => state.ui.enableNotifications)
  const soundEnabled = useAppStore(state => state.ui.soundEnabled)
  
  // Actions du store unifié
  const pauseTimer = useAppStore(state => state.pauseTimer)
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Session completion notification handler
  useEffect(() => {
    // This effect only handles notifications - timer logic is now in the slice
    if (timerCurrentTime === 0 && isRunning) {
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
  }, [timerCurrentTime, isRunning, isBreak, enableNotifications, soundEnabled])
  
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
    timeDisplay: formatTime(timerCurrentTime),
    progress: timerCurrentTime > 0 ? ((currentPreset.workDuration * 60 - timerCurrentTime) / (currentPreset.workDuration * 60)) * 100 : 0
  }
}