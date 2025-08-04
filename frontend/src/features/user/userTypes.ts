// =============================================================================
// USER FEATURE TYPES - Types et interfaces pour la gestion utilisateur
// =============================================================================

export interface UserProfile {
  pseudo: string
  createdAt: string
  lastActiveAt: string
  totalSessions: number
  preferences: {
    showWelcomeDialog: boolean
    darkMode: boolean
    language: 'en' | 'fr' | 'es' | 'de'
  }
}

export interface UserSlice {
  // État utilisateur
  pseudo: string | null
  isFirstVisit: boolean
  isWelcomeDialogOpen: boolean
  profile: UserProfile | null
  
  // Actions utilisateur
  setPseudo: (pseudo: string) => void
  clearPseudo: () => void
  setIsFirstVisit: (isFirst: boolean) => void
  setWelcomeDialogOpen: (open: boolean) => void
  initializeUser: () => void
  
  // Profile management
  createProfile: (pseudo: string) => void
  updateLastActive: () => void
  incrementSessionCount: () => void
}

// Domaine User - logique métier
export class UserDomain {
  static validatePseudo(pseudo: string): boolean {
    return pseudo.trim().length >= 1 && pseudo.trim().length <= 20
  }
  
  static sanitizePseudo(pseudo: string): string {
    return pseudo.trim().replace(/[<>"/\\&]/g, '')
  }
  
  static createDefaultProfile(pseudo: string): UserProfile {
    return {
      pseudo: UserDomain.sanitizePseudo(pseudo),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalSessions: 0,
      preferences: {
        showWelcomeDialog: true,
        darkMode: true,
        language: 'en'
      }
    }
  }
  
  static isReturningUser(): boolean {
    return !!localStorage.getItem('user-pseudo') || !!localStorage.getItem('user-profile')
  }
  
  static loadFromStorage(): { pseudo: string | null; profile: UserProfile | null } {
    const pseudo = localStorage.getItem('user-pseudo')
    const profileData = localStorage.getItem('user-profile')
    
    let profile: UserProfile | null = null
    if (profileData) {
      try {
        profile = JSON.parse(profileData)
      } catch (error) {
        console.warn('Failed to parse user profile from localStorage:', error)
      }
    }
    
    return { pseudo, profile }
  }
  
  static saveToStorage(pseudo: string, profile: UserProfile) {
    localStorage.setItem('user-pseudo', pseudo)
    localStorage.setItem('user-profile', JSON.stringify(profile))
  }
  
  static clearStorage() {
    localStorage.removeItem('user-pseudo')
    localStorage.removeItem('user-profile')
  }
}

// États par défaut
export const DEFAULT_USER_STATE = {
  pseudo: null,
  isFirstVisit: true,
  isWelcomeDialogOpen: false,
  profile: null
}