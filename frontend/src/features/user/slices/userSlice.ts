// =============================================================================
// USER SLICE - Zustand slice pour la feature User
// =============================================================================

import type { StateCreator } from 'zustand'
import { UserDomain, DEFAULT_USER_STATE } from '../userTypes'
import type { UserSlice } from '../userTypes'
import type { DeepWorkEvent } from '@/core/messaging/deepWorkEventTypes'
import type { AppStore } from '@/store/useAppStore'

export const createUserSlice: StateCreator<AppStore, [], [], UserSlice> = (set, get) => ({
  ...DEFAULT_USER_STATE,
  
  // Actions utilisateur
  setPseudo: (pseudo) => {
    if (!UserDomain.validatePseudo(pseudo)) {
      console.warn('Invalid pseudo:', pseudo)
      return
    }
    
    const sanitizedPseudo = UserDomain.sanitizePseudo(pseudo)
    const existingProfile = get().profile
    
    let profile = existingProfile
    if (!profile) {
      profile = UserDomain.createDefaultProfile(sanitizedPseudo)
    } else {
      profile = {
        ...profile,
        pseudo: sanitizedPseudo,
        lastActiveAt: new Date().toISOString()
      }
    }
    
    // Sauvegarder dans localStorage
    UserDomain.saveToStorage(sanitizedPseudo, profile)
    
    set({
      pseudo: sanitizedPseudo,
      profile,
      isFirstVisit: false,
      isWelcomeDialogOpen: false
    })
    
    // Dispatch event pour notifier les autres features
    get().dispatchGlobalEvent({
      type: 'user_profile_updated',
      payload: { pseudo: sanitizedPseudo, profile },
      timestamp: Date.now(),
      id: `user_update_${Date.now()}`
    })
  },
  
  clearPseudo: () => {
    UserDomain.clearStorage()
    
    set({
      pseudo: null,
      profile: null,
      isFirstVisit: true,
      isWelcomeDialogOpen: false
    })
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'user_logged_out',
      payload: {},
      timestamp: Date.now(),
      id: `user_logout_${Date.now()}`
    })
  },
  
  setIsFirstVisit: (isFirst) => {
    set({ isFirstVisit: isFirst })
  },
  
  setWelcomeDialogOpen: (open) => {
    set({ isWelcomeDialogOpen: open })
  },
  
  initializeUser: () => {
    const { pseudo, profile } = UserDomain.loadFromStorage()
    const isFirst = !UserDomain.isReturningUser()
    
    set({
      pseudo,
      profile,
      isFirstVisit: isFirst,
      isWelcomeDialogOpen: isFirst && !pseudo
    })
    
    // Si utilisateur existant, mettre à jour lastActive
    if (pseudo && profile) {
      get().updateLastActive()
    }
    
    console.log('User initialized:', { pseudo, isFirstVisit: isFirst })
  },
  
  createProfile: (pseudo) => {
    if (!UserDomain.validatePseudo(pseudo)) {
      console.warn('Cannot create profile with invalid pseudo:', pseudo)
      return
    }
    
    const profile = UserDomain.createDefaultProfile(pseudo)
    const sanitizedPseudo = UserDomain.sanitizePseudo(pseudo)
    
    UserDomain.saveToStorage(sanitizedPseudo, profile)
    
    set({
      pseudo: sanitizedPseudo,
      profile,
      isFirstVisit: false,
      isWelcomeDialogOpen: false
    })
    
    // Dispatch event
    get().dispatchGlobalEvent({
      type: 'user_profile_created',
      payload: { pseudo: sanitizedPseudo, profile },
      timestamp: Date.now(),
      id: `user_created_${Date.now()}`
    })
  },
  
  updateLastActive: () => {
    const state = get()
    if (!state.profile || !state.pseudo) return
    
    const updatedProfile = {
      ...state.profile,
      lastActiveAt: new Date().toISOString()
    }
    
    UserDomain.saveToStorage(state.pseudo, updatedProfile)
    set({ profile: updatedProfile })
  },
  
  incrementSessionCount: () => {
    const state = get()
    if (!state.profile || !state.pseudo) return
    
    const updatedProfile = {
      ...state.profile,
      totalSessions: state.profile.totalSessions + 1,
      lastActiveAt: new Date().toISOString()
    }
    
    UserDomain.saveToStorage(state.pseudo, updatedProfile)
    set({ profile: updatedProfile })
    
    // Dispatch event pour stats/achievements
    get().dispatchGlobalEvent({
      type: 'user_session_completed',
      payload: { 
        sessionCount: updatedProfile.totalSessions,
        pseudo: state.pseudo 
      },
      timestamp: Date.now(),
      id: `session_completed_${Date.now()}`
    })
  }
})

/**
 * Fonction d'abonnement aux événements pour le système User
 * Centralise toute la logique de réaction aux événements globaux
 */
export function subscribeUserSystem(
  events: DeepWorkEvent[], 
  state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]
  if (!latestEvent) return
  
  // Réagir à la fin des sessions de timer
  if (latestEvent.type === 'timer_completed') {
    // Incrémenter le compteur de sessions
    state.incrementSessionCount()
    console.log('User system: Session completed, incrementing count')
  }
  
  // Réagir aux changements de settings qui affectent l'utilisateur
  if (latestEvent.type === 'settings_updated') {
    // Mettre à jour lastActive quand les settings changent
    state.updateLastActive()
  }
}