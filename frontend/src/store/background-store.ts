import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { unsplashService, type UnsplashImage, 
  type BackgroundCategory, BACKGROUND_CATEGORIES } from '../services/unsplash'

export interface BackgroundState {
  // Current background
  currentImage: UnsplashImage | null
  currentCategory: BackgroundCategory
  
  // Settings
  autoRefresh: boolean
  refreshInterval: number // minutes
  overlayOpacity: number // 0-100
  blurIntensity: number // 0-100
  
  // Image management
  images: Record<string, UnsplashImage[]> // categoryId -> images
  isLoading: boolean
  error: string | null
  lastRefresh: string | null
  
  // Actions
  setCurrentImage: (image: UnsplashImage | null) => void
  setCurrentCategory: (category: BackgroundCategory) => void
  setAutoRefresh: (enabled: boolean) => void
  setRefreshInterval: (minutes: number) => void
  setOverlayOpacity: (opacity: number) => void
  setBlurIntensity: (blur: number) => void
  
  // Image fetching
  fetchImagesForCategory: (category: BackgroundCategory) => Promise<void>
  refreshCurrentImage: () => Promise<void>
  getRandomImageFromCategory: (category: BackgroundCategory) => Promise<void>
  
  // Utility
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearCache: () => void
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentImage: null,
      currentCategory: BACKGROUND_CATEGORIES[0], // nature by default
      
      autoRefresh: true,
      refreshInterval: 30, // 30 minutes
      overlayOpacity: 40, // 40% overlay for better text readability
      blurIntensity: 20, // 20% blur for softer background
      
      images: {},
      isLoading: false,
      error: null,
      lastRefresh: null,
      
      // Actions
      setCurrentImage: (image) => {
        set({ currentImage: image, lastRefresh: new Date().toISOString() })
        
        // Track download for Unsplash API compliance
        if (image) {
          unsplashService.trackDownload(image).catch(console.warn)
        }
      },
      
      setCurrentCategory: (category) => {
        set({ currentCategory: category })
        
        // Auto-fetch images for new category
        get().fetchImagesForCategory(category)
      },
      
      setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
      
      setRefreshInterval: (minutes) => set({ 
        refreshInterval: Math.max(5, Math.min(120, minutes)) // 5-120 minutes
      }),
      
      setOverlayOpacity: (opacity) => set({ 
        overlayOpacity: Math.max(0, Math.min(100, opacity)) 
      }),
      
      setBlurIntensity: (blur) => set({ 
        blurIntensity: Math.max(0, Math.min(100, blur)) 
      }),
      
      // Image fetching
      fetchImagesForCategory: async (category) => {
        const state = get()
        if (state.isLoading) return
        
        set({ isLoading: true, error: null })
        
        try {
          const images = await unsplashService.getPhotosByCategory(category)
          
          console.log('Unsplash images fetched:', {
            category: category.name,
            count: images.length,
            firstImage: images[0]?.id
          })
          
          set(state => ({
            images: {
              ...state.images,
              [category.id]: images
            },
            isLoading: false
          }))
          
          // Set random image if none selected
          if (!state.currentImage && images.length > 0) {
            const randomImage = images[Math.floor(Math.random() * images.length)]
            console.log('Setting random image:', randomImage.id)
            get().setCurrentImage(randomImage)
          }
          
        } catch (error) {
          console.error('Error fetching images:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch images',
            isLoading: false 
          })
        }
      },
      
      refreshCurrentImage: async () => {
        const { currentCategory } = get()
        
        try {
          set({ isLoading: true, error: null })
          
          const image = await unsplashService.getRandomPhoto(currentCategory.query)
          
          if (image) {
            get().setCurrentImage(image)
          }
          
          set({ isLoading: false })
          
        } catch (error) {
          console.error('Error refreshing image:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh image',
            isLoading: false 
          })
        }
      },
      
      getRandomImageFromCategory: async (category) => {
        const state = get()
        const categoryImages = state.images[category.id] || []
        
        if (categoryImages.length > 0) {
          // Use cached images
          const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)]
          get().setCurrentImage(randomImage)
        } else {
          // Fetch new random image
          try {
            set({ isLoading: true, error: null })
            
            const image = await unsplashService.getRandomPhoto(category.query)
            
            if (image) {
              get().setCurrentImage(image)
            }
            
            set({ isLoading: false })
            
          } catch (error) {
            console.error('Error getting random image:', error)
            set({ 
              error: error instanceof Error ? error.message : 'Failed to get image',
              isLoading: false 
            })
          }
        }
      },
      
      // Utility
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearCache: () => set({ images: {}, currentImage: null })
    }),
    {
      name: 'background-store',
      partialize: (state) => ({
        currentCategory: state.currentCategory,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        overlayOpacity: state.overlayOpacity,
        blurIntensity: state.blurIntensity,
        lastRefresh: state.lastRefresh,
        // Don't persist images cache or current image for fresh loads
      })
    }
  )
)