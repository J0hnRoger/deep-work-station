// =============================================================================
// SESSION TRACKING FEATURE TYPES
// =============================================================================

export interface TrackedSession {
  id: string
  date: string // YYYY-MM-DD
  startTime: number // timestamp
  endTime: number // timestamp
  duration: number // secondes effectives
  plannedDuration: number // secondes planifiées
  mode: 'pomodoro' | 'deep-work' | 'custom'
  completed: boolean
  quality?: 'low' | 'medium' | 'high' // auto-évaluation future
}

export interface DayStats {
  date: string // YYYY-MM-DD
  totalTime: number // secondes
  sessionsCount: number
  completedSessions: number
  modes: Record<string, number> // temps par mode
  averageSessionLength: number
  completionRate: number // %
}

export interface WeekStats {
  weekStart: string // YYYY-MM-DD (lundi)
  weekEnd: string // YYYY-MM-DD (dimanche)
  totalTime: number
  totalSessions: number
  completedSessions: number
  dailyStats: DayStats[]
  averageDailyTime: number
  mostProductiveDay: string
  streakDays: number
}

export interface SessionTrackingState {
  // Current tracking
  currentWeekStats: WeekStats | null
  todayStats: DayStats | null
  
  // Historical data
  sessions: TrackedSession[]
  dailyStats: Record<string, DayStats> // date -> stats
  weeklyStats: Record<string, WeekStats> // week-start-date -> stats
  
  // Goals & targets
  dailyGoalMinutes: number
  weeklyGoalMinutes: number
  targetSessionsPerDay: number
  
  // Streaks & achievements
  currentStreak: number // jours consécutifs avec sessions
  longestStreak: number
  totalSessionsAllTime: number
  totalTimeAllTime: number // secondes
  
  // Settings
  trackBreaks: boolean
  minSessionDuration: number // secondes minimum pour compter (20 min = 1200s)
  autoSaveStats: boolean
}

// Session Tracking Domain Logic
export class SessionTrackingDomain {
  // Constants
  static readonly MIN_SESSION_DURATION = 0 //20 * 60 // 20 minutes in seconds
  static readonly MIN_SESSION_DURATION_MINUTES = 20
  
  static getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0]
  }
  
  static getWeekStartDate(date: Date): string {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Lundi comme début de semaine
    const monday = new Date(date.setDate(diff))
    return monday.toISOString().split('T')[0]
  }
  
  static getWeekEndDate(weekStart: string): string {
    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    return endDate.toISOString().split('T')[0]
  }
  
  // Session validation
  static isValidSession(session: TrackedSession): boolean {
    // Vérifier la durée minimum (20 minutes)
    if (session.duration < this.MIN_SESSION_DURATION) {
      console.log(`Session ${session.id} rejected: duration ${session.duration}s < minimum ${this.MIN_SESSION_DURATION}s`)
      return false
    }
    
    return true
  }
  
  // Filter valid sessions only
  static filterValidSessions(sessions: TrackedSession[]): TrackedSession[] {
    return sessions.filter(session => this.isValidSession(session))
  }
  
  static calculateDayStats(sessions: TrackedSession[], date: string): DayStats {
    // Filtrer les sessions valides uniquement
    const validSessions = this.filterValidSessions(sessions)
    const daySessions = validSessions.filter(s => s.date === date)
    const completedSessions = daySessions.filter(s => s.completed)
    
    const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0)
    const modes = daySessions.reduce((acc, s) => {
      acc[s.mode] = (acc[s.mode] || 0) + s.duration
      return acc
    }, {} as Record<string, number>)
    
    return {
      date,
      totalTime,
      sessionsCount: daySessions.length,
      completedSessions: completedSessions.length,
      modes,
      averageSessionLength: daySessions.length > 0 ? totalTime / daySessions.length : 0,
      completionRate: daySessions.length > 0 ? (completedSessions.length / daySessions.length) * 100 : 0
    }
  }
  
  static calculateWeekStats(sessions: TrackedSession[], weekStart: string): WeekStats {
    const weekEnd = this.getWeekEndDate(weekStart)
    // Filtrer les sessions valides uniquement
    const validSessions = this.filterValidSessions(sessions)
    const weekSessions = validSessions.filter(s => s.date >= weekStart && s.date <= weekEnd)
    
    // Générer stats quotidiennes pour la semaine
    const dailyStats: DayStats[] = []
    const currentDate = new Date(weekStart)
    const endDate = new Date(weekEnd)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dailyStats.push(this.calculateDayStats(sessions, dateStr))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    const totalTime = weekSessions.reduce((sum, s) => sum + s.duration, 0)
    const completedSessions = weekSessions.filter(s => s.completed)
    
    // Jour le plus productif
    const mostProductiveDay = dailyStats.reduce((max, day) => 
      day.totalTime > max.totalTime ? day : max
    ).date
    
    // Streak de jours avec au moins une session
    const streakDays = this.calculateStreakDays(dailyStats)
    
    return {
      weekStart,
      weekEnd,
      totalTime,
      totalSessions: weekSessions.length,
      completedSessions: completedSessions.length,
      dailyStats,
      averageDailyTime: totalTime / 7,
      mostProductiveDay,
      streakDays
    }
  }
  
  static calculateStreakDays(dailyStats: DayStats[]): number {
    let streak = 0
    // Compter depuis la fin (aujourd'hui) vers le début
    for (let i = dailyStats.length - 1; i >= 0; i--) {
      if (dailyStats[i].sessionsCount > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }
  
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  
  static formatDurationShort(seconds: number): string {
    const minutes = Math.round(seconds / 60)
    return `${minutes}min`
  }
  
  static isGoalReached(actualMinutes: number, goalMinutes: number): boolean {
    return actualMinutes >= goalMinutes
  }
  
  static calculateCompletionPercentage(actual: number, goal: number): number {
    if (goal === 0) return 0
    return Math.min(100, (actual / goal) * 100)
  }
  
  // Helper pour vérifier si une session est éligible pour créer un arbre
  static isSessionEligibleForTree(session: TrackedSession): boolean {
    return session.completed && this.isValidSession(session)
  }
}

// Session Tracking Actions
export interface SessionTrackingActions {
  // Session management
  addSession: (session: TrackedSession) => void
  updateSession: (sessionId: string, updates: Partial<TrackedSession>) => void
  removeSession: (sessionId: string) => void
  
  // Stats calculation
  refreshTodayStats: () => void
  refreshCurrentWeekStats: () => void
  refreshAllStats: () => void
  
  // Goals management
  setDailyGoal: (minutes: number) => void
  setWeeklyGoal: (minutes: number) => void
  setTargetSessionsPerDay: (sessions: number) => void
  
  // Settings
  setTrackBreaks: (track: boolean) => void
  setMinSessionDuration: (seconds: number) => void
  setAutoSaveStats: (enabled: boolean) => void
  
  // Data management
  clearAllData: () => void
  exportData: () => string // JSON export
  importData: (data: string) => void
}

// Combined Session Tracking Slice Type
export interface SessionTrackingSlice extends SessionTrackingState, SessionTrackingActions {}