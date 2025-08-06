// =============================================================================
// PLAYLIST HOOK - Façade vers useAppStore
// =============================================================================

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { azureBlobService, type PlaylistFolder } from '@/services/azure-blob'
import { useAppStore } from '@/store/useAppStore'
import type { Playlist } from '../audioTypes'

export const usePlaylist = () => {
  // Actions du store unifié
  const setPlaylists = useAppStore(state => state.setPlaylists)
  const setCurrentPlaylist = useAppStore(state => state.setCurrentPlaylist)
  const currentPlaylist = useAppStore(state => state.currentPlaylist)
  const playlists = useAppStore(state => state.playlists)
  
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
      count: playlistFolders?.length || 0,
      isLoading,
      error: error?.message,
      existingPlaylistsCount: playlists.length,
      hasCurrentPlaylist: !!currentPlaylist
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
    console.log('About to set playlists:', convertedPlaylists.map(p => ({ 
      name: p.name, 
      trackCount: p.tracks.length 
    })))
    
    setPlaylists(convertedPlaylists)
    
    console.log(`Loaded ${convertedPlaylists.length} playlists from Azure Blob Storage`)
    convertedPlaylists.forEach(playlist => {
      console.log(`- ${playlist.name}: ${playlist.tracks.length} tracks`)
    })
    
    // Set default playlist if none selected
    if (convertedPlaylists.length > 0 && !currentPlaylist) {
      // Try to find a playlist with "deep" or "focus" in the name
      const focusPlaylist = convertedPlaylists.find(p => 
        p.name.toLowerCase().includes('deep') || 
        p.name.toLowerCase().includes('focus') ||
        p.name.toLowerCase().includes('work') ||
        p.name.toLowerCase().includes('study')
      )
      
      // If no focus playlist found, use the first one
      const defaultPlaylist = focusPlaylist || convertedPlaylists[0]
      
      setCurrentPlaylist(defaultPlaylist)
      console.log(`Set default playlist: ${defaultPlaylist.name}`)
    }
    
  }, [playlistFolders, setPlaylists, setCurrentPlaylist, currentPlaylist, playlists.length])
  
  // Ensure current playlist is set if we have playlists but no current playlist
  useEffect(() => {
    if (playlists.length > 0 && !currentPlaylist) {
      console.log('No current playlist selected, setting default from existing playlists')
      
      // Try to find a playlist with "deep" or "focus" in the name
      const focusPlaylist = playlists.find(p => 
        p.name.toLowerCase().includes('deep') || 
        p.name.toLowerCase().includes('focus') ||
        p.name.toLowerCase().includes('work') ||
        p.name.toLowerCase().includes('study')
      )
      
      // If no focus playlist found, use the first one
      const defaultPlaylist = focusPlaylist || playlists[0]
      
      setCurrentPlaylist(defaultPlaylist)
      console.log(`Set default playlist from existing: ${defaultPlaylist.name}`)
    }
  }, [playlists, currentPlaylist, setCurrentPlaylist])
  
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
    hasPlaylists: (playlistFolders?.length || 0) > 0 || playlists.length > 0
  }
}