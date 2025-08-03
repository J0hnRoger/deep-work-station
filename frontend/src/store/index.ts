// Store exports for easy importing
export { useTimerStore, type TimerState, type TimerMode, type TimerSession, type TimerPreset } from './timer-store'
export { useAudioStore, type AudioState, type AudioTrack, type Playlist, type EQPreset } from './audio-store'
export { useSettingsStore, type SettingsState, type UserSettings, type AppSettings } from './settings-store'
export { useBackgroundStore, type BackgroundState } from './background-store'

// Store initialization helper
export const initializeStores = () => {
  // This can be called in main.tsx to ensure stores are properly initialized
  // For now, just importing them will initialize the persisted state
  console.log('Stores initialized')
}