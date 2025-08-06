// =============================================================================
// SETTINGS FEATURE TYPES - Configuration globale de l'application
// =============================================================================

export interface BackgroundSettings {
  // Background visuel
  currentBackground: string
  backgroundType: 'solid' | 'gradient' | 'image' | 'video'
  backgroundOpacity: number // 0-100
  blurAmount: number // 0-20px
  customBackgroundUrl?: string
  
  // Unsplash integration
  unsplashEnabled: boolean
  unsplashCategory: string
  unsplashImageId?: string
  unsplashImageUrl?: string
  unsplashAuthor?: string
  autoRefreshUnsplash: boolean
  refreshIntervalMinutes: number
  
  // Animations
  enableAnimations: boolean
  particleEffects: boolean
  weatherEffects: boolean
  
  // Performance
  reduceMotion: boolean
  lowPowerMode: boolean
}

export interface UISettings {
  // Theme
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  fontFamily: string
  
  // Layout
  compactMode: boolean
  showSeconds: boolean
  hideControls: boolean
  fullscreenMode: boolean
  
  // View modes
  viewMode: 'timer' | 'forest'
  interfaceVisible: boolean
  
  // Notifications
  enableNotifications: boolean
  soundEnabled: boolean
  notificationVolume: number // 0-100
  customSounds: boolean
}

export interface GeneralSettings {
  // Application
  language: 'en' | 'fr' | 'es' | 'de'
  startWithSystem: boolean
  minimizeToTray: boolean
  checkUpdates: boolean
  
  // Data & Privacy
  analyticsEnabled: boolean
  crashReports: boolean
  dataSyncEnabled: boolean
  localStorageOnly: boolean
  
  // Advanced
  developerMode: boolean
  debugMode: boolean
  experimentalFeatures: boolean
}

export interface KeyboardShortcuts {
  toggleTimer: string
  pauseResume: string
  resetTimer: string
  skipSession: string
  openSettings: string
  toggleFullscreen: string
  volumeUp: string
  volumeDown: string
  nextTrack: string
  previousTrack: string
}

export interface SettingsState {
  // Sections de configuration
  background: BackgroundSettings
  ui: UISettings
  general: GeneralSettings
  shortcuts: KeyboardShortcuts
  
  // État UI des settings
  isSettingsOpen: boolean
  activeSection: 'general' | 'appearance' | 'audio' | 'timer' | 'shortcuts' | 'advanced'
  
  // Import/Export
  lastBackupDate: string | null
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  
  // Reset & restoration
  hasUnsavedChanges: boolean
  canUndo: boolean
  canRedo: boolean
}

// Default settings
export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  currentBackground: 'nature',
  backgroundType: 'image',
  backgroundOpacity: 70,
  blurAmount: 0,
  
  // Unsplash defaults - activé par défaut
  unsplashEnabled: true,
  unsplashCategory: 'nature',
  autoRefreshUnsplash: false,
  refreshIntervalMinutes: 30,
  
  enableAnimations: true,
  particleEffects: false,
  weatherEffects: false,
  reduceMotion: false,
  lowPowerMode: false
}

export const DEFAULT_UI_SETTINGS: UISettings = {
  theme: 'system',
  accentColor: '#3b82f6',
  fontSize: 'medium',
  fontFamily: 'Inter, system-ui',
  compactMode: false,
  showSeconds: true,
  hideControls: false,
  fullscreenMode: false,
  viewMode: 'timer',
  interfaceVisible: true,
  enableNotifications: true,
  soundEnabled: true,
  notificationVolume: 70,
  customSounds: false
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  language: 'en',
  startWithSystem: false,
  minimizeToTray: false,
  checkUpdates: true,
  analyticsEnabled: false,
  crashReports: true,
  dataSyncEnabled: false,
  localStorageOnly: true,
  developerMode: false,
  debugMode: false,
  experimentalFeatures: false
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
  toggleTimer: 'Space',
  pauseResume: 'Space',
  resetTimer: 'Escape',
  skipSession: 'Tab',
  openSettings: 'Ctrl+,',
  toggleFullscreen: 'F11',
  volumeUp: 'ArrowUp',
  volumeDown: 'ArrowDown',
  nextTrack: 'ArrowRight',
  previousTrack: 'ArrowLeft'
}

// Settings Domain Logic
export class SettingsDomain {
  static validateShortcut(shortcut: string): boolean {
    // Valider format des raccourcis clavier
    const validKeys = /^(Ctrl\+|Alt\+|Shift\+|Meta\+)*(F[1-9]|F1[0-2]|[A-Za-z]|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Space|Enter|Escape|Tab)$/
    return validKeys.test(shortcut)
  }
  
  static validateColor(color: string): boolean {
    // Valider format couleur hex
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }
  
  static sanitizeBackgroundUrl(url: string): string {
    // Nettoyer URL background pour sécurité
    try {
      const parsed = new URL(url)
      return ['http:', 'https:', 'blob:', 'data:'].includes(parsed.protocol) ? url : ''
    } catch {
      return ''
    }
  }
  
  static exportSettings(settings: SettingsState): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: {
        background: settings.background,
        ui: settings.ui,
        general: settings.general,
        shortcuts: settings.shortcuts
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }
  
  static validateImportedSettings(data: any): boolean {
    return (
      data &&
      data.version &&
      data.settings &&
      typeof data.settings.background === 'object' &&
      typeof data.settings.ui === 'object' &&
      typeof data.settings.general === 'object' &&
      typeof data.settings.shortcuts === 'object'
    )
  }
  
  static mergeSettings<T extends Record<string, any>>(
    defaults: T, 
    imported: Partial<T>
  ): T {
    const merged = { ...defaults }
    
    Object.keys(imported).forEach(key => {
      if (key in defaults && typeof defaults[key] === typeof imported[key] && imported[key] !== undefined) {
        (merged as any)[key] = imported[key]
      }
    })
    
    return merged
  }
  
  static getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  
  static getEffectiveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
    return theme === 'system' ? this.getSystemTheme() : theme
  }
}

// Settings Actions Types
export interface SettingsActions {
  // Background actions
  setCurrentBackground: (background: string) => void
  setBackgroundType: (type: BackgroundSettings['backgroundType']) => void
  setBackgroundOpacity: (opacity: number) => void
  setBlurAmount: (blur: number) => void
  setCustomBackgroundUrl: (url: string) => void
  setEnableAnimations: (enabled: boolean) => void
  setParticleEffects: (enabled: boolean) => void
  setWeatherEffects: (enabled: boolean) => void
  setReduceMotion: (enabled: boolean) => void
  setLowPowerMode: (enabled: boolean) => void
  
  // Unsplash actions
  setUnsplashEnabled: (enabled: boolean) => void
  setUnsplashCategory: (category: string) => void
  setUnsplashImage: (imageId: string, imageUrl: string, author: string) => void
  setAutoRefreshUnsplash: (enabled: boolean) => void
  setRefreshIntervalMinutes: (minutes: number) => void
  
  // UI actions
  setTheme: (theme: UISettings['theme']) => void
  setAccentColor: (color: string) => void
  setFontSize: (size: UISettings['fontSize']) => void
  setFontFamily: (family: string) => void
  setCompactMode: (enabled: boolean) => void
  setShowSeconds: (enabled: boolean) => void
  setHideControls: (enabled: boolean) => void
  setFullscreenMode: (enabled: boolean) => void
  
  // View mode actions
  setViewMode: (mode: UISettings['viewMode']) => void
  enterForestMode: () => void
  exitForestMode: () => void
  toggleInterface: () => void
  setInterfaceVisible: (visible: boolean) => void
  
  setEnableNotifications: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setNotificationVolume: (volume: number) => void
  setCustomSounds: (enabled: boolean) => void
  
  // General actions
  setLanguage: (language: GeneralSettings['language']) => void
  setStartWithSystem: (enabled: boolean) => void
  setMinimizeToTray: (enabled: boolean) => void
  setCheckUpdates: (enabled: boolean) => void
  setAnalyticsEnabled: (enabled: boolean) => void
  setCrashReports: (enabled: boolean) => void
  setDataSyncEnabled: (enabled: boolean) => void
  setLocalStorageOnly: (enabled: boolean) => void
  setDeveloperMode: (enabled: boolean) => void
  setDebugMode: (enabled: boolean) => void
  setExperimentalFeatures: (enabled: boolean) => void
  
  // Shortcuts actions
  setShortcut: (action: keyof KeyboardShortcuts, shortcut: string) => void
  resetShortcuts: () => void
  
  // Settings UI management
  openSettings: (section?: SettingsState['activeSection']) => void
  closeSettings: () => void
  setActiveSection: (section: SettingsState['activeSection']) => void
  
  // Backup & restore
  exportSettings: () => string
  importSettings: (data: string) => void
  createBackup: () => void
  setAutoBackup: (enabled: boolean) => void
  setBackupFrequency: (frequency: SettingsState['backupFrequency']) => void
  
  // Reset & restoration
  resetAllSettings: () => void
  resetSection: (section: 'background' | 'ui' | 'general' | 'shortcuts') => void
  markUnsavedChanges: (hasChanges: boolean) => void
  
  // Unsplash helper methods
  refreshUnsplashBackground: () => Promise<void>
  testUnsplashConnection: () => Promise<boolean>
}

// Combined Settings Slice Type
export interface SettingsSlice extends SettingsState, SettingsActions {}