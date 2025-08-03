import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TimerMode = 'pomodoro' | 'deep-work' | 'custom'

export interface TimerPreset {
  id: TimerMode
  name: string
  workDuration: number  // minutes
  breakDuration: number // minutes
  longBreakDuration?: number // minutes (for pomodoro cycles)
}

export interface TimerSession {
  id: string
  start: string // ISO string
  end?: string
  durationSec?: number
  project?: string
  title: string
  mode: TimerMode
  quality?: 'low' | 'mid' | 'high'
  completed: boolean
}

export interface TimerState {
  // Current timer state
  isRunning: boolean
  isPaused: boolean
  currentTime: number // seconds remaining
  mode: TimerMode
  isBreak: boolean
  
  // Presets
  presets: TimerPreset[]
  currentPreset: TimerPreset
  
  // Sessions
  currentSession: TimerSession | null
  sessions: TimerSession[]
  
  // Settings
  autoStartBreaks: boolean
  autoPauseInactive: boolean
  inactiveThreshold: number // minutes
  
  // Actions
  startTimer: (mode?: TimerMode, customDuration?: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  switchMode: (mode: TimerMode) => void
  updateCurrentTime: (time: number) => void
  
  // Session management
  completeSession: (quality?: 'low' | 'mid' | 'high') => void
  renameSession: (sessionId: string, title: string) => void
  setSessionProject: (sessionId: string, project: string) => void
  
  // Settings
  setAutoStartBreaks: (enabled: boolean) => void
  setAutoPauseInactive: (enabled: boolean) => void
  setInactiveThreshold: (minutes: number) => void
}

const defaultPresets: TimerPreset[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    workDuration: 50,
    breakDuration: 10
  },
  {
    id: 'custom',
    name: 'Custom',
    workDuration: 30,
    breakDuration: 5
  }
]

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Initial state
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      mode: 'deep-work',
      isBreak: false,
      
      presets: defaultPresets,
      currentPreset: defaultPresets[1], // deep-work as default
      
      currentSession: null,
      sessions: [],
      
      autoStartBreaks: false,
      autoPauseInactive: true,
      inactiveThreshold: 5,
      
      // Actions
      startTimer: (mode = get().mode, customDuration) => {
        const state = get()
        const preset = mode === 'custom' && customDuration 
          ? { ...state.presets.find(p => p.id === 'custom')!, workDuration: customDuration }
          : state.presets.find(p => p.id === mode) || state.currentPreset
        
        const duration = preset.workDuration * 60 // convert to seconds
        
        const session: TimerSession = {
          id: crypto.randomUUID(),
          start: new Date().toISOString(),
          title: `${preset.name} Session`,
          mode,
          completed: false
        }
        
        set({
          isRunning: true,
          isPaused: false,
          currentTime: duration,
          mode,
          isBreak: false,
          currentPreset: preset,
          currentSession: session
        })
      },
      
      pauseTimer: () => set({ isPaused: true }),
      
      resumeTimer: () => set({ isPaused: false }),
      
      stopTimer: () => {
        const state = get()
        if (state.currentSession) {
          const session = {
            ...state.currentSession,
            end: new Date().toISOString(),
            durationSec: (state.currentPreset.workDuration * 60) - state.currentTime,
            completed: false
          }
          
          set({
            isRunning: false,
            isPaused: false,
            currentTime: 0,
            currentSession: null,
            sessions: [session, ...state.sessions]
          })
        } else {
          set({
            isRunning: false,
            isPaused: false,
            currentTime: 0
          })
        }
      },
      
      resetTimer: () => {
        const duration = get().currentPreset.workDuration * 60
        set({
          isRunning: false,
          isPaused: false,
          currentTime: duration,
          isBreak: false
        })
      },
      
      switchMode: (mode) => {
        const preset = get().presets.find(p => p.id === mode)
        if (preset) {
          set({
            mode,
            currentPreset: preset,
            currentTime: preset.workDuration * 60
          })
        }
      },
      
      updateCurrentTime: (time) => set({ currentTime: time }),
      
      completeSession: (quality = 'mid') => {
        const state = get()
        if (state.currentSession) {
          const session = {
            ...state.currentSession,
            end: new Date().toISOString(),
            durationSec: state.currentPreset.workDuration * 60,
            quality,
            completed: true
          }
          
          set({
            isRunning: false,
            isPaused: false,
            currentTime: 0,
            isBreak: state.autoStartBreaks,
            currentSession: null,
            sessions: [session, ...state.sessions]
          })
          
          // Auto start break if enabled
          if (state.autoStartBreaks) {
            const breakDuration = state.currentPreset.breakDuration * 60
            set({
              isRunning: true,
              currentTime: breakDuration
            })
          }
        }
      },
      
      renameSession: (sessionId, title) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId ? { ...session, title } : session
          )
        }))
      },
      
      setSessionProject: (sessionId, project) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId ? { ...session, project } : session
          )
        }))
      },
      
      setAutoStartBreaks: (enabled) => set({ autoStartBreaks: enabled }),
      setAutoPauseInactive: (enabled) => set({ autoPauseInactive: enabled }),
      setInactiveThreshold: (minutes) => set({ inactiveThreshold: minutes })
    }),
    {
      name: 'timer-store',
      partialize: (state) => ({
        sessions: state.sessions,
        presets: state.presets,
        mode: state.mode,
        autoStartBreaks: state.autoStartBreaks,
        autoPauseInactive: state.autoPauseInactive,
        inactiveThreshold: state.inactiveThreshold
      })
    }
  )
)