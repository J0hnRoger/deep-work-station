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
import { useAppStore } from '@/store/useAppStore'
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
  Settings,
  Trees,
  Eye,
  EyeOff,
  HelpCircle
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
  
  // Timer state and actions
  const isRunning = useAppStore(state => state.isRunning)
  const isPaused = useAppStore(state => state.isPaused)
  const mode = useAppStore(state => state.mode)
  const startTimer = useAppStore(state => state.startTimer)
  const pauseTimer = useAppStore(state => state.pauseTimer)
  const resumeTimer = useAppStore(state => state.resumeTimer)
  const stopTimer = useAppStore(state => state.stopTimer)
  const resetTimer = useAppStore(state => state.resetTimer)
  const switchMode = useAppStore(state => state.switchMode)
  
  // Audio state and actions
  const isPlaying = useAppStore(state => state.isPlaying)
  const play = useAppStore(state => state.play)
  const pause = useAppStore(state => state.pause)
  const next = useAppStore(state => state.next)
  const previous = useAppStore(state => state.previous)
  const setVolume = useAppStore(state => state.setVolume)
  const setEQPreset = useAppStore(state => state.setEQPreset)
  
  // UI/View mode actions
  const viewMode = useAppStore(state => state.ui.viewMode)
  const interfaceVisible = useAppStore(state => state.ui.interfaceVisible)
  const enterForestMode = useAppStore(state => state.enterForestMode)
  const exitForestMode = useAppStore(state => state.exitForestMode)
  const toggleInterface = useAppStore(state => state.toggleInterface)
  
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
        startTimer()
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
        startTimer()
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
          startTimer()
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
          pause()
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
    
    // Forest/View mode commands
    {
      id: 'forest-open',
      label: 'Enter Forest Mode',
      shortcut: '⌘F',
      icon: <Trees className="h-4 w-4" />,
      action: () => {
        enterForestMode()
        setOpen(false)
      },
      group: 'View'
    },
    {
      id: 'forest-close',
      label: 'Exit Forest Mode',
      icon: <Timer className="h-4 w-4" />,
      action: () => {
        exitForestMode()
        setOpen(false)
      },
      group: 'View'
    },
    {
      id: 'toggle-interface',
      label: interfaceVisible ? 'Hide Interface' : 'Show Interface',
      shortcut: 'H',
      icon: interfaceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
      action: () => {
        toggleInterface()
        setOpen(false)
      },
      group: 'View'
    },
    {
      id: 'forest-help',
      label: 'Forest Controls Help',
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => {
        // This will show help overlay in forest mode
        console.log('Forest help requested')
        setOpen(false)
      },
      group: 'View'
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
      // Note: Custom timer duration handling would be implemented in slice
      startTimer()
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
            startTimer()
          } else if (isPaused) {
            resumeTimer()
          } else {
            pauseTimer()
          }
        }
        
        if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          switchMode('pomodoro')
          startTimer()
        }
        
        if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          switchMode('deep-work')
          startTimer()
        }
        
        if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          enterForestMode()
        }
        
        if (e.key === 'h' || e.key === 'H') {
          if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault()
            toggleInterface()
          }
        }
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, isRunning, isPaused, mode, startTimer, pauseTimer, resumeTimer, switchMode, enterForestMode, toggleInterface])
  
  // Filter commands based on input and current mode
  const filteredCommands = commands.filter(command => {
    // Hide forest-close in timer mode, and forest-open in forest mode
    if (viewMode === 'timer' && command.id === 'forest-close') return false
    if (viewMode === 'forest' && command.id === 'forest-open') return false
    
    // Show forest help only in forest mode
    if (command.id === 'forest-help' && viewMode !== 'forest') return false
    
    return (
      command.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      command.group.toLowerCase().includes(inputValue.toLowerCase())
    )
  })
  
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