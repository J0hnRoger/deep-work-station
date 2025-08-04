// =============================================================================
// BACKGROUND SERVICE - Service intégré pour la gestion des backgrounds
// Connecte Unsplash au Settings slice
// =============================================================================

import { unsplashService, BACKGROUND_CATEGORIES } from '@/services/unsplash'
import type { UnsplashImage } from '@/services/unsplash'
import type { AppStore } from '@/store/useAppStore'

export class BackgroundService {
  private refreshInterval: NodeJS.Timeout | null = null
  private store: AppStore | null = null
  
  setStore(store: AppStore) {
    this.store = store
  }
  
  /**
   * Récupère une image aléatoire d'Unsplash pour une catégorie donnée
   */
  async fetchRandomImageForCategory(categoryId: string): Promise<UnsplashImage | null> {
    const category = BACKGROUND_CATEGORIES.find(c => c.id === categoryId)
    if (!category) {
      console.warn('Unknown category:', categoryId)
      return null
    }
    
    try {
      console.log('Fetching random image for category:', categoryId)
      const image = await unsplashService.getRandomPhoto(category.query)
      
      if (image) {
        // Track download pour respecter les conditions d'Unsplash
        await unsplashService.trackDownload(image)
        console.log('✅ Fetched image:', image.id, 'by', image.user.name)
      }
      
      return image
    } catch (error) {
      console.error('Error fetching random Unsplash image:', error)
      return null
    }
  }
  
  /**
   * Met à jour le background avec une image Unsplash
   */
  async setUnsplashBackground(categoryId?: string): Promise<boolean> {
    if (!this.store) {
      console.error('BackgroundService: Store not set')
      return false
    }
    
    const state = this.store
    const category = categoryId || state.background.unsplashCategory
    
    const image = await this.fetchRandomImageForCategory(category)
    if (!image) return false
    
    // Utiliser l'URL optimisée pour l'écran
    const optimizedUrl = unsplashService.getOptimizedImageUrl(image, 1920, 1080)

    // Mettre à jour le store
    state.setUnsplashImage(image.id, optimizedUrl, image.user.name)
    
    // Dispatch event pour notifier les autres systèmes
    state.dispatchGlobalEvent({
      type: 'background_changed',
      payload: {
        type: 'unsplash',
        imageId: image.id,
        imageUrl: optimizedUrl,
        author: image.user.name,
        category
      },
      timestamp: Date.now(),
      id: `bg_change_${Date.now()}`
    })
    
    return true
  }
  
  /**
   * Active/désactive l'auto-refresh des backgrounds Unsplash
   */
  setupAutoRefresh(enabled: boolean, intervalMinutes: number = 30) {
    if (!this.store) return
    
    // Nettoyer l'intervalle existant
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    
    if (!enabled) return
    
    console.log(`Setting up auto-refresh every ${intervalMinutes} minutes`)
    
    this.refreshInterval = setInterval(async () => {
      if (!this.store) return
      
      const state = this.store
      if (state.background.unsplashEnabled && state.background.autoRefreshUnsplash) {
        console.log('Auto-refreshing Unsplash background')
        await this.setUnsplashBackground()
      }
    }, intervalMinutes * 60 * 1000)
  }
  
  /**
   * Teste la connexion à l'API Unsplash
   */
  async testConnection(): Promise<boolean> {
    try {
      const photos = await unsplashService.searchPhotos('nature', 1)
      return photos.length > 0
    } catch (error) {
      console.error('Unsplash connection test failed:', error)
      return false
    }
  }
  
  /**
   * Récupère les catégories disponibles
   */
  getAvailableCategories() {
    return BACKGROUND_CATEGORIES
  }
  
  /**
   * Nettoie les ressources (intervalles, etc.)
   */
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }
}

// Instance singleton
export const backgroundService = new BackgroundService()

// Auto-cleanup au unload de la page
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    backgroundService.cleanup()
  })
}