// =============================================================================
// USER PSEUDO COMPONENT
// Affiche le pseudo utilisateur dans le header - Connecté au store global
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
import { useUser } from '@/features/user'
import { cn } from '@/lib/utils'

interface UserPseudoProps {
  className?: string
}

export function UserPseudo({ className }: UserPseudoProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  
  // Utiliser le hook User connecté au store global
  const {
    pseudo,
    displayName,
    shouldShowWelcomeDialog,
    totalSessions,
    setPseudo,
    setWelcomeDialogOpen,
    isLoggedIn
  } = useUser()
  
  // Show dialog on first visit or when manually opened
  const shouldShowDialog = shouldShowWelcomeDialog || open
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setPseudo(inputValue.trim())
      setOpen(false)
      setInputValue('')
      // Fermer le dialog de bienvenue si c'était le premier visit
      if (shouldShowWelcomeDialog) {
        setWelcomeDialogOpen(false)
      }
    }
  }
  
  const handleEdit = () => {
    setInputValue(pseudo || '')
    setOpen(true)
  }
  
  return (
    <>
      {/* Display pseudo in header */}
      <div className={cn("flex items-center gap-2", className)}>
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {displayName}
        </span>
        {totalSessions > 0 && (
          <span className="text-xs text-muted-foreground">
            ({totalSessions} sessions)
          </span>
        )}
        {isLoggedIn && (
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
          {!isLoggedIn && (
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <User className="h-4 w-4 mr-2" />
              Set Pseudo
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isLoggedIn ? 'Edit Pseudo' : 'Welcome to Deep Work Station!'}
            </DialogTitle>
            <DialogDescription>
              {isLoggedIn 
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
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter your pseudo..."
                autoFocus
                required
                minLength={1}
                maxLength={20}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              {isLoggedIn && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!inputValue.trim()}>
                {isLoggedIn ? 'Update' : 'Get Started'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 