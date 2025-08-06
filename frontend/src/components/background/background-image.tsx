import { useEffect, lazy, Suspense, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

// Lazy load the ForestExploration component
const ForestExploration = lazy(() => 
  import('@/features/forest/components/ForestExploration')
    .then(module => ({ default: module.ForestExploration }))
)

interface BackgroundLayerProps {
  className?: string
}

export function BackgroundLayer({ className }: BackgroundLayerProps) {
  // Settings slice properties
  const currentBackground = useAppStore(state => state.background.currentBackground)
  const backgroundType = useAppStore(state => state.background.backgroundType)
  const backgroundOpacity = useAppStore(state => state.background.backgroundOpacity)
  const customBackgroundUrl = useAppStore(state => state.background.customBackgroundUrl)
  const unsplashImageUrl = useAppStore(state => state.background.unsplashImageUrl)
  const unsplashAuthor = useAppStore(state => state.background.unsplashAuthor)
  const viewMode = useAppStore(state => state.ui.viewMode)
  const interfaceVisible = useAppStore(state => state.ui.interfaceVisible)
  const unsplashEnabled = useAppStore(state => state.background.unsplashEnabled)
  const unsplashCategory = useAppStore(state => state.background.unsplashCategory)
  const setUnsplashEnabled = useAppStore(state => state.setUnsplashEnabled)
  const setUnsplashCategory = useAppStore(state => state.setUnsplashCategory)
  const refreshUnsplashBackground = useAppStore(state => state.refreshUnsplashBackground)
  
  // Local state for refresh button
  const [isRefreshing, setIsRefreshing] = useState(false)
  // const blurAmount = useAppStore(state => state.background.blurAmount) // For future blur implementation
  
  // Create currentImage from available sources (prioritize Unsplash over custom)
  const currentImage = unsplashImageUrl ? {
    urls: { full: unsplashImageUrl },
    user: { name: unsplashAuthor || 'Unsplash' }
  } : customBackgroundUrl ? { 
    urls: { full: customBackgroundUrl },
    user: { name: 'Custom' }
  } : null
  const overlayOpacity = 100 - backgroundOpacity // Inverse logic

  // Debug and background change tracking
  useEffect(() => {
    console.log('BackgroundLayer: Component mounted/updated', { 
      currentBackground, 
      backgroundType, 
      backgroundOpacity,
      hasCustomUrl: !!customBackgroundUrl,
      hasUnsplashUrl: !!unsplashImageUrl,
      overlayOpacity,
      viewMode
    })
  }, [currentBackground, backgroundType, backgroundOpacity, customBackgroundUrl, unsplashImageUrl, overlayOpacity, viewMode])

  // Render Forest mode first (highest priority)
  if (viewMode === 'forest') {
    return (
      <div className={cn("fixed inset-0", className)}>
        <Suspense
          fallback={
            <div className="fixed inset-0 z-0 flex items-center justify-center bg-black text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Loading 3D...</p>
              </div>
            </div>
          }
        >
          <AnimatePresence>
            <ForestExploration />
          </AnimatePresence>
        </Suspense>
      </div>
    )
  }
  
  // Render based on background type (Timer mode)
  if (backgroundType === 'gradient' || !currentImage) {
    return (
      <>
        {/* Gradient background */}
        <div className={cn(
          "fixed inset-0 z-0 bg-gradient-to-br from-blue-900/50 via-slate-900 to-purple-900/50",
          className
        )} />
        {/* Overlay */}
        <div 
          className="fixed inset-0 z-10 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
        
        {/* Refresh button for gradient mode */}
        {interfaceVisible && (
          <div className="fixed bottom-2 right-2 z-50">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // For gradient mode, we could cycle through different gradient styles
                // For now, just refresh the current gradient (future enhancement)
                console.log('Refresh gradient requested')
              }}
              className="bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30 p-2 rounded-full transition-all duration-200"
              title="Change background style"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </>
    )
  }

  const imageUrl = currentImage.urls.full

  // Debug info
  console.log('BackgroundLayer render:', {
    hasCurrentImage: !!currentImage,
    backgroundType,
    backgroundOpacity,
    viewMode
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
      
      {/* Bottom right controls */}
      {interfaceVisible && (
        <div className="fixed bottom-2 right-2 z-50 flex items-center gap-2">
          {/* Attribution (required by Unsplash) */}
          {currentImage && currentImage.user && (
            <span className="text-xs text-white/60 bg-black/20 backdrop-blur-sm px-2 py-1 rounded">
              Photo by {currentImage.user.name}
            </span>
          )}
          
          {/* Refresh button - show if we have an image (Unsplash or custom) */}
          {backgroundType === 'image' && currentImage && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (isRefreshing) return
                setIsRefreshing(true)
                try {
                  // Only refresh Unsplash if it's enabled, otherwise just log for custom images
                  if (unsplashEnabled || unsplashImageUrl) {
                    // Use the same method as "Load Image" in settings
                    setUnsplashEnabled(true)
                    setUnsplashCategory(unsplashCategory || 'nature')
                    await refreshUnsplashBackground()
                  } else {
                    console.log('Custom image refresh requested - functionality could be added later')
                  }
                } finally {
                  setIsRefreshing(false)
                }
              }}
              disabled={isRefreshing}
              className="bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30 p-2 rounded-full transition-all duration-200 disabled:opacity-50"
              title="Load new background image"
            >
              <RefreshCw 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isRefreshing && "animate-spin"
                )} 
              />
            </motion.button>
          )}
        </div>
      )}
    </>
  )
}