// =============================================================================
// SETTINGS SLICE - Zustand slice pour la feature Settings
// =============================================================================

import type { StateCreator } from 'zustand'
import { SettingsDomain, DEFAULT_BACKGROUND_SETTINGS, DEFAULT_UI_SETTINGS, DEFAULT_GENERAL_SETTINGS, DEFAULT_KEYBOARD_SHORTCUTS } from '../settingsTypes'
import type { SettingsSlice } from '../settingsTypes'
import type { DeepWorkEvent } from '@/core/messaging/deepWorkEventTypes'
import type { AppStore } from '@/store/useAppStore'
import { backgroundService } from '../services/backgroundService'

const initialState = {
  // Sections de configuration
  background: DEFAULT_BACKGROUND_SETTINGS,
  ui: DEFAULT_UI_SETTINGS,
  general: DEFAULT_GENERAL_SETTINGS,
  shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
  
  // État UI des settings
  isSettingsOpen: false,
  activeSection: 'general' as const,
  
  // Import/Export
  lastBackupDate: null,
  autoBackup: false,
  backupFrequency: 'weekly' as const,
  
  // Reset & restoration
  hasUnsavedChanges: false,
  canUndo: false,
  canRedo: false
}

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsSlice> = (set, get) => {
  // Initialiser le backgroundService avec le store
  setTimeout(() => {
    backgroundService.setStore(get())
  }, 0)

  return {
    ...initialState,
  
  // Settings Actions
  // Background actions
  setCurrentBackground: (background) => {
    set(state => ({
      background: { ...state.background, currentBackground: background },
      hasUnsavedChanges: true
    }))
  },
  
  setBackgroundType: (type) => {
    set(state => ({
      background: { ...state.background, backgroundType: type },
      hasUnsavedChanges: true
    }))
  },
  
  setBackgroundOpacity: (opacity) => {
    set(state => ({
      background: { ...state.background, backgroundOpacity: Math.max(0, Math.min(100, opacity)) },
      hasUnsavedChanges: true
    }))
  },
  
  setBlurAmount: (blur) => {
    set(state => ({
      background: { ...state.background, blurAmount: Math.max(0, Math.min(20, blur)) },
      hasUnsavedChanges: true
    }))
  },
  
  setCustomBackgroundUrl: (url) => {
    const sanitizedUrl = SettingsDomain.sanitizeBackgroundUrl(url)
    set(state => ({
      background: { ...state.background, customBackgroundUrl: sanitizedUrl },
      hasUnsavedChanges: true
    }))
  },
  
  setEnableAnimations: (enabled) => {
    set(state => ({
      background: { ...state.background, enableAnimations: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setParticleEffects: (enabled) => {
    set(state => ({
      background: { ...state.background, particleEffects: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setWeatherEffects: (enabled) => {
    set(state => ({
      background: { ...state.background, weatherEffects: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setReduceMotion: (enabled) => {
    set(state => ({
      background: { ...state.background, reduceMotion: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setLowPowerMode: (enabled) => {
    set(state => ({
      background: { ...state.background, lowPowerMode: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  // Unsplash actions
  setUnsplashEnabled: (enabled) => {
    set(state => ({
      background: { ...state.background, unsplashEnabled: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setUnsplashCategory: (category) => {
    set(state => ({
      background: { ...state.background, unsplashCategory: category },
      hasUnsavedChanges: true
    }))
  },
  
  setUnsplashImage: (imageId, imageUrl, author) => {
    set(state => ({
      background: { 
        ...state.background, 
        unsplashImageId: imageId,
        unsplashImageUrl: imageUrl,
        unsplashAuthor: author,
        backgroundType: 'image',
        customBackgroundUrl: imageUrl
      },
      hasUnsavedChanges: true
    }))
  },
  
  setAutoRefreshUnsplash: (enabled) => {
    set(state => ({
      background: { ...state.background, autoRefreshUnsplash: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setRefreshIntervalMinutes: (minutes) => {
    set(state => ({
      background: { ...state.background, refreshIntervalMinutes: Math.max(5, Math.min(180, minutes)) },
      hasUnsavedChanges: true
    }))
  },
  
  // UI actions
  setTheme: (theme) => {
    set(state => ({
      ui: { ...state.ui, theme },
      hasUnsavedChanges: true
    }))
    
    // Dispatch event for theme change
    get().dispatchGlobalEvent({
      type: 'theme_changed',
      payload: { theme },
      timestamp: Date.now(),
      id: `theme_change_${Date.now()}`
    })
  },
  
  setAccentColor: (color) => {
    if (SettingsDomain.validateColor(color)) {
      set(state => ({
        ui: { ...state.ui, accentColor: color },
        hasUnsavedChanges: true
      }))
    }
  },
  
  setFontSize: (size) => {
    set(state => ({
      ui: { ...state.ui, fontSize: size },
      hasUnsavedChanges: true
    }))
  },
  
  setFontFamily: (family) => {
    set(state => ({
      ui: { ...state.ui, fontFamily: family },
      hasUnsavedChanges: true
    }))
  },
  
  setCompactMode: (enabled) => {
    set(state => ({
      ui: { ...state.ui, compactMode: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setShowSeconds: (enabled) => {
    set(state => ({
      ui: { ...state.ui, showSeconds: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setHideControls: (enabled) => {
    set(state => ({
      ui: { ...state.ui, hideControls: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setFullscreenMode: (enabled) => {
    set(state => ({
      ui: { ...state.ui, fullscreenMode: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  // View mode actions
  setViewMode: (mode) => {
    set(state => ({
      ui: { ...state.ui, viewMode: mode },
      hasUnsavedChanges: true
    }))
  },
  
  enterForestMode: () => {
    set(state => ({
      ui: { 
        ...state.ui, 
        viewMode: 'forest',
        interfaceVisible: true // Always show interface when entering forest mode
      },
      hasUnsavedChanges: true
    }))
  },
  
  exitForestMode: () => {
    set(state => ({
      ui: { ...state.ui, viewMode: 'timer' },
      hasUnsavedChanges: true
    }))
  },
  
  toggleInterface: () => {
    set(state => ({
      ui: { ...state.ui, interfaceVisible: !state.ui.interfaceVisible },
      hasUnsavedChanges: true
    }))
  },
  
  setInterfaceVisible: (visible) => {
    set(state => ({
      ui: { ...state.ui, interfaceVisible: visible },
      hasUnsavedChanges: true
    }))
  },
  
  setEnableNotifications: (enabled) => {
    set(state => ({
      ui: { ...state.ui, enableNotifications: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setSoundEnabled: (enabled) => {
    set(state => ({
      ui: { ...state.ui, soundEnabled: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setNotificationVolume: (volume) => {
    set(state => ({
      ui: { ...state.ui, notificationVolume: Math.max(0, Math.min(100, volume)) },
      hasUnsavedChanges: true
    }))
  },
  
  setCustomSounds: (enabled) => {
    set(state => ({
      ui: { ...state.ui, customSounds: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  // General actions
  setLanguage: (language) => {
    set(state => ({
      general: { ...state.general, language },
      hasUnsavedChanges: true
    }))
  },
  
  setStartWithSystem: (enabled) => {
    set(state => ({
      general: { ...state.general, startWithSystem: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setMinimizeToTray: (enabled) => {
    set(state => ({
      general: { ...state.general, minimizeToTray: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setCheckUpdates: (enabled) => {
    set(state => ({
      general: { ...state.general, checkUpdates: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setAnalyticsEnabled: (enabled) => {
    set(state => ({
      general: { ...state.general, analyticsEnabled: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setCrashReports: (enabled) => {
    set(state => ({
      general: { ...state.general, crashReports: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setDataSyncEnabled: (enabled) => {
    set(state => ({
      general: { ...state.general, dataSyncEnabled: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setLocalStorageOnly: (enabled) => {
    set(state => ({
      general: { ...state.general, localStorageOnly: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setDeveloperMode: (enabled) => {
    set(state => ({
      general: { ...state.general, developerMode: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setDebugMode: (enabled) => {
    set(state => ({
      general: { ...state.general, debugMode: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  setExperimentalFeatures: (enabled) => {
    set(state => ({
      general: { ...state.general, experimentalFeatures: enabled },
      hasUnsavedChanges: true
    }))
  },
  
  // Shortcuts actions
  setShortcut: (action, shortcut) => {
    if (SettingsDomain.validateShortcut(shortcut)) {
      set(state => ({
        shortcuts: { ...state.shortcuts, [action]: shortcut },
        hasUnsavedChanges: true
      }))
    }
  },
  
  resetShortcuts: () => {
    set({
      shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
      hasUnsavedChanges: true
    })
  },
  
  // Settings UI management
  openSettings: (section = 'general') => {
    set({
      isSettingsOpen: true,
      activeSection: section
    })
  },
  
  closeSettings: () => {
    set({
      isSettingsOpen: false,
      hasUnsavedChanges: false
    })
  },
  
  setActiveSection: (section) => {
    set({ activeSection: section })
  },
  
  // Backup & restore
  exportSettings: () => {
    const state = get()
    return SettingsDomain.exportSettings(state)
  },
  
  importSettings: (data) => {
    try {
      const parsed = JSON.parse(data)
      if (SettingsDomain.validateImportedSettings(parsed)) {
        const mergedSettings = {
          background: SettingsDomain.mergeSettings(DEFAULT_BACKGROUND_SETTINGS, parsed.settings.background),
          ui: SettingsDomain.mergeSettings(DEFAULT_UI_SETTINGS, parsed.settings.ui),
          general: SettingsDomain.mergeSettings(DEFAULT_GENERAL_SETTINGS, parsed.settings.general),
          shortcuts: SettingsDomain.mergeSettings(DEFAULT_KEYBOARD_SHORTCUTS, parsed.settings.shortcuts)
        }
        
        set({
          ...mergedSettings,
          hasUnsavedChanges: true
        })
        
        // Dispatch settings updated event
        get().dispatchGlobalEvent({
          type: 'settings_updated',
          payload: { source: 'import', changes: mergedSettings },
          timestamp: Date.now(),
          id: `settings_import_${Date.now()}`
        })
      }
    } catch (error) {
      console.error('Failed to import settings:', error)
    }
  },
  
  createBackup: () => {
    const exportData = get().exportSettings()
    const backupName = `deep-work-station-backup-${new Date().toISOString().split('T')[0]}.json`
    
    // Create download link
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupName
    a.click()
    URL.revokeObjectURL(url)
    
    set({
      lastBackupDate: new Date().toISOString(),
      hasUnsavedChanges: false
    })
  },
  
  setAutoBackup: (enabled) => {
    set({ autoBackup: enabled })
  },
  
  setBackupFrequency: (frequency) => {
    set({ backupFrequency: frequency })
  },
  
  // Reset & restoration
  resetAllSettings: () => {
    set({
      background: DEFAULT_BACKGROUND_SETTINGS,
      ui: DEFAULT_UI_SETTINGS,
      general: DEFAULT_GENERAL_SETTINGS,
      shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
      hasUnsavedChanges: true
    })
  },
  
  resetSection: (section) => {
    // const state = get()
    switch (section) {
      case 'background':
        set({ background: DEFAULT_BACKGROUND_SETTINGS, hasUnsavedChanges: true })
        break
      case 'ui':
        set({ 
          ui: { 
            ...DEFAULT_UI_SETTINGS, 
            viewMode: 'timer', // Always reset to timer mode
            interfaceVisible: true 
          }, 
          hasUnsavedChanges: true 
        })
        break
      case 'general':
        set({ general: DEFAULT_GENERAL_SETTINGS, hasUnsavedChanges: true })
        break
      case 'shortcuts':
        set({ shortcuts: DEFAULT_KEYBOARD_SHORTCUTS, hasUnsavedChanges: true })
        break
    }
  },
  
  markUnsavedChanges: (hasChanges) => {
    set({ hasUnsavedChanges: hasChanges })
  },
  
  // Unsplash helper methods
  refreshUnsplashBackground: async () => {
    const state = get()
    if (state.background.unsplashEnabled) {
      const success = await backgroundService.setUnsplashBackground()
      if (!success) {
        console.warn('Failed to refresh Unsplash background')
      }
    }
  },
  
  testUnsplashConnection: async () => {
    return await backgroundService.testConnection()
  }
  }
}

/**
 * Fonction d'abonnement aux événements pour le système Settings
 * Centralise toute la logique de réaction aux événements globaux
 */
export function subscribeSettingsSystem(
  events: DeepWorkEvent[], 
  state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]
  if (!latestEvent) return
  
  // Réagir aux changements de thème système
  if (latestEvent.type === 'system_theme_changed') {
    if (state.ui.theme === 'system') {
      // Appliquer automatiquement le thème système
      const effectiveTheme = SettingsDomain.getEffectiveTheme(state.ui.theme)
      console.log('Settings system: System theme changed to', effectiveTheme)
    }
  }
  
  // Réagir aux changements de settings depuis d'autres systèmes
  if (latestEvent.type === 'settings_updated') {
    // Marquer les changements comme non sauvegardés
    state.markUnsavedChanges(true)
  }
}