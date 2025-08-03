const AZURE_STORAGE_URL = 'https://storagesoftwarerag.blob.core.windows.net/sounds'
const SAS_TOKEN = 'sv=2023-01-03&spr=https%2Chttp&st=2025-08-03T09%3A12%3A12Z&se=2030-12-04T10%3A12%3A00Z&sr=c&sp=rl&sig=%2F1oX1jIpnOHRWcdY4SRSoZoFUKqeitIJBZnAaSVhS44%3D'

export interface BlobItem {
  name: string
  url: string
  size: number
  lastModified: string
  contentType: string
}

export interface PlaylistFolder {
  name: string
  path: string
  tracks: BlobItem[]
}

class AzureBlobService {
  private baseUrl = AZURE_STORAGE_URL
  private sasToken = SAS_TOKEN

  private getUrlWithSAS(path = ''): string {
    const url = path ? `${this.baseUrl}/${path}` : this.baseUrl
    return `${url}?${this.sasToken}`
  }

  async listBlobs(): Promise<BlobItem[]> {
    try {
      const url = this.getUrlWithSAS() + '&restype=container&comp=list'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blobs: ${response.status} ${response.statusText}`)
      }
      
      const xmlText = await response.text()
      
      // Parse XML response
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      const blobs: BlobItem[] = []
      const blobNodes = xmlDoc.querySelectorAll('Blob')
      
      blobNodes.forEach(blob => {
        const nameNode = blob.querySelector('Name')
        const propertiesNode = blob.querySelector('Properties')
        
        if (nameNode && propertiesNode) {
          const name = nameNode.textContent || ''
          const lastModified = propertiesNode.querySelector('Last-Modified')?.textContent || ''
          const contentLength = propertiesNode.querySelector('Content-Length')?.textContent || '0'
          const contentType = propertiesNode.querySelector('Content-Type')?.textContent || ''
          
          // Only include audio files
          if (this.isAudioFile(name)) {
            blobs.push({
              name,
              url: this.getUrlWithSAS(name),
              size: parseInt(contentLength),
              lastModified,
              contentType
            })
          }
        }
      })
      
      return blobs
      
    } catch (error) {
      console.error('Error listing blobs:', error)
      throw error
    }
  }

  async getPlaylistFolders(): Promise<PlaylistFolder[]> {
    try {
      const blobs = await this.listBlobs()
      
      // Group blobs by folder
      const folders = new Map<string, BlobItem[]>()
      
      blobs.forEach(blob => {
        const pathParts = blob.name.split('/')
        
        if (pathParts.length > 1) {
          // File is in a folder
          const folderName = pathParts[0]
          const fileName = pathParts.slice(1).join('/')
          
          if (!folders.has(folderName)) {
            folders.set(folderName, [])
          }
          
          folders.get(folderName)!.push({
            ...blob,
            name: fileName // Use filename without folder path
          })
        } else {
          // File is in root
          const rootKey = 'root'
          if (!folders.has(rootKey)) {
            folders.set(rootKey, [])
          }
          folders.get(rootKey)!.push(blob)
        }
      })
      
      console.log('Folders found:', Array.from(folders.keys()))
      console.log('Deep-work tracks:', folders.get('deep-work')?.length || 0)
      
      // Convert to PlaylistFolder array
      const playlistFolders: PlaylistFolder[] = []
      
      folders.forEach((tracks, folderName) => {
        playlistFolders.push({
          name: this.formatFolderName(folderName),
          path: folderName,
          tracks: tracks.sort((a, b) => a.name.localeCompare(b.name))
        })
      })
      
      return playlistFolders.sort((a, b) => a.name.localeCompare(b.name))
      
    } catch (error) {
      console.error('Error getting playlist folders:', error)
      return []
    }
  }

  private isAudioFile(filename: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    return audioExtensions.includes(ext)
  }

  private formatFolderName(folderName: string): string {
    if (folderName === 'root') return 'General'
    
    // Convert kebab-case or snake_case to Title Case
    return folderName
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const blobs = await this.listBlobs()
      console.log('Azure Blob Storage connection successful:', blobs.length, 'audio files found')
      return true
    } catch (error) {
      console.error('Azure Blob Storage connection failed:', error)
      return false
    }
  }

  // Get direct audio URL for Web Audio API
  getAudioUrl(blobName: string): string {
    return this.getUrlWithSAS(blobName)
  }
}

export const azureBlobService = new AzureBlobService()