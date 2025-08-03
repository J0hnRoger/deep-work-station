import { Play, Pause, Square, RotateCcw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTimerStore } from '@/store/timer-store'
import { cn } from '@/lib/utils'

interface TimerControlsProps {
  className?: string
}

export function TimerControls({ className }: TimerControlsProps) {
  const {
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    mode
  } = useTimerStore()
  
  const handlePlayPause = () => {
    if (!isRunning) {
      startTimer(mode)
    } else if (isPaused) {
      resumeTimer()
    } else {
      pauseTimer()
    }
  }
  
  const handleStop = () => {
    stopTimer()
  }
  
  const handleReset = () => {
    resetTimer()
  }
  
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {/* Play/Pause Button */}
      <Button
        size="lg"
        onClick={handlePlayPause}
        className="h-14 w-14 rounded-full"
        variant={isRunning && !isPaused ? "secondary" : "default"}
      >
        {isRunning && !isPaused ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6" />
        )}
      </Button>
      
      {/* Stop Button */}
      <Button
        size="lg"
        variant="outline"
        onClick={handleStop}
        disabled={!isRunning && !isPaused}
        className="h-12 w-12 rounded-full"
      >
        <Square className="h-5 w-5" />
      </Button>
      
      {/* Reset Button */}
      <Button
        size="lg"
        variant="ghost"
        onClick={handleReset}
        className="h-12 w-12 rounded-full"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    </div>
  )
}