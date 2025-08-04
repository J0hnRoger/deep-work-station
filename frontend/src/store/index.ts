// =============================================================================
// DEEP WORK STATION - STORE EXPORTS
// Export centralisé du store unifié et des types
// =============================================================================

// Main unified store
export { useAppStore, type AppStore } from './useAppStore'

// Types re-exports from features for convenience
export type { TimerSlice, TimerMode, TimerSession, TimerPreset } from '@/features/timer/timerTypes'
export type { AudioSlice, AudioTrack, Playlist, EQPreset } from '@/features/audio/audioTypes'
export type { SessionTrackingSlice, TrackedSession, DayStats, WeekStats } from '@/features/session-tracking/sessionTypes'
export type { SettingsSlice, BackgroundSettings, UISettings, GeneralSettings, KeyboardShortcuts } from '@/features/settings/settingsTypes'

// Store initialization helper
export const initializeStores = () => {
  // Initialize the unified store
  const { useAppStore } = require('./useAppStore')
  const appStore = useAppStore.getState()
  
  if (!appStore.isAppInitialized) {
    appStore.initializeApp()
  }
  
  console.log('Deep Work Station stores initialized')
}