import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { azureBlobService, type PlaylistFolder } from '@/services/azure-blob'
import { useAudioStore, type Playlist, type AudioTrack } from '@/store/audio-store'

export const usePlaylist = () => {
  const { setPlaylist, addPlaylist, playlists } = useAudioStore()
  
  // Fetch playlists from Azure Blob Storage
  const {
    data: playlistFolders,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => azureBlobService.getPlaylistFolders(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
  
  // Convert Azure blob folders to audio store playlists
  useEffect(() => {
    console.log('usePlaylist effect triggered:', { 
      hasPlaylistFolders: !!playlistFolders, 
      count: playlistFolders?.length || 0 
    })
    
    if (!playlistFolders || playlistFolders.length === 0) {
      console.log('No playlist folders to process')
      return
    }
    
    const convertedPlaylists: Playlist[] = playlistFolders.map((folder: PlaylistFolder) => {
      console.log(`Converting folder ${folder.name}:`, {
        path: folder.path,
        tracksCount: folder.tracks.length,
        firstTrack: folder.tracks[0]
      })
      
      return {
        id: folder.path,
        name: folder.name,
        tracks: folder.tracks.map(blob => {
          const track = {
            id: `${folder.path}/${blob.name}`,
            title: formatTrackTitle(blob.name),
            url: blob.url,
            duration: undefined // Will be set when loaded
          }
          console.log('Created track:', track)
          return track
        })
      }
    })
    
    // Replace all playlists to avoid duplicates
    const state = useAudioStore.getState()
    
    console.log('About to set playlists:', convertedPlaylists.map(p => ({ 
      name: p.name, 
      trackCount: p.tracks.length 
    })))
    
    useAudioStore.setState({
      playlists: convertedPlaylists
    })
    
    // Verify they were set correctly
    const newState = useAudioStore.getState()
    console.log('After setState - playlists in store:', newState.playlists.map(p => ({ 
      name: p.name, 
      trackCount: p.tracks.length 
    })))
    
    console.log(`Loaded ${convertedPlaylists.length} playlists from Azure Blob Storage`)
    convertedPlaylists.forEach(playlist => {
      console.log(`- ${playlist.name}: ${playlist.tracks.length} tracks`)
    })
    
    // Set default playlist if none selected
    if (convertedPlaylists.length > 0 && !useAudioStore.getState().currentPlaylist) {
      const defaultPlaylist = convertedPlaylists.find(p => 
        p.name.toLowerCase().includes('deep') || 
        p.name.toLowerCase().includes('focus')
      ) || convertedPlaylists[0]
      
      setPlaylist(defaultPlaylist)
      console.log(`Set default playlist: ${defaultPlaylist.name}`)
    }
    
  }, [playlistFolders, setPlaylist])
  
  // Format track title from filename
  const formatTrackTitle = (filename: string): string => {
    // Remove extension
    let title = filename.replace(/\.[^/.]+$/, '')
    
    // Remove track numbers (01-, 02-, etc.)
    title = title.replace(/^\d+[-\s]*/, '')
    
    // Replace underscores and dashes with spaces
    title = title.replace(/[-_]/g, ' ')
    
    // Capitalize words
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    return title || 'Unknown Track'
  }
  
  // Test connection
  const testConnection = async (): Promise<boolean> => {
    try {
      return await azureBlobService.testConnection()
    } catch (error) {
      console.error('Playlist connection test failed:', error)
      return false
    }
  }
  
  return {
    playlistFolders,
    isLoading,
    error,
    refetch,
    testConnection,
    hasPlaylists: (playlistFolders?.length || 0) > 0
  }
}