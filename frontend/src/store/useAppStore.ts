// =============================================================================
// DEEP WORK STATION - UNIFIED APP STORE
// Combine tous les feature slices avec système d'événements centralisé
// =============================================================================

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

// Core messaging system
import type { DeepWorkEvent } from '@/core/messaging/deepWorkEventTypes'

// Feature slices
import { createTimerSlice, subscribeTimerSystem } from '@/features/timer/slices/timerSlice'
import type { TimerSlice } from '@/features/timer/timerTypes'

import { createAudioSlice, subscribeAudioSystem } from '@/features/audio/slices/audioSlice'
import type { AudioSlice } from '@/features/audio/audioTypes'

import { createSessionTrackingSlice, subscribeSessionTrackingSystem } from '@/features/session-tracking/slices/sessionSlice'
import type { SessionTrackingSlice } from '@/features/session-tracking/sessionTypes'

import { createSettingsSlice, subscribeSettingsSystem } from '@/features/settings/slices/settingsSlice'
import type { SettingsSlice } from '@/features/settings/settingsTypes'

import { createUserSlice, subscribeUserSystem } from '@/features/user/slices/userSlice'
import type { UserSlice } from '@/features/user/userTypes'

// Combined App Store Interface
export interface AppStore extends 
  TimerSlice,
  AudioSlice,
  SessionTrackingSlice,
  SettingsSlice,
  UserSlice {
  // Event-driven system
  globalEvents: DeepWorkEvent[]
  dispatchGlobalEvent: (event: DeepWorkEvent) => void
  clearGlobalEvents: () => void
  
  // App lifecycle
  isAppInitialized: boolean
  initializeApp: () => void
}

// --- Store Creation ---
export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...a) => {
          const [set, get] = a
          // Create slices without circular reference
          const timerSlice = createTimerSlice(...a)
          const audioSlice = createAudioSlice(...a)
          const sessionSlice = createSessionTrackingSlice(...a)
          const settingsSlice = createSettingsSlice(...a)
          const userSlice = createUserSlice(...a)
          
          return {
            // Combine all feature slices
            ...timerSlice,
            ...audioSlice,
            ...sessionSlice,
            ...settingsSlice,
            ...userSlice,
          
          // Event system state
          globalEvents: [] as DeepWorkEvent[],
          
          // Event system actions
          dispatchGlobalEvent: (event: DeepWorkEvent) => {
            const currentEvents = get().globalEvents
            
            // Add event to queue
            set({ globalEvents: [...currentEvents, event] })
            
            // Auto-clear events after processing to prevent memory leaks
            // Keep only last 50 events for debugging
            if (currentEvents.length > 50) {
              set({ globalEvents: [...currentEvents.slice(-25), event] })
            }
          },
          
          clearGlobalEvents: () => {
            set({ globalEvents: [] })
          },
          
          // App lifecycle
          isAppInitialized: false,
          
          initializeApp: () => {
            if (get().isAppInitialized) return
            
            // Initialize all features
            get().refreshTodayStats()
            get().refreshCurrentWeekStats()
            get().initializeUser()
            
            // Setup system theme listener
            if (typeof window !== 'undefined' && window.matchMedia) {
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
              mediaQuery.addEventListener('change', (e) => {
                get().dispatchGlobalEvent({
                  type: 'system_theme_changed',
                  payload: { theme: e.matches ? 'dark' : 'light' },
                  timestamp: Date.now(),
                  id: `theme_${Date.now()}`
                })
              })
            }
            
            set({ isAppInitialized: true })
            
            // Dispatch app initialized event
            get().dispatchGlobalEvent({
              type: 'app_initialized',
              payload: {},
              timestamp: Date.now(),
              id: `init_${Date.now()}`
            })
          }
        }
      },
        {
          name: 'deep-work-station-store',
          partialize: (state) => ({
            // Persist Timer settings
            mode: state.mode,
            currentPreset: state.currentPreset,
            customDuration: state.customDuration,
            autoStartBreaks: state.autoStartBreaks,
            autoStartPomodoros: state.autoStartPomodoros,
            longBreakInterval: state.longBreakInterval,
            
            // Persist Audio settings  
            volume: state.volume,
            eqPreset: state.eqPreset,
            shuffleMode: state.shuffleMode,
            repeatMode: state.repeatMode,
            playlists: state.playlists,
            autoPlayOnTimerStart: state.autoPlayOnTimerStart,
            autoPauseOnTimerPause: state.autoPauseOnTimerPause,
            autoStopOnTimerComplete: state.autoStopOnTimerComplete,
            focusPlaylistId: state.focusPlaylistId,
            breakPlaylistId: state.breakPlaylistId,
            
            // Persist Session Tracking data
            sessions: state.sessions,
            dailyStats: state.dailyStats,
            weeklyStats: state.weeklyStats,
            dailyGoalMinutes: state.dailyGoalMinutes,
            weeklyGoalMinutes: state.weeklyGoalMinutes,
            targetSessionsPerDay: state.targetSessionsPerDay,
            currentStreak: state.currentStreak,
            longestStreak: state.longestStreak,
            totalSessionsAllTime: state.totalSessionsAllTime,
            totalTimeAllTime: state.totalTimeAllTime,
            trackBreaks: state.trackBreaks,
            minSessionDuration: state.minSessionDuration,
            autoSaveStats: state.autoSaveStats,
            
            // Persist Settings
            background: state.background,
            ui: state.ui,
            general: state.general,
            shortcuts: state.shortcuts,
            autoBackup: state.autoBackup,
            backupFrequency: state.backupFrequency,
            lastBackupDate: state.lastBackupDate,
            
            // Persist User data
            pseudo: state.pseudo,
            profile: state.profile,
            isFirstVisit: state.isFirstVisit
          })
        }
      )
    ),
    {
      name: 'DeepWorkStation'
    }
  )
)

// === EVENT-DRIVEN SUBSCRIPTIONS ===
// Chaque feature slice s'abonne aux événements qui l'intéressent
// Architecture event-driven avec séparation des préoccupations

// Subscription centralisée pour tous les systèmes
useAppStore.subscribe(
  (state) => state.globalEvents,
  (events) => {
    const state = useAppStore.getState()
    
    // Déléguer la gestion des événements aux feature systems
    subscribeTimerSystem(events, state)
    subscribeAudioSystem(events, state)
    subscribeSessionTrackingSystem(events, state)
    subscribeSettingsSystem(events, state)
    subscribeUserSystem(events, state)
  }
)

// Auto-initialize app on first use
if (typeof window !== 'undefined') {
  // Initialize app after first render
  setTimeout(() => {
    useAppStore.getState().initializeApp()
  }, 0)
}