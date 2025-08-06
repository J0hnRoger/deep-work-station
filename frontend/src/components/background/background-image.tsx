import { useEffect, lazy, Suspense } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { AnimatePresence } from 'framer-motion'

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
  const viewMode = useAppStore(state => state.ui.viewMode)
  // const blurAmount = useAppStore(state => state.background.blurAmount) // For future blur implementation
  
  // For backward compatibility, create derived values
  const currentImage = customBackgroundUrl ? { 
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
      overlayOpacity,
      viewMode
    })
  }, [currentBackground, backgroundType, backgroundOpacity, customBackgroundUrl, overlayOpacity, viewMode])

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
      
      {/* Attribution (required by Unsplash) */}
      {currentImage && currentImage.user && (
        <div className="fixed bottom-2 right-2 z-10">
          <span className="text-xs text-white/60 bg-black/20 backdrop-blur-sm px-2 py-1 rounded">
            Photo by {currentImage.user.name}
          </span>
        </div>
      )}
    </>
  )
}