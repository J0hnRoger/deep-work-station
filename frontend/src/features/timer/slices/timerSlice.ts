// =============================================================================
// TIMER SLICE - Zustand slice pour la feature Timer
// =============================================================================

import type { StateCreator } from 'zustand'
import { TimerDomain, DEFAULT_TIMER_PRESETS } from '../timerTypes'
import type { TimerSlice } from '../timerTypes'
import type { DeepWorkEvent } from '@/core/messaging/deepWorkEventTypes'
import type { AppStore } from '@/store/useAppStore'

const initialState = {
  // Current session
  currentSession: null,
  isRunning: false,
  isPaused: false,
  currentTime: 0,
  
  // Configuration
  mode: 'deep-work' as const,
  currentPreset: DEFAULT_TIMER_PRESETS[1], // deep-work as default
  customDuration: 30,
  
  // Break management
  isBreak: false,
  breakTime: 0,
  
  // Session management
  sessionsToday: 0,
  completedSessions: 0,
  
  // Auto features
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  autoPauseInactive: true,
  inactiveThreshold: 5
}

export const createTimerSlice: StateCreator<AppStore> = (set, get) => ({
  ...initialState,
  
  // Timer Actions
  startTimer: () => {
    const state = get()
    const session = TimerDomain.createSession(state.mode, state.currentPreset)
    
    set({
      currentSession: session,
      isRunning: true,
      isPaused: false,
      currentTime: state.currentPreset.workDuration * 60,
      isBreak: false,
      breakTime: 0
    })
    
    // Dispatch event for audio system
    get().dispatchGlobalEvent({
      type: 'timer_started',
      payload: { mode: state.mode, duration: state.currentPreset.workDuration },
      timestamp: Date.now(),
      id: `timer_start_${Date.now()}`
    })
  },
  
  pauseTimer: () => {
    const state = get()
    set({ isPaused: true })
    
    if (state.currentSession) {
      set({
        currentSession: {
          ...state.currentSession,
          paused: true,
          pausedTime: Date.now()
        }
      })
    }
    
    // Dispatch event for audio system
    get().dispatchGlobalEvent({
      type: 'timer_paused',
      payload: {},
      timestamp: Date.now(),
      id: `timer_pause_${Date.now()}`
    })
  },
  
  resumeTimer: () => {
    const state = get()
    set({ isPaused: false })
    
    if (state.currentSession) {
      set({
        currentSession: {
          ...state.currentSession,
          paused: false,
          pausedTime: undefined
        }
      })
    }
    
    // Dispatch event for audio system
    get().dispatchGlobalEvent({
      type: 'timer_resumed',
      payload: {},
      timestamp: Date.now(),
      id: `timer_resume_${Date.now()}`
    })
  },
  
  stopTimer: () => {
    const state = get()
    const session = state.currentSession
    
    if (session) {
      const completedSession = {
        ...session,
        endTime: Date.now(),
        actualDuration: Math.floor((Date.now() - session.startTime) / 1000),
        completed: false
      }
      
      // Add to session tracking
      get().addSession({
        id: completedSession.id,
        date: new Date().toISOString().split('T')[0],
        startTime: completedSession.startTime,
        endTime: completedSession.endTime,
        duration: completedSession.actualDuration,
        plannedDuration: completedSession.plannedDuration,
        mode: completedSession.mode,
        completed: completedSession.completed
      })
    }
    
    set({
      currentSession: null,
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      isBreak: false,
      breakTime: 0
    })
    
    // Dispatch event for audio system
    get().dispatchGlobalEvent({
      type: 'timer_stopped',
      payload: {},
      timestamp: Date.now(),
      id: `timer_stop_${Date.now()}`
    })
  },
  
  resetTimer: () => {
    const state = get()
    const duration = state.currentPreset.workDuration * 60
    
    set({
      isRunning: false,
      isPaused: false,
      currentTime: duration,
      isBreak: false,
      breakTime: 0
    })
  },
  
  completeSession: () => {
    const state = get()
    const session = state.currentSession
    
    if (session) {
      const completedSession = {
        ...session,
        endTime: Date.now(),
        actualDuration: session.plannedDuration,
        completed: true
      }
      
      // Add to session tracking
      get().addSession({
        id: completedSession.id,
        date: new Date().toISOString().split('T')[0],
        startTime: completedSession.startTime,
        endTime: completedSession.endTime,
        duration: completedSession.actualDuration,
        plannedDuration: completedSession.plannedDuration,
        mode: completedSession.mode,
        completed: completedSession.completed
      })
      
      // Update stats
      set({
        completedSessions: state.completedSessions + 1,
        sessionsToday: state.sessionsToday + 1
      })
      
      // Auto start break if enabled
      if (state.autoStartBreaks) {
        const breakDuration = state.currentPreset.breakDuration * 60
        set({
          isBreak: true,
          breakTime: breakDuration,
          currentTime: breakDuration
        })
        
        // Dispatch break started event
        get().dispatchGlobalEvent({
          type: 'break_started',
          payload: { duration: state.currentPreset.breakDuration },
          timestamp: Date.now(),
          id: `break_start_${Date.now()}`
        })
      } else {
        set({
          currentSession: null,
          isRunning: false,
          isPaused: false,
          currentTime: 0,
          isBreak: false,
          breakTime: 0
        })
      }
      
      // Dispatch session completed event
      get().dispatchGlobalEvent({
        type: 'session_completed',
        payload: { 
          mode: session.mode, 
          duration: session.plannedDuration,
          quality: 'medium'
        },
        timestamp: Date.now(),
        id: `session_complete_${Date.now()}`
      })
    }
  },
  
  startBreak: () => {
    const state = get()
    const breakDuration = state.currentPreset.breakDuration * 60
    
    set({
      isBreak: true,
      breakTime: breakDuration,
      currentTime: breakDuration,
      isRunning: true,
      isPaused: false
    })
    
    // Dispatch break started event
    get().dispatchGlobalEvent({
      type: 'break_started',
      payload: { duration: state.currentPreset.breakDuration },
      timestamp: Date.now(),
      id: `break_start_${Date.now()}`
    })
  },
  
  switchMode: (mode) => {
    const preset = DEFAULT_TIMER_PRESETS.find(p => p.id === mode)
    if (preset) {
      set({
        mode,
        currentPreset: preset,
        currentTime: preset.workDuration * 60
      })
    }
  },
  
  setCustomDuration: (minutes) => {
    set({ customDuration: minutes })
  },
  
  updateCurrentTime: (time) => {
    set({ currentTime: time })
  },
  
  setAutoStartBreaks: (enabled) => {
    set({ autoStartBreaks: enabled })
  },
  
  setAutoStartPomodoros: (enabled) => {
    set({ autoStartPomodoros: enabled })
  },
  
  setLongBreakInterval: (interval) => {
    set({ longBreakInterval: interval })
  },
  
  setAutoPauseInactive: (enabled) => {
    set({ autoPauseInactive: enabled })
  },
  
  setInactiveThreshold: (minutes) => {
    set({ inactiveThreshold: minutes })
  }
})

/**
 * Fonction d'abonnement aux événements pour le système Timer
 * Centralise toute la logique de réaction aux événements globaux
 */
export function subscribeTimerSystem(
  events: DeepWorkEvent[], 
  _state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]
  if (!latestEvent) return
  
  // Réagir aux événements audio
  if (latestEvent.type === 'audio_playlist_changed') {
    // Potentiel ajustement du timer selon la playlist
    console.log('Timer system: Audio playlist changed', latestEvent.payload)
  }
  
  // Réagir aux changements de settings
  if (latestEvent.type === 'settings_updated') {
    // Mettre à jour les paramètres du timer si nécessaire
    console.log('Timer system: Settings updated', latestEvent.payload)
  }
}