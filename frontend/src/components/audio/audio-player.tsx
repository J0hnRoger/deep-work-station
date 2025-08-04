import { Play, Pause, SkipBack, SkipForward, Volume2, AudioLines } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import { useHowlerAudio } from '@/features/audio/hooks/useHowlerAudio'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  className?: string
}

export function AudioPlayer({ className }: AudioPlayerProps) {
  const isPlaying = useAppStore(state => state.isPlaying)
  const currentTrack = useAppStore(state => state.currentTrack)
  const currentTime = useAppStore(state => state.currentTime)
  const duration = useAppStore(state => state.duration)
  const volume = useAppStore(state => state.volume)
  const eqPreset = useAppStore(state => state.eqPreset)
  const isLoading = useAppStore(state => state.isLoading)
  
  const play = useAppStore(state => state.play)
  const pause = useAppStore(state => state.pause)
  const next = useAppStore(state => state.next)
  const previous = useAppStore(state => state.previous)
  const setVolume = useAppStore(state => state.setVolume)
  const setEQPreset = useAppStore(state => state.setEQPreset)
  
  const { isReady, isLoaded, handleSeek, formatTime } = useHowlerAudio()
  
  // Debug: uncomment to troubleshoot re-renders
  // console.log('AudioPlayer render:', { 
  //   hasCurrentTrack: !!currentTrack,
  //   trackCount: currentPlaylist?.tracks.length || 0
  // })
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }
  
  const handleSeekChange = (value: number[]) => {
    handleSeek(value[0])
  }
  
  if (!currentTrack) {
    return (
      <div className={cn(
        "bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4",
        className
      )}>
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-muted-foreground">
            No audio loaded. Select a playlist to start.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn(
      "bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-4 space-y-4",
      className
    )}>
      {/* Track Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-md flex items-center justify-center">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : isReady && isLoaded ? (
            <span className="text-sm text-green-400">♪</span>
          ) : (
            <span className="text-sm text-muted-foreground">♪</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {currentTrack.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          onValueChange={handleSeekChange}
          max={duration || 100}
          step={1}
          className="w-full"
          disabled={!isReady || !isLoaded || isLoading}
        />
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={previous}
            disabled={!isReady || !isLoaded}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="sm"
            onClick={handlePlayPause}
            disabled={!isReady || !isLoaded}
            className="h-9 w-9 p-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            disabled={!isReady || !isLoaded}
            className="h-8 w-8 p-0"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Volume Control */}
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-32 ml-4">
          <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
            {volume}%
          </span>
        </div>
        
        {/* EQ Preset */}
        <div className="flex items-center gap-2 ml-4">
          <AudioLines className="h-4 w-4 text-muted-foreground" />
          <Select value={eqPreset} onValueChange={setEQPreset}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="boost">Boost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}