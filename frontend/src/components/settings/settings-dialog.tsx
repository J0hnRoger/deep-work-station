import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { BackgroundSettings } from '@/components/background'
import { AudioSettings } from '@/components/audio/audio-settings'
import { cn } from '@/lib/utils'

interface SettingsDialogProps {
  className?: string
}

export function SettingsDialog({ className }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('background')

  const tabs = [
    { id: 'background', label: 'Background', icon: '🎨' },
    { id: 'timer', label: 'Timer', icon: '⏱️' },
    { id: 'audio', label: 'Audio', icon: '🎵' },
    { id: 'general', label: 'General', icon: '⚙️' }
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0", className)}>
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Deep Work Station experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-6 mt-4">
          {/* Sidebar */}
          <div className="w-32 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    "flex items-center gap-2",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-h-[400px] overflow-y-auto">
            {activeTab === 'background' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Background Settings</h3>
                <BackgroundSettings />
              </div>
            )}
            
            {activeTab === 'timer' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Timer Settings</h3>
                <div className="text-muted-foreground">
                  Timer settings will be implemented here.
                </div>
              </div>
            )}
            
            {activeTab === 'audio' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Audio Settings</h3>
                <AudioSettings />
              </div>
            )}
            
            {activeTab === 'general' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <div className="text-muted-foreground">
                  General settings will be implemented here.
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}