import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/store/timer-store'
import { useSettingsStore } from '@/store/settings-store'

export const useTimer = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActiveRef = useRef<number>(Date.now())
  
  const {
    isRunning,
    isPaused,
    currentTime,
    isBreak,
    autoPauseInactive,
    inactiveThreshold,
    updateCurrentTime,
    completeSession,
    pauseTimer
  } = useTimerStore()
  
  const { 
    setWindowState, 
    updateLastActiveTime,
    user: { enableNotifications, notifyOnSessionComplete }
  } = useSettingsStore()
  
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
        useTimerStore.getState().updateCurrentTime(
          Math.max(0, useTimerStore.getState().currentTime - 1)
        )
        
        // Check if timer completed
        if (useTimerStore.getState().currentTime <= 0) {
          completeSession()
          
          // Notification for session complete
          if (enableNotifications && notifyOnSessionComplete && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Session Complete! 🎉', {
                body: isBreak ? 'Break time is over' : 'Focus session completed',
                icon: '/favicon.ico'
              })
            }
          }
        }
      }, 1000)
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
  }, [isRunning, isPaused, isBreak, completeSession, enableNotifications, notifyOnSessionComplete])
  
  // Handle window focus/blur for auto-pause
  useEffect(() => {
    const handleFocus = () => {
      setWindowState('focused')
      updateLastActiveTime()
      lastActiveRef.current = Date.now()
    }
    
    const handleBlur = () => {
      setWindowState('blurred')
      lastActiveRef.current = Date.now()
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur()
      } else {
        handleFocus()
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
  }, [setWindowState, updateLastActiveTime])
  
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
              icon: '/favicon.ico'
            })
          }
        }
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(checkInactivity)
  }, [autoPauseInactive, inactiveThreshold, isRunning, isPaused, pauseTimer, enableNotifications])
  
  // Request notification permission on first use
  useEffect(() => {
    if (enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [enableNotifications])
  
  return {
    formatTime,
    timeDisplay: formatTime(currentTime),
    progress: currentTime > 0 ? ((useTimerStore.getState().currentPreset.workDuration * 60 - currentTime) / (useTimerStore.getState().currentPreset.workDuration * 60)) * 100 : 0
  }
}