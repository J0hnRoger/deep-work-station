// =============================================================================
// SESSION TRACKING SLICE - Zustand slice pour la feature Session Tracking
// =============================================================================

import type { StateCreator } from 'zustand'
import { SessionTrackingDomain } from '../sessionTypes'
import type { SessionTrackingSlice } from '../sessionTypes'
import type { DeepWorkEvent } from '@/core/messaging/deepWorkEventTypes'
import type { AppStore } from '@/store/useAppStore'

const initialState = {
  // Current tracking
  currentWeekStats: null,
  todayStats: null,
  
  // Historical data
  sessions: [],
  dailyStats: {},
  weeklyStats: {},
  
  // Goals & targets
  dailyGoalMinutes: 240, // 4 hours default
  weeklyGoalMinutes: 1200, // 20 hours default
  targetSessionsPerDay: 4,
  
  // Streaks & achievements
  currentStreak: 0,
  longestStreak: 0,
  totalSessionsAllTime: 0,
  totalTimeAllTime: 0,
  
  // Settings
  trackBreaks: false,
  minSessionDuration: 300, // 5 minutes minimum
  autoSaveStats: true
}

export const createSessionTrackingSlice: StateCreator<AppStore> = (set, get) => ({
  ...initialState,
  
  // Session Tracking Actions
  addSession: (session) => {
    const state = get()
    const newSessions = [...state.sessions, session]
    
    set({
      sessions: newSessions,
      totalSessionsAllTime: state.totalSessionsAllTime + 1,
      totalTimeAllTime: state.totalTimeAllTime + session.duration
    })
    
    // Recalculate stats
    get().refreshTodayStats()
    get().refreshCurrentWeekStats()
    
          // Update streaks - will be implemented later
      // get().updateStreaks()
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'session_added',
      payload: { 
        sessionId: session.id,
        mode: session.mode,
        duration: session.duration,
        completed: session.completed
      },
      timestamp: Date.now(),
      id: `session_add_${Date.now()}`
    })
  },
  
  updateSession: (sessionId, updates) => {
    const state = get()
    const sessionIndex = state.sessions.findIndex(s => s.id === sessionId)
    
    if (sessionIndex !== -1) {
      const updatedSessions = [...state.sessions]
      const oldSession = updatedSessions[sessionIndex]
      const newSession = { ...oldSession, ...updates }
      
      updatedSessions[sessionIndex] = newSession
      
      set({ sessions: updatedSessions })
      
      // Recalculate stats if duration changed
      if (updates.duration !== undefined && updates.duration !== oldSession.duration) {
        const durationDiff = updates.duration - oldSession.duration
        set({ totalTimeAllTime: state.totalTimeAllTime + durationDiff })
        
        get().refreshTodayStats()
        get().refreshCurrentWeekStats()
      }
      
      // Dispatch event
      get().dispatchGlobalEvent({
        type: 'session_updated',
        payload: { sessionId, updates },
        timestamp: Date.now(),
        id: `session_update_${Date.now()}`
      })
    }
  },
  
  removeSession: (sessionId) => {
    const state = get()
    const sessionToRemove = state.sessions.find(s => s.id === sessionId)
    
    if (sessionToRemove) {
      const newSessions = state.sessions.filter(s => s.id !== sessionId)
      
      set({
        sessions: newSessions,
        totalSessionsAllTime: state.totalSessionsAllTime - 1,
        totalTimeAllTime: state.totalTimeAllTime - sessionToRemove.duration
      })
      
      // Recalculate stats
      get().refreshTodayStats()
      get().refreshCurrentWeekStats()
      // get().updateStreaks()
      
      // Dispatch event
      get().dispatchGlobalEvent({
        type: 'session_removed',
        payload: { sessionId },
        timestamp: Date.now(),
        id: `session_remove_${Date.now()}`
      })
    }
  },
  
  refreshTodayStats: () => {
    const state = get()
    const today = SessionTrackingDomain.getCurrentDateString()
    const todayStats = SessionTrackingDomain.calculateDayStats(state.sessions, today)
    
    set({
      todayStats,
      dailyStats: { ...state.dailyStats, [today]: todayStats }
    })
  },
  
  refreshCurrentWeekStats: () => {
    const state = get()
    const today = new Date()
    const weekStart = SessionTrackingDomain.getWeekStartDate(today)
    const weekStats = SessionTrackingDomain.calculateWeekStats(state.sessions, weekStart)
    
    set({
      currentWeekStats: weekStats,
      weeklyStats: { ...state.weeklyStats, [weekStart]: weekStats }
    })
  },
  
  refreshAllStats: () => {
    get().refreshTodayStats()
    get().refreshCurrentWeekStats()
          // get().updateStreaks()
  },
  
  setDailyGoal: (minutes) => {
    set({ dailyGoalMinutes: Math.max(0, minutes) })
  },
  
  setWeeklyGoal: (minutes) => {
    set({ weeklyGoalMinutes: Math.max(0, minutes) })
  },
  
  setTargetSessionsPerDay: (sessions) => {
    set({ targetSessionsPerDay: Math.max(0, sessions) })
  },
  
  setTrackBreaks: (track) => {
    set({ trackBreaks: track })
  },
  
  setMinSessionDuration: (seconds) => {
    set({ minSessionDuration: Math.max(0, seconds) })
  },
  
  setAutoSaveStats: (enabled) => {
    set({ autoSaveStats: enabled })
  },
  
  clearAllData: () => {
    set({
      sessions: [],
      dailyStats: {},
      weeklyStats: {},
      currentWeekStats: null,
      todayStats: null,
      currentStreak: 0,
      longestStreak: 0,
      totalSessionsAllTime: 0,
      totalTimeAllTime: 0
    })
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'data_cleared',
      payload: {},
      timestamp: Date.now(),
      id: `data_clear_${Date.now()}`
    })
  },
  
  exportData: () => {
    const state = get()
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      sessions: state.sessions,
      dailyStats: state.dailyStats,
      weeklyStats: state.weeklyStats,
      goals: {
        dailyGoalMinutes: state.dailyGoalMinutes,
        weeklyGoalMinutes: state.weeklyGoalMinutes,
        targetSessionsPerDay: state.targetSessionsPerDay
      },
      achievements: {
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalSessionsAllTime: state.totalSessionsAllTime,
        totalTimeAllTime: state.totalTimeAllTime
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  },
  
  importData: (data) => {
    try {
      const parsed = JSON.parse(data)
      
      if (parsed.version && parsed.sessions) {
        set({
          sessions: parsed.sessions || [],
          dailyStats: parsed.dailyStats || {},
          weeklyStats: parsed.weeklyStats || {},
          dailyGoalMinutes: parsed.goals?.dailyGoalMinutes || 240,
          weeklyGoalMinutes: parsed.goals?.weeklyGoalMinutes || 1200,
          targetSessionsPerDay: parsed.goals?.targetSessionsPerDay || 4,
          currentStreak: parsed.achievements?.currentStreak || 0,
          longestStreak: parsed.achievements?.longestStreak || 0,
          totalSessionsAllTime: parsed.achievements?.totalSessionsAllTime || 0,
          totalTimeAllTime: parsed.achievements?.totalTimeAllTime || 0
        })
        
        // Recalculate current stats
        get().refreshAllStats()
        
        // Dispatch event
        get().dispatchGlobalEvent({
          type: 'data_imported',
          payload: { sessionCount: parsed.sessions?.length || 0 },
          timestamp: Date.now(),
          id: `data_import_${Date.now()}`
        })
      }
    } catch (error) {
      console.error('Failed to import session data:', error)
    }
  },
  
  updateStreaks: () => {
    const state = get()
    const today = SessionTrackingDomain.getCurrentDateString()
    const todayStats = state.dailyStats[today]
    
    if (todayStats && todayStats.sessionsCount > 0) {
      // Calculate current streak
      let streak = 0
      const dates = Object.keys(state.dailyStats).sort().reverse()
      
      for (const date of dates) {
        const dayStats = state.dailyStats[date]
        if (dayStats.sessionsCount > 0) {
          streak++
        } else {
          break
        }
      }
      
      const newLongestStreak = Math.max(state.longestStreak, streak)
      
      set({
        currentStreak: streak,
        longestStreak: newLongestStreak
      })
      
      // Dispatch streak update event
      if (streak !== state.currentStreak) {
        get().dispatchGlobalEvent({
          type: 'streak_updated',
          payload: { currentStreak: streak, longestStreak: newLongestStreak },
          timestamp: Date.now(),
          id: `streak_update_${Date.now()}`
        })
      }
    }
  }
})

/**
 * Fonction d'abonnement aux événements pour le système Session Tracking
 * Centralise toute la logique de réaction aux événements globaux
 */
export function subscribeSessionTrackingSystem(
  events: DeepWorkEvent[], 
  state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]
  if (!latestEvent) return
  
  // Réagir aux sessions complétées
  if (latestEvent.type === 'session_completed') {
    // Les sessions sont déjà ajoutées via le timer slice
    // Ici on peut ajouter des logiques supplémentaires comme:
    // - Notifications de succès
    // - Achèvements débloqués
    // - Statistiques spéciales
    console.log('Session tracking: Session completed', latestEvent.payload)
  }
  
  // Réagir aux changements de settings
  if (latestEvent.type === 'settings_updated') {
    if (latestEvent.payload.section === 'goals') {
      // Recalculer les statistiques si les objectifs ont changé
      state.refreshAllStats()
    }
  }
  
  // Réagir aux changements de date (minuit)
  if (latestEvent.type === 'date_changed') {
    // Recalculer les statistiques pour le nouveau jour
    state.refreshTodayStats()
    state.refreshCurrentWeekStats()
    // state.updateStreaks()
  }
}