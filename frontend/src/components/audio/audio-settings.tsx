import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { Volume2, Repeat, PlayCircle, Square, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioSettingsProps {
  className?: string
}

export function AudioSettings({ className }: AudioSettingsProps) {
  // Audio state
  const volume = useAppStore(state => state.volume)
  const repeatMode = useAppStore(state => state.repeatMode)
  const isPlaying = useAppStore(state => state.isPlaying)
  const currentTrack = useAppStore(state => state.currentTrack)
  
  // Timer-specific audio settings
  const loopDuringTimer = useAppStore(state => state.loopDuringTimer)
  const autoPlayOnTimerStart = useAppStore(state => state.autoPlayOnTimerStart)
  const autoStopOnTimerComplete = useAppStore(state => state.autoStopOnTimerComplete)
  
  // Audio actions
  const setVolume = useAppStore(state => state.setVolume)
  const setRepeatMode = useAppStore(state => state.setRepeatMode)
  const play = useAppStore(state => state.play)
  const stop = useAppStore(state => state.stop)
  const setLoopDuringTimer = useAppStore(state => state.setLoopDuringTimer)
  const setAutoPlayOnTimerStart = useAppStore(state => state.setAutoPlayOnTimerStart)
  const setAutoStopOnTimerComplete = useAppStore(state => state.setAutoStopOnTimerComplete)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Track Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Music className="h-4 w-4" />
          Current Audio
        </label>
        <div className="bg-muted/30 rounded-lg p-3">
          {currentTrack ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentTrack.title}</p>
                <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => isPlaying ? stop() : play()}
                className="h-8"
              >
                {isPlaying ? (
                  <Square className="h-3 w-3" />
                ) : (
                  <PlayCircle className="h-3 w-3" />
                )}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No audio selected</p>
          )}
        </div>
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Volume
          </label>
          <span className="text-xs text-muted-foreground">{volume}%</span>
        </div>
        <Slider
          value={[volume]}
          onValueChange={([value]) => setVolume(value)}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Repeat Mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Repeat Mode
        </label>
        <div className="flex gap-2">
          {(['none', 'one', 'all'] as const).map((mode) => (
            <Button
              key={mode}
              variant={repeatMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => setRepeatMode(mode)}
              className="h-8 text-xs capitalize"
            >
              {mode === 'none' && 'Off'}
              {mode === 'one' && 'Track'}
              {mode === 'all' && 'All'}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Current: {repeatMode === 'none' ? 'No repeat' : repeatMode === 'one' ? 'Repeat current track' : 'Repeat playlist'}
        </p>
      </div>

      {/* Timer Integration Settings */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-semibold">Timer Integration</h4>
        
        {/* Loop During Timer */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">Loop Audio During Timer</label>
            <p className="text-xs text-muted-foreground">
              Automatically loop audio to maintain focus during timer sessions
            </p>
          </div>
          <Button
            variant={loopDuringTimer ? "default" : "outline"}
            size="sm"
            onClick={() => setLoopDuringTimer(!loopDuringTimer)}
            className="h-7 text-xs"
          >
            {loopDuringTimer ? 'On' : 'Off'}
          </Button>
        </div>

        {/* Auto-play on Timer Start */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">Auto-play on Timer Start</label>
            <p className="text-xs text-muted-foreground">
              Start playing focus playlist when timer begins
            </p>
          </div>
          <Button
            variant={autoPlayOnTimerStart ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoPlayOnTimerStart(!autoPlayOnTimerStart)}
            className="h-7 text-xs"
          >
            {autoPlayOnTimerStart ? 'On' : 'Off'}
          </Button>
        </div>

        {/* Auto-stop on Timer Complete */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">Auto-stop on Timer Complete</label>
            <p className="text-xs text-muted-foreground">
              Stop audio when timer session ends
            </p>
          </div>
          <Button
            variant={autoStopOnTimerComplete ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoStopOnTimerComplete(!autoStopOnTimerComplete)}
            className="h-7 text-xs"
          >
            {autoStopOnTimerComplete ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          🎵 Audio Timer Integration
        </h5>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p>• <strong>Auto-play on Timer Start:</strong> Automatically starts audio when you begin a work session</p>
          <p>• <strong>Loop During Timer:</strong> Continuously plays audio to maintain focus without silence</p>
          <p>• <strong>Smart Resume:</strong> If audio is already playing, it continues without interruption</p>
          <p>• Your normal repeat settings are restored after each timer session</p>
        </div>
      </div>

      {/* Current Configuration Status */}
      {autoPlayOnTimerStart && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <h6 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
            ✅ Auto-Start Configuration
          </h6>
          <div className="text-xs text-green-700 dark:text-green-300">
            {currentTrack ? (
              <p>Ready to auto-play: <strong>{currentTrack.title}</strong> by {currentTrack.artist}</p>
            ) : (
              <p>No audio configured - timer will start silently until you add audio</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}