import { Button } from '@/components/ui/button'
import { useTimerStore, type TimerMode } from '@/store/timer-store'
import { cn } from '@/lib/utils'
import { Clock, Timer, Settings } from 'lucide-react'

interface TimerModeSelectorProps {
  className?: string
}

export function TimerModeSelector({ className }: TimerModeSelectorProps) {
  const { mode, switchMode, isRunning, presets } = useTimerStore()
  
  const getModeIcon = (timerMode: TimerMode) => {
    switch (timerMode) {
      case 'pomodoro':
        return <Timer className="h-4 w-4" />
      case 'deep-work':
        return <Clock className="h-4 w-4" />
      case 'custom':
        return <Settings className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }
  
  const handleModeChange = (newMode: TimerMode) => {
    if (!isRunning) {
      switchMode(newMode)
    }
  }
  
  return (
    <div className={cn('flex items-center justify-center gap-2 mb-8', className)}>
      {presets.map((preset) => (
        <Button
          key={preset.id}
          variant={mode === preset.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange(preset.id)}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            mode === preset.id && "shadow-lg"
          )}
        >
          {getModeIcon(preset.id)}
          <span className="hidden sm:inline">{preset.name}</span>
          <span className="text-xs text-muted-foreground hidden md:inline">
            {preset.workDuration}min
          </span>
        </Button>
      ))}
    </div>
  )
}