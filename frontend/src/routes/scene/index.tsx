import { Experience } from '@/features/forest/components/3d/Experience'
import { DebugInfo } from '@/features/forest/components/3d/DebugInfo'
import { KeyboardControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createFileRoute } from '@tanstack/react-router'
import { useControls } from 'leva'

export const Route = createFileRoute('/scene/')({
  component: ExperiencePage,
})

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["Shift"] },
];

function ExperiencePage() {
  const { debugMode } = useControls("Map", {
    debugMode: {
      value: false,
      label: "Debug Mode"
    }
  });

  return (
    <div className="h-screen w-screen">
      <DebugInfo debugMode={debugMode} />
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{ position: [3, 3, 3], near: 0.1, fov: 40 }}
          style={{
            touchAction: "none",
          }}
        >
          <color attach="background" args={["#ececec"]} />
          <Experience debugMode={debugMode} />
        </Canvas>
      </KeyboardControls>
    </div>
  )
}