// =============================================================================
// TIMER HOOK - Façade vers useAppStore
// =============================================================================

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export const useTimer = () => {
  // Accès au store unifié via sélecteurs
  const isRunning = useAppStore(state => state.isRunning)
  const timerCurrentTime = useAppStore(state => state.timerCurrentTime)
  const isBreak = useAppStore(state => state.isBreak)
  const currentPreset = useAppStore(state => state.currentPreset)
  const enableNotifications = useAppStore(state => state.ui.enableNotifications)
  const soundEnabled = useAppStore(state => state.ui.soundEnabled)
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Session completion notification handler
  useEffect(() => {
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