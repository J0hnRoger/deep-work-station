// =============================================================================
// DEEP WORK STATION - STORE EXPORTS
// Export centralisé du store unifié et des types
// =============================================================================

// Main unified store
export { useAppStore, type AppStore } from './useAppStore'

// Legacy store exports (for backward compatibility during migration)
export { useTimerStore, type TimerState, type TimerMode, type TimerSession, type TimerPreset } from './timer-store'
export { useAudioStore, type AudioState, type AudioTrack, type Playlist, type EQPreset } from './audio-store'
export { useSettingsStore, type SettingsState, type UserSettings, type AppSettings } from './settings-store'
export { useBackgroundStore, type BackgroundState } from './background-store'

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