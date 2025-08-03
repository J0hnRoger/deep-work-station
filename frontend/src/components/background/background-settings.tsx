import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBackgroundStore } from '@/store/background-store'
import { BACKGROUND_CATEGORIES } from '@/services/unsplash'
import { RefreshCw, Image, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackgroundSettingsProps {
  className?: string
}

export function BackgroundSettings({ className }: BackgroundSettingsProps) {
  const {
    currentCategory,
    overlayOpacity,
    blurIntensity,
    autoRefresh,
    refreshInterval,
    isLoading,
    setCurrentCategory,
    setOverlayOpacity,
    setBlurIntensity,
    setAutoRefresh,
    setRefreshInterval,
    refreshCurrentImage,
    getRandomImageFromCategory
  } = useBackgroundStore()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Background Theme
        </label>
        <Select
          value={currentCategory.id}
          onValueChange={(value) => {
            const category = BACKGROUND_CATEGORIES.find(c => c.id === value)
            if (category) {
              setCurrentCategory(category)
              getRandomImageFromCategory(category)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BACKGROUND_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {category.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manual Refresh */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Image className="h-4 w-4" />
          Current Image
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCurrentImage}
          disabled={isLoading}
          className="h-8"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Overlay Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Dark Overlay</label>
          <span className="text-xs text-muted-foreground">{overlayOpacity}%</span>
        </div>
        <Slider
          value={[overlayOpacity]}
          onValueChange={([value]) => setOverlayOpacity(value)}
          max={100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Adjust overlay darkness for better text readability
        </p>
      </div>

      {/* Blur Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Background Blur</label>
          <span className="text-xs text-muted-foreground">{blurIntensity}%</span>
        </div>
        <Slider
          value={[blurIntensity]}
          onValueChange={([value]) => setBlurIntensity(value)}
          max={100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Soften background for better focus
        </p>
      </div>

      {/* Auto Refresh Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Auto Refresh</label>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-7 text-xs"
          >
            {autoRefresh ? 'On' : 'Off'}
          </Button>
        </div>
        
        {autoRefresh && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Interval</label>
              <span className="text-xs text-muted-foreground">{refreshInterval}min</span>
            </div>
            <Slider
              value={[refreshInterval]}
              onValueChange={([value]) => setRefreshInterval(value)}
              min={5}
              max={120}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How often to change the background image
            </p>
          </div>
        )}
      </div>
    </div>
  )
}