import { useEffect } from 'react'
import { usePlaylist } from '@/features/audio/hooks/usePlaylist'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaylistLoaderProps {
  className?: string
}

export function PlaylistLoader({ className }: PlaylistLoaderProps) {
  const { 
    isLoading, 
    error, 
    hasPlaylists, 
    refetch, 
    testConnection,
    playlistFolders 
  } = usePlaylist()
  
  // Test connection on mount (only once)
  useEffect(() => {
    testConnection().then(success => {
      if (success) {
        console.log('Azure Blob Storage connected successfully')
      } else {
        console.error('Failed to connect to Azure Blob Storage')
      }
    })
  }, []) // Empty dependency array to run only once
  
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading playlists...
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm",
        className
      )}>
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-destructive">Failed to load playlists</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    )
  }
  
  if (!hasPlaylists) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}>
        <AlertCircle className="h-4 w-4" />
        <span>No audio files found</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    )
  }
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground",
      className
    )}>
      <CheckCircle className="h-4 w-4 text-green-500" />
      <span>
        {playlistFolders?.length || 0} playlist(s) loaded
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        className="h-6 px-2"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  )
}