import { useAppStore } from '@/store/useAppStore'
import { useEffect } from 'react'

export const useForestStore = () => {
   const trees = useAppStore(state => state.trees)
   const addTree = useAppStore(state => state.addTree)
   const removeTree = useAppStore(state => state.removeTree)
   const clearTrees = useAppStore(state => state.clearTrees)
   const syncWithSessions = useAppStore(state => state.syncWithSessions)
   const forestSize = useAppStore(state => state.forestSize)
   const minTreeDistance = useAppStore(state => state.minTreeDistance)

   // Auto-sync with sessions on component mount
   useEffect(() => {
     syncWithSessions()
   }, [syncWithSessions])

  return {
    trees,
    addTree,
    removeTree,
    clearTrees,
    syncWithSessions,
    forestSize,
    minTreeDistance
  }
}