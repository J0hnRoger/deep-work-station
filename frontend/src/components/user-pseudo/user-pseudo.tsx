// =============================================================================
// USER PSEUDO COMPONENT
// Affiche le pseudo utilisateur dans le header
// =============================================================================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Edit } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

interface UserPseudoProps {
  className?: string
}

export function UserPseudo({ className }: UserPseudoProps) {
  const [open, setOpen] = useState(false)
  const [pseudo, setPseudo] = useState('')
  
  const { general, setLanguage } = useAppStore()
  
  // Temporary user state until we add it to the store
  const [userPseudo, setUserPseudo] = useState<string | null>(localStorage.getItem('user-pseudo'))
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(!localStorage.getItem('user-pseudo'))
  
  // Show dialog on first visit if no pseudo is set
  const shouldShowDialog = isFirstVisit && !userPseudo
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pseudo.trim()) {
      setUserPseudo(pseudo.trim())
      localStorage.setItem('user-pseudo', pseudo.trim())
      setIsFirstVisit(false)
      setOpen(false)
      setPseudo('')
    }
  }
  
  const handleEdit = () => {
    setPseudo(userPseudo || '')
    setOpen(true)
  }
  
  return (
    <>
      {/* Display pseudo in header */}
      <div className={cn("flex items-center gap-2", className)}>
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {userPseudo || 'Anonymous'}
        </span>
        {userPseudo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 w-6 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Pseudo input dialog */}
      <Dialog open={open || shouldShowDialog} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {!userPseudo && (
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <User className="h-4 w-4 mr-2" />
              Set Pseudo
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {userPseudo ? 'Edit Pseudo' : 'Welcome to Deep Work Station!'}
            </DialogTitle>
            <DialogDescription>
              {userPseudo 
                ? 'Update your pseudo for session tracking'
                : 'Please enter a pseudo to get started with your deep work journey'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pseudo">Pseudo</Label>
              <Input
                id="pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Enter your pseudo..."
                autoFocus
                required
                minLength={1}
                maxLength={20}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              {userPseudo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              )}
                              <Button type="submit" disabled={!pseudo.trim()}>
                  {userPseudo ? 'Update' : 'Get Started'}
                </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 