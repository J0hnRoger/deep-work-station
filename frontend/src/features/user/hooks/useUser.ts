// =============================================================================
// USER HOOK - Façade pour accéder au User slice du store global
// =============================================================================

import { useAppStore } from '@/store/useAppStore'

export function useUser() {
  // User state
  const pseudo = useAppStore(state => state.pseudo)
  const isFirstVisit = useAppStore(state => state.isFirstVisit)
  const isWelcomeDialogOpen = useAppStore(state => state.isWelcomeDialogOpen)
  const profile = useAppStore(state => state.profile)
  
  // User actions
  const setPseudo = useAppStore(state => state.setPseudo)
  const clearPseudo = useAppStore(state => state.clearPseudo)
  const setIsFirstVisit = useAppStore(state => state.setIsFirstVisit)
  const setWelcomeDialogOpen = useAppStore(state => state.setWelcomeDialogOpen)
  const initializeUser = useAppStore(state => state.initializeUser)
  const createProfile = useAppStore(state => state.createProfile)
  const updateLastActive = useAppStore(state => state.updateLastActive)
  const incrementSessionCount = useAppStore(state => state.incrementSessionCount)
  
  // Derived state
  const isLoggedIn = !!pseudo
  const displayName = pseudo || 'Anonymous'
  const shouldShowWelcomeDialog = isFirstVisit && !pseudo
  const totalSessions = profile?.totalSessions || 0
  
  return {
    // State
    pseudo,
    isFirstVisit,
    isWelcomeDialogOpen,
    profile,
    
    // Derived state
    isLoggedIn,
    displayName,
    shouldShowWelcomeDialog,
    totalSessions,
    
    // Actions
    setPseudo,
    clearPseudo,
    setIsFirstVisit,
    setWelcomeDialogOpen,
    initializeUser,
    createProfile,
    updateLastActive,
    incrementSessionCount
  }
}