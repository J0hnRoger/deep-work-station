import { Experience } from '@/features/forest/components/3d/Experience'
import { KeyboardControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createFileRoute } from '@tanstack/react-router'

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
  return (
    <div className="h-screen w-screen">
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{ position: [3, 3, 3], near: 0.1, fov: 40 }}
          style={{
            touchAction: "none",
          }}
        >
          <color attach="background" args={["#ececec"]} />
          <Experience />
        </Canvas>
      </KeyboardControls>
    </div>
  )
}