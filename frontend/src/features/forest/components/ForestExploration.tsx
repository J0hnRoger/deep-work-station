import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { Experience } from './3d/Experience'
import { DebugInfo } from './3d/DebugInfo'
import { useAppStore } from '@/store/useAppStore'

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["Shift"] },
]

interface ForestExplorationProps {
  className?: string
}

export function ForestExploration({ className }: ForestExplorationProps) {
  // Remove canvasRef as we no longer need pointer lock
  
  // Store selectors
  const viewMode = useAppStore(state => state.ui.viewMode)
  const interfaceVisible = useAppStore(state => state.ui.interfaceVisible)
  const debugMode = useAppStore(state => state.general.debugMode)
  const exitForestMode = useAppStore(state => state.exitForestMode)
  const toggleInterface = useAppStore(state => state.toggleInterface)
  
  // Local state for mapping overlay
  const [showMapping, setShowMapping] = useState(false)
  
  // Only show debug in development or if explicitly enabled
  const showDebug = debugMode && process.env.NODE_ENV === 'development'
  
  // Keyboard controls for Forest mode
  useEffect(() => {
    if (viewMode !== 'forest') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+H - Toggle interface
      if ((e.key === 'h' || e.key === 'H') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        toggleInterface()
        return
      }
      
      // Ctrl+F - Return to Timer mode from Forest
      if ((e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        exitForestMode()
        return
      }
      
      // M key - Toggle mapping overlay
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        setShowMapping(prev => !prev)
        return
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, toggleInterface, exitForestMode])
  
  // Remove all pointer lock logic
  
  if (viewMode !== 'forest') {
    return null
  }
  
  return (
    <motion.div 
      className={`fixed inset-0 z-20 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading fallback */}
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-screen bg-black text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Loading 3D...</p>
            </div>
          </div>
        }
      >
        {/* Debug info */}
        <AnimatePresence>
          {showDebug && interfaceVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 z-30"
            >
              <DebugInfo debugMode={showDebug} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Help overlay - always shown when interface is visible */}
        <AnimatePresence>
          {interfaceVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm max-w-xs border border-white/20"
            >
              <h3 className="font-semibold mb-2 text-green-400">🌲 Forest Mode</h3>
              <div className="space-y-1 text-xs">
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">W A S D</kbd> Move around</p>
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">Mouse</kbd> Look around</p>
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">Ctrl+H</kbd> Toggle this interface</p>
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">Ctrl+F</kbd> Return to Timer mode</p>
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">M</kbd> Toggle map overlay</p>
                {/* Removed Esc key instruction */}
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">Ctrl+K</kbd> Command palette</p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/20 text-xs text-gray-300">
                <div>🌱 Sessions start as seeds</div>
                <div>🌿 Grow to bushes at 50% progress</div>
                <div>🌳 Become trees when completed!</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mapping/Minimap overlay */}
        <AnimatePresence>
          {showMapping && interfaceVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              className="absolute bottom-4 right-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20"
            >
              <div className="w-48 h-48 relative">
                <h4 className="text-sm font-semibold mb-2 text-green-400 flex items-center gap-2">
                  🗺️ Forest Map
                  <button 
                    onClick={() => setShowMapping(false)}
                    className="text-white/60 hover:text-white text-lg leading-none"
                    title="Close map (M)"
                  >
                    ×
                  </button>
                </h4>
                
                {/* Simple top-down forest representation */}
                <div className="w-full h-40 bg-green-900/30 rounded border border-green-500/30 relative overflow-hidden">
                  {/* Grid pattern for ground */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                  
                  {/* Trees scattered around */}
                  <div className="absolute top-2 left-4 w-2 h-2 bg-green-400 rounded-full opacity-80" title="Mature Tree"></div>
                  <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-green-500 rounded-full opacity-60" title="Growing Tree"></div>
                  <div className="absolute bottom-6 left-8 w-1 h-1 bg-yellow-400 rounded-full opacity-80" title="Seedling"></div>
                  <div className="absolute bottom-4 right-4 w-2 h-2 bg-green-300 rounded-full opacity-90" title="Mature Tree"></div>
                  <div className="absolute top-12 left-12 w-1.5 h-1.5 bg-green-600 rounded-full opacity-70" title="Bush"></div>
                  
                  {/* Player position indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" title="Your position"></div>
                    <div className="w-4 h-4 border border-blue-400/50 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
                  </div>
                  
                  {/* Exploration area indicator */}
                  <div className="absolute inset-2 border border-dashed border-white/20 rounded"></div>
                </div>
                
                <div className="mt-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>You are here</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Completed sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                    <span>New growth opportunities</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 3D Scene */}
        <KeyboardControls map={keyboardMap}>
          <Canvas
            shadows
            camera={{ position: [3, 3, 3], near: 0.1, fov: 40 }}
            style={{
              touchAction: "none",
            }}
          >
            <color attach="background" args={["#ececec"]} />
            <Experience debugMode={showDebug} />
          </Canvas>
        </KeyboardControls>
      </Suspense>
    </motion.div>
  )
}