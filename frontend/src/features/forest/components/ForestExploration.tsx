import { Suspense, useEffect, useRef } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Store selectors
  const viewMode = useAppStore(state => state.ui.viewMode)
  const interfaceVisible = useAppStore(state => state.ui.interfaceVisible)
  const debugMode = useAppStore(state => state.general.debugMode)
  // const exitForestMode = useAppStore(state => state.exitForestMode) // For future use
  const toggleInterface = useAppStore(state => state.toggleInterface)
  
  // Only show debug in development or if explicitly enabled
  const showDebug = debugMode && process.env.NODE_ENV === 'development'
  
  // Keyboard controls for Forest mode
  useEffect(() => {
    if (viewMode !== 'forest') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape - Release pointer lock (don't exit forest mode)
      if (e.key === 'Escape') {
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
        return
      }
      
      // Ctrl+H - Toggle interface
      if ((e.key === 'h' || e.key === 'H') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        toggleInterface()
        return
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, toggleInterface])
  
  // Handle pointer lock on canvas click
  const handleCanvasClick = () => {
    if (viewMode === 'forest' && canvasRef.current) {
      canvasRef.current.requestPointerLock()
    }
  }
  
  // Auto-request pointer lock when entering forest mode
  useEffect(() => {
    if (viewMode === 'forest' && canvasRef.current) {
      // Small delay to ensure canvas is ready
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.requestPointerLock()
        }
      }, 100)
    }
  }, [viewMode])
  
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
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">Esc</kbd> Release cursor</p>
                <p><kbd className="px-1 py-0.5 bg-white/20 rounded text-black font-mono">Ctrl+K</kbd> Command palette</p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/20 text-xs text-gray-300">
                💡 Complete focus sessions to grow trees!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 3D Scene */}
        <KeyboardControls map={keyboardMap}>
          <Canvas
            ref={canvasRef}
            shadows
            camera={{ position: [3, 3, 3], near: 0.1, fov: 40 }}
            onClick={handleCanvasClick}
            style={{
              touchAction: "none",
              cursor: 'none', // Hide cursor when in forest mode
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