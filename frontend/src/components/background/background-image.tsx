import { useEffect } from 'react'
import { useBackgroundStore } from '@/store/background-store'
import { cn } from '@/lib/utils'
import { unsplashService } from '@/services/unsplash'

interface BackgroundImageProps {
  className?: string
}

export function BackgroundImage({ className }: BackgroundImageProps) {
  const {
    currentImage,
    currentCategory,
    overlayOpacity,
    autoRefresh,
    refreshInterval,
    lastRefresh,
    fetchImagesForCategory,
    refreshCurrentImage
  } = useBackgroundStore()

  // Initialize background on mount
  useEffect(() => {
    if (!currentImage) {
      fetchImagesForCategory(currentCategory)
    }
  }, [currentImage, currentCategory, fetchImagesForCategory])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !lastRefresh) return

    const lastRefreshTime = new Date(lastRefresh).getTime()
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTime
    const refreshIntervalMs = refreshInterval * 60 * 1000

    // If enough time has passed, refresh immediately
    if (timeSinceLastRefresh >= refreshIntervalMs) {
      refreshCurrentImage()
      return
    }

    // Set up next refresh
    const timeUntilNextRefresh = refreshIntervalMs - timeSinceLastRefresh
    const timeout = setTimeout(() => {
      refreshCurrentImage()
    }, timeUntilNextRefresh)

    return () => clearTimeout(timeout)
  }, [autoRefresh, refreshInterval, lastRefresh, refreshCurrentImage])

  if (!currentImage) {
    return (
      <>
        {/* Fallback gradient background */}
        <div className={cn(
          "fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          className
        )} />
        {/* Overlay */}
        <div 
          className="fixed inset-0 z-10 bg-black/20"
        />
      </>
    )
  }

  const imageUrl = unsplashService.getOptimizedImageUrl(
    currentImage,
    typeof window !== 'undefined' ? window.innerWidth : 1920,
    typeof window !== 'undefined' ? window.innerHeight : 1080
  )

  // Debug info
  console.log('BackgroundImage render:', {
    hasCurrentImage: !!currentImage,
    imageUrl: currentImage ? imageUrl : null,
    currentCategory: currentCategory.name
  })

  return (
    <>
      {/* Background Image */}
      <div 
        className={cn(
          "fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000",
          className
        )}
        style={{
          backgroundImage: `url(${imageUrl})`
        }}
      />
      
      {/* Overlay for better readability */}
      <div 
        className="fixed inset-0 z-10 bg-black transition-opacity duration-500"
        style={{
          opacity: overlayOpacity / 100
        }}
      />
      
      {/* Attribution (required by Unsplash) */}
      {currentImage && (
        <div className="fixed bottom-2 right-2 z-10">
          <a
            href={unsplashService.getAttributionUrl(currentImage)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/60 hover:text-white/80 transition-colors bg-black/20 backdrop-blur-sm px-2 py-1 rounded"
          >
            Photo by {currentImage.user.name} on Unsplash
          </a>
        </div>
      )}
    </>
  )
}