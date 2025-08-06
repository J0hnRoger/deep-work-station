// =============================================================================
// TIMER FEATURE TYPES
// =============================================================================

export type TimerMode = 'pomodoro' | 'deep-work' | 'custom'

export interface TimerPreset {
  id: TimerMode
  name: string
  workDuration: number // minutes
  breakDuration: number // minutes
  color: string
}

export interface TimerSession {
  id: string
  mode: TimerMode
  startTime: number
  endTime?: number
  plannedDuration: number // secondes
  actualDuration?: number // secondes
  completed: boolean
  paused: boolean
  pausedTime?: number
}

export interface TimerState {
  // Current session
  currentSession: TimerSession | null
  isRunning: boolean
  isPaused: boolean
  timerCurrentTime: number // secondes restantes - renommé pour éviter confusion avec audio
  
  // Configuration
  mode: TimerMode
  currentPreset: TimerPreset
  customDuration: number // minutes
  
  // Break management
  isBreak: boolean
  breakTime: number // secondes restantes
  
  // Timer interne
  timerInterval: NodeJS.Timeout | null
  
  // Session management
  sessionsToday: number
  completedSessions: number
  
  // Auto features
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  longBreakInterval: number // après combien de sessions
  autoPauseInactive: boolean
  inactiveThreshold: number // minutes
}

// Default presets
export const DEFAULT_TIMER_PRESETS: TimerPreset[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    workDuration: 25,
    breakDuration: 5,
    color: '#ef4444'
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    workDuration: 50,
    breakDuration: 10,
    color: '#3b82f6'
  },
  {
    id: 'custom',
    name: 'Custom',
    workDuration: 1,
    breakDuration: 1,
    color: '#8b5cf6'
  }
]

// Timer Domain Logic
export class TimerDomain {
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  static createSession(mode: TimerMode, preset: TimerPreset): TimerSession {
    return {
      id: this.generateSessionId(),
      mode,
      startTime: Date.now(),
      plannedDuration: preset.workDuration * 60,
      completed: false,
      paused: false
    }
  }
  
  static calculateProgress(currentTime: number, totalTime: number): number {
    return Math.max(0, Math.min(100, ((totalTime - currentTime) / totalTime) * 100))
  }
  
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  static shouldTriggerLongBreak(completedSessions: number, interval: number): boolean {
    return completedSessions > 0 && completedSessions % interval === 0
  }
}

// Timer Actions Types
export interface TimerActions {
  startTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  completeSession: () => void
  startBreak: () => void
  switchMode: (mode: TimerMode) => void
  setCustomDuration: (minutes: number) => void
  updateTimerCurrentTime: (time: number) => void // renommé pour éviter confusion avec audio
  setAutoStartBreaks: (enabled: boolean) => void
  setAutoStartPomodoros: (enabled: boolean) => void
  setLongBreakInterval: (interval: number) => void
  setAutoPauseInactive: (enabled: boolean) => void
  setInactiveThreshold: (minutes: number) => void
  
  // Nouveaux pour timer interne
  startInternalTimer: () => void
  stopInternalTimer: () => void
}

// Combined Timer Slice Type
export interface TimerSlice extends TimerState, TimerActions {}