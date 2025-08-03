const UNSPLASH_ACCESS_KEY = 'M624w_YHpgnMFf6ZWXfmh3CqwtgVXvaoaqauWTvgRQ4'
const UNSPLASH_BASE_URL = 'https://api.unsplash.com'

export interface UnsplashImage {
  id: string
  description: string | null
  alt_description: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
  }
  location?: {
    name: string
  }
}

export interface BackgroundCategory {
  id: string
  name: string
  query: string
  description: string
}

export const BACKGROUND_CATEGORIES: BackgroundCategory[] = [
  {
    id: 'nature',
    name: 'Nature',
    query: 'nature,landscape,peaceful,serene',
    description: 'Peaceful natural landscapes'
  },
  {
    id: 'forest',
    name: 'Forest',
    query: 'forest,trees,woodland,peaceful',
    description: 'Calming forest scenes'
  },
  {
    id: 'mountains',
    name: 'Mountains',
    query: 'mountains,peaks,scenic,majestic',
    description: 'Majestic mountain views'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    query: 'ocean,sea,waves,calm,blue',
    description: 'Tranquil ocean scenes'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    query: 'minimal,clean,simple,geometric',
    description: 'Clean minimal designs'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    query: 'sunset,golden hour,warm,peaceful',
    description: 'Warm sunset scenes'
  }
]

class UnsplashService {
  private cache = new Map<string, UnsplashImage[]>()
  private cacheExpiry = 60 * 60 * 1000 // 1 hour

  private async request(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${UNSPLASH_BASE_URL}${endpoint}`)
    
    // Add default params
    const defaultParams = {
      client_id: UNSPLASH_ACCESS_KEY,
      orientation: 'landscape',
      per_page: '20',
      ...params
    }
    
    Object.entries(defaultParams).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  async searchPhotos(query: string, page = 1): Promise<UnsplashImage[]> {
    const cacheKey = `search_${query}_${page}`
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return cached
    }

    try {
      const data = await this.request('/search/photos', {
        query,
        page: page.toString(),
        order_by: 'relevant'
      })
      
      const images: UnsplashImage[] = data.results || []
      
      // Cache results
      this.cache.set(cacheKey, images)
      
      // Clear cache after expiry
      setTimeout(() => {
        this.cache.delete(cacheKey)
      }, this.cacheExpiry)
      
      return images
      
    } catch (error) {
      console.error('Error fetching photos from Unsplash:', error)
      return []
    }
  }

  async getRandomPhoto(query: string): Promise<UnsplashImage | null> {
    try {
      const data = await this.request('/photos/random', {
        query,
        count: '1'
      })
      
      return Array.isArray(data) ? data[0] : data
      
    } catch (error) {
      console.error('Error fetching random photo from Unsplash:', error)
      return null
    }
  }

  async getPhotosByCategory(category: BackgroundCategory): Promise<UnsplashImage[]> {
    return this.searchPhotos(category.query)
  }

  // Get optimized URL for specific screen size
  getOptimizedImageUrl(image: UnsplashImage, width = 1920, height = 1080): string {
    const { raw } = image.urls
    return `${raw}&w=${width}&h=${height}&fit=crop&crop=entropy&auto=format&q=80`
  }

  // Attribution URL for Unsplash (required by their API terms)
  getAttributionUrl(image: UnsplashImage): string {
    return `https://unsplash.com/@${image.user.username}?utm_source=deep_work_station&utm_medium=referral`
  }

  // Download tracking (required by Unsplash API terms)
  async trackDownload(image: UnsplashImage): Promise<void> {
    try {
      // This is required by Unsplash API terms of service
      await this.request(`/photos/${image.id}/download`)
    } catch (error) {
      console.warn('Could not track download:', error)
    }
  }
}

export const unsplashService = new UnsplashService()