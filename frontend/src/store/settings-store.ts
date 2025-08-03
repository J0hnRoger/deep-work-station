import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserSettings {
  // User identity
  pseudo: string | null
  isFirstVisit: boolean
  
  // UI preferences
  theme: 'dark' // Only dark for now, but prepared for multiple themes
  compactMode: boolean
  showWelcome: boolean
  
  // Keyboard shortcuts
  enableGlobalShortcuts: boolean
  commandPaletteKey: string // default 'ctrl+k'
  
  // Notifications
  enableNotifications: boolean
  notifyOnSessionComplete: boolean
  notifyOnBreakStart: boolean
  
  // Privacy & Data
  shareUsageStats: boolean
  autoSaveProjects: boolean
  
  // Advanced
  debugMode: boolean
  experimentalFeatures: boolean
}

export interface AppSettings {
  // App state
  lastActiveTab: string
  windowState: 'focused' | 'blurred'
  lastActiveTime: string // ISO string
  
  // Feature flags
  enableCommandPalette: boolean
  enableMediaKeys: boolean
  enableWebAudio: boolean
  
  // Performance
  enableAnimations: boolean
  reducedMotion: boolean
  
  // Development
  showDevTools: boolean
}

export interface SettingsState {
  user: UserSettings
  app: AppSettings
  
  // Actions
  // User settings
  setPseudo: (pseudo: string) => void
  setFirstVisit: (isFirst: boolean) => void
  setTheme: (theme: 'dark') => void
  setCompactMode: (compact: boolean) => void
  setShowWelcome: (show: boolean) => void
  setEnableGlobalShortcuts: (enabled: boolean) => void
  setCommandPaletteKey: (key: string) => void
  setEnableNotifications: (enabled: boolean) => void
  setNotifyOnSessionComplete: (enabled: boolean) => void
  setNotifyOnBreakStart: (enabled: boolean) => void
  setShareUsageStats: (enabled: boolean) => void
  setAutoSaveProjects: (enabled: boolean) => void
  setDebugMode: (enabled: boolean) => void
  setExperimentalFeatures: (enabled: boolean) => void
  
  // App settings
  setLastActiveTab: (tab: string) => void
  setWindowState: (state: 'focused' | 'blurred') => void
  updateLastActiveTime: () => void
  setEnableCommandPalette: (enabled: boolean) => void
  setEnableMediaKeys: (enabled: boolean) => void
  setEnableWebAudio: (enabled: boolean) => void
  setEnableAnimations: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
  setShowDevTools: (enabled: boolean) => void
  
  // Bulk updates
  resetUserSettings: () => void
  resetAppSettings: () => void
  exportSettings: () => string
  importSettings: (settingsJson: string) => boolean
}

const defaultUserSettings: UserSettings = {
  pseudo: null,
  isFirstVisit: true,
  theme: 'dark',
  compactMode: false,
  showWelcome: true,
  enableGlobalShortcuts: true,
  commandPaletteKey: 'ctrl+k',
  enableNotifications: true,
  notifyOnSessionComplete: true,
  notifyOnBreakStart: false,
  shareUsageStats: false,
  autoSaveProjects: true,
  debugMode: false,
  experimentalFeatures: false
}

const defaultAppSettings: AppSettings = {
  lastActiveTab: 'timer',
  windowState: 'focused',
  lastActiveTime: new Date().toISOString(),
  enableCommandPalette: true,
  enableMediaKeys: true,
  enableWebAudio: true,
  enableAnimations: true,
  reducedMotion: false,
  showDevTools: false
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      user: defaultUserSettings,
      app: defaultAppSettings,
      
      // User settings actions
      setPseudo: (pseudo) => set(state => ({ 
        user: { ...state.user, pseudo, isFirstVisit: false } 
      })),
      
      setFirstVisit: (isFirst) => set(state => ({ 
        user: { ...state.user, isFirstVisit: isFirst } 
      })),
      
      setTheme: (theme) => set(state => ({ 
        user: { ...state.user, theme } 
      })),
      
      setCompactMode: (compact) => set(state => ({ 
        user: { ...state.user, compactMode: compact } 
      })),
      
      setShowWelcome: (show) => set(state => ({ 
        user: { ...state.user, showWelcome: show } 
      })),
      
      setEnableGlobalShortcuts: (enabled) => set(state => ({ 
        user: { ...state.user, enableGlobalShortcuts: enabled },
        app: { ...state.app, enableMediaKeys: enabled }
      })),
      
      setCommandPaletteKey: (key) => set(state => ({ 
        user: { ...state.user, commandPaletteKey: key } 
      })),
      
      setEnableNotifications: (enabled) => set(state => ({ 
        user: { ...state.user, enableNotifications: enabled } 
      })),
      
      setNotifyOnSessionComplete: (enabled) => set(state => ({ 
        user: { ...state.user, notifyOnSessionComplete: enabled } 
      })),
      
      setNotifyOnBreakStart: (enabled) => set(state => ({ 
        user: { ...state.user, notifyOnBreakStart: enabled } 
      })),
      
      setShareUsageStats: (enabled) => set(state => ({ 
        user: { ...state.user, shareUsageStats: enabled } 
      })),
      
      setAutoSaveProjects: (enabled) => set(state => ({ 
        user: { ...state.user, autoSaveProjects: enabled } 
      })),
      
      setDebugMode: (enabled) => set(state => ({ 
        user: { ...state.user, debugMode: enabled },
        app: { ...state.app, showDevTools: enabled }
      })),
      
      setExperimentalFeatures: (enabled) => set(state => ({ 
        user: { ...state.user, experimentalFeatures: enabled } 
      })),
      
      // App settings actions
      setLastActiveTab: (tab) => set(state => ({ 
        app: { ...state.app, lastActiveTab: tab } 
      })),
      
      setWindowState: (windowState) => set(state => ({ 
        app: { ...state.app, windowState } 
      })),
      
      updateLastActiveTime: () => set(state => ({ 
        app: { ...state.app, lastActiveTime: new Date().toISOString() } 
      })),
      
      setEnableCommandPalette: (enabled) => set(state => ({ 
        app: { ...state.app, enableCommandPalette: enabled } 
      })),
      
      setEnableMediaKeys: (enabled) => set(state => ({ 
        app: { ...state.app, enableMediaKeys: enabled } 
      })),
      
      setEnableWebAudio: (enabled) => set(state => ({ 
        app: { ...state.app, enableWebAudio: enabled } 
      })),
      
      setEnableAnimations: (enabled) => set(state => ({ 
        app: { ...state.app, enableAnimations: enabled } 
      })),
      
      setReducedMotion: (enabled) => set(state => ({ 
        app: { ...state.app, reducedMotion: enabled } 
      })),
      
      setShowDevTools: (enabled) => set(state => ({ 
        app: { ...state.app, showDevTools: enabled } 
      })),
      
      // Bulk operations
      resetUserSettings: () => set(state => ({ 
        user: { ...defaultUserSettings, pseudo: state.user.pseudo } 
      })),
      
      resetAppSettings: () => set({ app: defaultAppSettings }),
      
      exportSettings: () => {
        const { user, app } = get()
        return JSON.stringify({ user, app }, null, 2)
      },
      
      importSettings: (settingsJson) => {
        try {
          const settings = JSON.parse(settingsJson)
          if (settings.user && settings.app) {
            set({
              user: { ...defaultUserSettings, ...settings.user },
              app: { ...defaultAppSettings, ...settings.app }
            })
            return true
          }
          return false
        } catch (error) {
          console.error('Failed to import settings:', error)
          return false
        }
      }
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({
        user: state.user,
        app: {
          ...state.app,
          windowState: 'focused', // Don't persist window state
          lastActiveTime: new Date().toISOString() // Update on load
        }
      })
    }
  )
)