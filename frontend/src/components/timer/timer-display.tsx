import { useAppStore } from '@/store/useAppStore'
import { useTimer } from '@/features/timer/hooks/useTimer'
import { cn } from '@/lib/utils'

interface TimerDisplayProps {
  className?: string
}

export function TimerDisplay({ className }: TimerDisplayProps) {
  const { timeDisplay, progress } = useTimer()
  const isRunning = useAppStore(state => state.isRunning)
  const isPaused = useAppStore(state => state.isPaused)
  const isBreak = useAppStore(state => state.isBreak)
  const currentPreset = useAppStore(state => state.currentPreset)
  
  const getStatusColor = () => {
    if (isBreak) return 'text-green-400'
    if (isRunning && !isPaused) return 'text-blue-400'
    if (isPaused) return 'text-yellow-400'
    return 'text-muted-foreground'
  }
  
  const getStatusText = () => {
    if (isBreak) return 'Break Time'
    if (isRunning && !isPaused) return currentPreset.name
    if (isPaused) return 'Paused'
    return 'Ready'
  }
  
  return (
    <div className={cn('text-center', className)}>
      {/* Timer Display */}
      <div className="relative">
        {/* Background Circle for Progress */}
        <div className="w-48 h-48 mx-auto mb-6 relative">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground/20"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={cn(
                "transition-all duration-1000 ease-in-out",
                getStatusColor()
              )}
            />
          </svg>
          
          {/* Time Text in Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div 
                className={cn(
                  "font-mono text-4xl font-bold transition-colors duration-300",
                  getStatusColor()
                )}
                style={{ fontSize: 'var(--font-size-timer)' }}
              >
                {timeDisplay}
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Text */}
        <div className="mb-4">
          <p className={cn(
            "text-lg font-medium transition-colors duration-300",
            getStatusColor()
          )}>
            {getStatusText()}
          </p>
          {currentPreset && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentPreset.workDuration} min work • {currentPreset.breakDuration} min break
            </p>
          )}
        </div>
        
        {/* Progress Bar (Alternative to Circle) */}
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-in-out rounded-full",
                "bg-gradient-to-r from-blue-500 to-purple-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}