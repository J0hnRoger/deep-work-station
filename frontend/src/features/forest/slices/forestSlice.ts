import type { DeepWorkEvent } from "@/core/messaging/deepWorkEventTypes"
import type { AppStore } from "@/store"
import type { StateCreator } from "zustand"

export type ForestSlice = {
    tree: {
        id: string
        position: {
            x: number
            y: number
            z: number
        }
    }[]
    addTree: (position: { x: number; y: number; z: number }) => void
    removeTree: (id: string) => void
    clearTrees: () => void
} 

export const createForestSlice: StateCreator<AppStore, [], [], ForestSlice> = (set, get) => ({
   tree: [{
    id: "1",
    position: {
      x: 0,
      y: 0,
      z: -2
    },
   }, 
   {
    id: "2",
    position: {
      x: -2,
      y: 0,
      z: 0
    },
   }],
   addTree: (position) => {
     const newId = (get().tree.length + 1).toString();
     set((state) => ({
       tree: [...state.tree, { id: newId, position }]
     }));
   },
   removeTree: (id) => {
     set((state) => ({
       tree: state.tree.filter(t => t.id !== id)
     }));
   },
   clearTrees: () => {
     set({ tree: [] });
   }
})

/**
 * Fonction d'abonnement aux événements pour le système User
 * Centralise toute la logique de réaction aux événements globaux
 */
export function subscribeUserSystem(
  events: DeepWorkEvent[], 
  state: AppStore
) {
  // Vérifier s'il y a de nouveaux événements
  const latestEvent = events[0]
  if (!latestEvent) return
}