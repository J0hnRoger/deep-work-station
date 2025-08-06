// =============================================================================
// DEEP WORK STATION - EVENT TYPES
// Système de messaging global pour la communication cross-features
// =============================================================================

export interface DeepWorkEvent {
  id: string
  type: string
  payload: any
  timestamp: number
  source?: string
}

// Timer Events
export interface TimerStartedEvent extends DeepWorkEvent {
  type: 'timer_started'
  payload: {
    mode: 'pomodoro' | 'deep-work' | 'custom'
    duration: number
    sessionId?: string
  }
}

// @deprecated - Timer pause/resume are now internal, no events dispatched
export interface TimerPausedEvent extends DeepWorkEvent {
  type: 'timer_paused'
  payload: {
    sessionId?: string
    remainingTime?: number
  }
}

// @deprecated - Timer pause/resume are now internal, no events dispatched
export interface TimerResumedEvent extends DeepWorkEvent {
  type: 'timer_resumed'
  payload: {
    sessionId?: string
    remainingTime?: number
  }
}

// @deprecated - Timer stop is now internal, no events dispatched  
export interface TimerStoppedEvent extends DeepWorkEvent {
  type: 'timer_stopped'
  payload: {
    sessionId?: string
    elapsedTime?: number
  }
}

// New optimized timer events for forest evolution
export interface TimerMidEvent extends DeepWorkEvent {
  type: 'timer_mid'
  payload: {
    sessionId: string
    mode: 'pomodoro' | 'deep-work' | 'custom'
    plannedDuration: number
    progress: number // Should be ~0.5
  }
}

export interface TimerEndEvent extends DeepWorkEvent {
  type: 'timer_end'
  payload: {
    sessionId: string
    mode: 'pomodoro' | 'deep-work' | 'custom'
    actualDuration: number
    completed: boolean
  }
}

// @deprecated - Use timer_mid and timer_end for forest evolution instead
export interface TimerTickEvent extends DeepWorkEvent {
  type: 'timer_tick'
  payload: {
    sessionId: string
    currentTime: number
    plannedDuration: number
    progress: number
  }
}

export interface TimerCompletedEvent extends DeepWorkEvent {
  type: 'timer_completed'
  payload: {
    mode: 'pomodoro' | 'deep-work' | 'custom'
    duration: number
    quality?: 'low' | 'medium' | 'high'
  }
}

// @deprecated - Use timer_completed instead
export interface SessionCompletedEvent extends DeepWorkEvent {
  type: 'session_completed'
  payload: {
    mode: 'pomodoro' | 'deep-work' | 'custom'
    duration: number
    quality?: 'low' | 'medium' | 'high'
  }
}

export interface BreakStartedEvent extends DeepWorkEvent {
  type: 'break_started'
  payload: {
    duration: number
    isLongBreak?: boolean
  }
}

// Audio Events
export interface AudioPlayEvent extends DeepWorkEvent {
  type: 'audio_play'
  payload: {
    trackId?: string
    playlistId?: string
  }
}

export interface AudioPauseEvent extends DeepWorkEvent {
  type: 'audio_pause'
  payload: {
    trackId?: string
  }
}

export interface AudioStopEvent extends DeepWorkEvent {
  type: 'audio_stop'
  payload: {}
}

export interface AudioTrackChangedEvent extends DeepWorkEvent {
  type: 'audio_track_changed'
  payload: {
    trackId: string
    direction: 'next' | 'previous'
  }
}

export interface AudioPlaylistChangedEvent extends DeepWorkEvent {
  type: 'audio_playlist_changed'
  payload: {
    playlistId: string
    playlistName?: string
  }
}

// Session Tracking Events
export interface SessionAddedEvent extends DeepWorkEvent {
  type: 'session_added'
  payload: {
    sessionId: string
    mode: 'pomodoro' | 'deep-work' | 'custom'
    duration: number
    completed: boolean
  }
}

export interface SessionUpdatedEvent extends DeepWorkEvent {
  type: 'session_updated'
  payload: {
    sessionId: string
    updates: any
  }
}

export interface SessionRemovedEvent extends DeepWorkEvent {
  type: 'session_removed'
  payload: {
    sessionId: string
  }
}

export interface StreakUpdatedEvent extends DeepWorkEvent {
  type: 'streak_updated'
  payload: {
    currentStreak: number
    longestStreak: number
  }
}

// Settings Events
export interface SettingsUpdatedEvent extends DeepWorkEvent {
  type: 'settings_updated'
  payload: {
    section: 'background' | 'ui' | 'general' | 'shortcuts' | 'audio' | 'timer' | 'goals'
    changes: any
    source?: 'import' | 'user'
  }
}

export interface ThemeChangedEvent extends DeepWorkEvent {
  type: 'theme_changed'
  payload: {
    theme: 'light' | 'dark' | 'system'
  }
}

export interface BackgroundChangedEvent extends DeepWorkEvent {
  type: 'background_changed'
  payload: {
    type: 'gradient' | 'image' | 'unsplash' | 'custom'
    imageId?: string
    imageUrl?: string
    author?: string
    category?: string
  }
}

// System Events
export interface SystemThemeChangedEvent extends DeepWorkEvent {
  type: 'system_theme_changed'
  payload: {
    theme: 'light' | 'dark'
  }
}

export interface AppInitializedEvent extends DeepWorkEvent {
  type: 'app_initialized'
  payload: {}
}

export interface DateChangedEvent extends DeepWorkEvent {
  type: 'date_changed'
  payload: {
    oldDate: string
    newDate: string
  }
}

// User Events
export interface UserProfileCreatedEvent extends DeepWorkEvent {
  type: 'user_profile_created'
  payload: {
    pseudo: string
    profile: any
  }
}

export interface UserProfileUpdatedEvent extends DeepWorkEvent {
  type: 'user_profile_updated'
  payload: {
    pseudo: string
    profile: any
  }
}

export interface UserLoggedOutEvent extends DeepWorkEvent {
  type: 'user_logged_out'
  payload: {}
}

export interface UserSessionCompletedEvent extends DeepWorkEvent {
  type: 'user_session_completed'
  payload: {
    sessionCount: number
    pseudo: string
  }
}

// Data Management Events
export interface DataClearedEvent extends DeepWorkEvent {
  type: 'data_cleared'
  payload: {}
}

export interface DataImportedEvent extends DeepWorkEvent {
  type: 'data_imported'
  payload: {
    sessionCount: number
  }
}

// Union type for all events
export type DeepWorkEventUnion = 
  | TimerStartedEvent
  | TimerMidEvent
  | TimerEndEvent
  | TimerTickEvent // @deprecated
  | TimerCompletedEvent
  | TimerPausedEvent // @deprecated
  | TimerResumedEvent // @deprecated  
  | TimerStoppedEvent // @deprecated
  | SessionCompletedEvent // @deprecated
  | BreakStartedEvent
  | AudioPlayEvent
  | AudioPauseEvent
  | AudioStopEvent
  | AudioTrackChangedEvent
  | AudioPlaylistChangedEvent
  | SessionAddedEvent
  | SessionUpdatedEvent
  | SessionRemovedEvent
  | StreakUpdatedEvent
  | SettingsUpdatedEvent
  | ThemeChangedEvent
  | SystemThemeChangedEvent
  | AppInitializedEvent
  | DateChangedEvent
  | DataClearedEvent
  | DataImportedEvent

// Helper function to create events
export function createDeepWorkEvent<T extends DeepWorkEvent>(
  type: T['type'],
  payload: T['payload'],
  source?: string
): T {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    source
  } as T
}