import { createFileRoute } from '@tanstack/react-router'
import { TimerDisplay, TimerControls, TimerModeSelector } from '@/components/timer'
import { CommandPalette } from '@/components/command-palette'
import { AudioPlayer, PlaylistLoader } from '@/components/audio'
import { BackgroundLayer } from '@/components/background'
import Header from '@/components/Header'
import { useAppStore } from '@/store/useAppStore'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  // UI visibility state
  const interfaceVisible = useAppStore(state => state.ui.interfaceVisible)
  const viewMode = useAppStore(state => state.ui.viewMode)
  
  return (
    <div className="dark min-h-screen bg-background text-foreground relative">
      {/* Dynamic Background/Forest Layer */}
      <BackgroundLayer />

      {/* Interface UI - conditionally rendered */}
      {interfaceVisible && (
        <>
          <Header className="relative z-30" />
          <main className="flex-1 relative z-20">
            {/* Main Content - only show in Timer mode */}
            {viewMode === 'timer' && (
              <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] relative z-20">
                {/* Timer Mode Selector */}
                <TimerModeSelector className="mb-8" />

                {/* Main Timer Display */}
                <div className="flex flex-col items-center justify-center flex-1 max-w-2xl mx-auto">
                  <TimerDisplay className="mb-8" />
                  <TimerControls className="mb-8" />
                </div>

                {/* Audio Player */}
                <div className="w-full max-w-2xl mx-auto mt-auto space-y-2">
                  <div className="flex items-center justify-between">
                    <PlaylistLoader />
                    <div className="text-xs text-muted-foreground">
                      Ctrl+K for commands
                    </div>
                  </div>
                  <AudioPlayer />
                </div>
              </div>
            )}
          </main>
        </>
      )}
      
      {/* Timer Overlay in Forest Mode */}
      {viewMode === 'forest' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 backdrop-blur-sm rounded-lg p-4">
          <TimerDisplay className="text-white" />
        </div>
      )}
      
      {/* Command Palette - Always available */}
      <CommandPalette />
      {/* DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </div>
  )
}
