import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Headphones } from 'lucide-react'
import { useAudioStore } from '@/store/audio-store'
import { SettingsDialog } from '@/components/settings'
import { cn } from '@/lib/utils'

interface HeaderProps {
  className?: string
}

export default function Header({ className }: HeaderProps) {
  const { playlists, currentPlaylist, setPlaylist } = useAudioStore()
  
  // Debug: uncomment to troubleshoot re-renders
  // console.log('Header render:', { 
  //   playlistsCount: playlists.length, 
  //   currentPlaylist: currentPlaylist?.name
  // })
  
  return (
    <header className={cn(
      "border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DWS</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm">Deep Work Station</h1>
            <p className="text-xs text-muted-foreground">Focus • Flow • Progress</p>
          </div>
        </div>
        
        {/* Center - Playlist Selector */}
        <div className="hidden md:flex items-center gap-2">
          <Headphones className="h-4 w-4 text-muted-foreground" />
          <Select
            value={currentPlaylist?.id || ''}
            onValueChange={(value) => {
              const playlist = playlists.find(p => p.id === value)
              if (playlist) setPlaylist(playlist)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select playlist" />
            </SelectTrigger>
            <SelectContent>
              {playlists.map((playlist) => (
                <SelectItem key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Right - Settings */}
        <div className="flex items-center gap-2">
          <SettingsDialog />
        </div>
      </div>
    </header>
  )
}
