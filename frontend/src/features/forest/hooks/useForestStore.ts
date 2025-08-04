import { useAppStore } from '@/store/useAppStore'

export const useForestStore = () => {
   const tree = useAppStore(state => state.tree)
   const addTree = useAppStore(state => state.addTree)
   const removeTree = useAppStore(state => state.removeTree)
   const clearTrees = useAppStore(state => state.clearTrees)

  return {
    tree,
    addTree,
    removeTree,
    clearTrees
  }
}