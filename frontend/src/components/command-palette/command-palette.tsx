import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { useTimerStore } from '@/store/timer-store'
import { useAudioStore } from '@/store/audio-store'
import { useSettingsStore } from '@/store/settings-store'
import { useBackgroundStore } from '@/store/background-store'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  AudioLines,  
  Clock,
  Timer,
  Settings
} from 'lucide-react'

interface Command {
  id: string
  label: string
  shortcut?: string
  icon?: React.ReactNode
  action: () => void
  group: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  
  const {
    isRunning,
    isPaused,
    mode,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    switchMode
  } = useTimerStore()
  
  const {
    isPlaying,
    volume,
    eqPreset,
    play,
    pause: pauseAudio,
    next,
    previous,
    setVolume,
    setEQPreset
  } = useAudioStore()
  
  const { user: { commandPaletteKey } } = useSettingsStore()
  
  const { refreshCurrentImage } = useBackgroundStore()
  
  // Parse volume from input (e.g., "volume 50", "vol 75")
  const parseVolumeCommand = (input: string): number | null => {
    const match = input.match(/(?:volume|vol)\s+(\d+)/i)
    if (match) {
      const value = parseInt(match[1])
      return value >= 0 && value <= 100 ? value : null
    }
    return null
  }
  
  // Parse custom timer duration (e.g., "start 45", "timer 30")
  const parseTimerCommand = (input: string): number | null => {
    const match = input.match(/(?:start|timer)\s+(\d+)/i)
    if (match) {
      const value = parseInt(match[1])
      return value > 0 && value <= 180 ? value : null // Max 3 hours
    }
    return null
  }
  
  const commands: Command[] = [
    // Timer commands
    {
      id: 'timer-start-pomodoro',
      label: 'Start Pomodoro (25 min)',
      shortcut: '⌘T',
      icon: <Timer className="h-4 w-4" />,
      action: () => {
        switchMode('pomodoro')
        startTimer('pomodoro')
        setOpen(false)
      },
      group: 'Timer'
    },
    {
      id: 'timer-start-deep-work',
      label: 'Start Deep Work (50 min)',
      shortcut: '⌘D',
      icon: <Clock className="h-4 w-4" />,
      action: () => {
        switchMode('deep-work')
        startTimer('deep-work')
        setOpen(false)
      },
      group: 'Timer'
    },
    {
      id: 'timer-pause-resume',
      label: isRunning && !isPaused ? 'Pause Timer' : 'Resume Timer',
      shortcut: 'Space',
      icon: isRunning && !isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />,
      action: () => {
        if (!isRunning) {
          startTimer(mode)
        } else if (isPaused) {
          resumeTimer()
        } else {
          pauseTimer()
        }
        setOpen(false)
      },
      group: 'Timer'
    },
    {
      id: 'timer-stop',
      label: 'Stop Timer',
      icon: <Square className="h-4 w-4" />,
      action: () => {
        stopTimer()
        setOpen(false)
      },
      group: 'Timer'
    },
    {
      id: 'timer-reset',
      label: 'Reset Timer',
      icon: <RotateCcw className="h-4 w-4" />,
      action: () => {
        resetTimer()
        setOpen(false)
      },
      group: 'Timer'
    },
    
    // Audio commands
    {
      id: 'audio-play-pause',
      label: isPlaying ? 'Pause Audio' : 'Play Audio',
      shortcut: '⌘P',
      icon: isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />,
      action: () => {
        if (isPlaying) {
          pauseAudio()
        } else {
          play()
        }
        setOpen(false)
      },
      group: 'Audio'
    },
    {
      id: 'audio-next',
      label: 'Next Track',
      shortcut: '⌘→',
      icon: <SkipForward className="h-4 w-4" />,
      action: () => {
        next()
        setOpen(false)
      },
      group: 'Audio'
    },
    {
      id: 'audio-previous',
      label: 'Previous Track',
      shortcut: '⌘←',
      icon: <SkipBack className="h-4 w-4" />,
      action: () => {
        previous()
        setOpen(false)
      },
      group: 'Audio'
    },
    
    // Background commands
    {
      id: 'background-refresh',
      label: 'Refresh Background',
      shortcut: '⌘R',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        refreshCurrentImage()
        setOpen(false)
      },
      group: 'Background'
    },
    
    // EQ Presets
    {
      id: 'eq-neutral',
      label: 'EQ: Neutral',
      icon: <AudioLines className="h-4 w-4" />,
      action: () => {
        setEQPreset('neutral')
        setOpen(false)
      },
      group: 'Audio'
    },
    {
      id: 'eq-light',
      label: 'EQ: Light',
      icon: <AudioLines className="h-4 w-4" />,
      action: () => {
        setEQPreset('light')
        setOpen(false)
      },
      group: 'Audio'
    },
    {
      id: 'eq-boost',
      label: 'EQ: Boost',
      icon: <AudioLines className="h-4 w-4" />,
      action: () => {
        setEQPreset('boost')
        setOpen(false)
      },
      group: 'Audio'
    }
  ]
  
  // Handle dynamic commands based on input
  const handleDynamicCommands = (input: string) => {
    const volumeValue = parseVolumeCommand(input)
    if (volumeValue !== null) {
      setVolume(volumeValue)
      setOpen(false)
      return
    }
    
    const timerValue = parseTimerCommand(input)
    if (timerValue !== null) {
      switchMode('custom')
      startTimer('custom', timerValue)
      setOpen(false)
      return
    }
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Command palette toggle
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      
      // Quick shortcuts when palette is closed
      if (!open) {
        if (e.code === 'Space' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          if (!isRunning) {
            startTimer(mode)
          } else if (isPaused) {
            resumeTimer()
          } else {
            pauseTimer()
          }
        }
        
        if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          switchMode('pomodoro')
          startTimer('pomodoro')
        }
        
        if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          switchMode('deep-work')
          startTimer('deep-work')
        }
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, isRunning, isPaused, mode, startTimer, pauseTimer, resumeTimer, switchMode])
  
  // Filter commands based on input
  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(inputValue.toLowerCase()) ||
    command.group.toLowerCase().includes(inputValue.toLowerCase())
  )
  
  // Group commands
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = []
    }
    acc[command.group].push(command)
    return acc
  }, {} as Record<string, Command[]>)
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && inputValue) {
            // Try to handle as dynamic command
            handleDynamicCommands(inputValue)
          }
        }}
      />
      <CommandList>
        <CommandEmpty>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">No commands found</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Try: "start 45" for custom timer</p>
              <p>Try: "volume 70" to set volume</p>
              <p>Try: "eq neutral" for EQ preset</p>
            </div>
          </div>
        </CommandEmpty>
        
        {Object.entries(groupedCommands).map(([group, groupCommands]) => (
          <CommandGroup key={group} heading={group}>
            {groupCommands.map((command) => (
              <CommandItem
                key={command.id}
                onSelect={command.action}
                className="flex items-center gap-2"
              >
                {command.icon}
                <span className="flex-1">{command.label}</span>
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        
        {/* Dynamic suggestions based on input */}
        {inputValue && (
          <CommandGroup heading="Dynamic Commands">
            {parseVolumeCommand(inputValue) !== null && (
              <CommandItem
                onSelect={() => handleDynamicCommands(inputValue)}
                className="flex items-center gap-2"
              >
                <Volume2 className="h-4 w-4" />
                <span>Set volume to {parseVolumeCommand(inputValue)}%</span>
              </CommandItem>
            )}
            {parseTimerCommand(inputValue) !== null && (
              <CommandItem
                onSelect={() => handleDynamicCommands(inputValue)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span>Start {parseTimerCommand(inputValue)} minute timer</span>
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}