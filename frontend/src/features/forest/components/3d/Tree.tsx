import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import type { Vector3 } from "three";
import { SkeletonUtils } from 'three-stdlib'

interface TreeProps {
  model: string;
  position: Vector3 | [number, number, number];
  scale?: number;
  debugMode?: boolean;
  [key: string]: any;
}

export const Tree = ({ model, position, scale = 5, debugMode = false, ...props }: TreeProps) => {
  const { scene } = useGLTF(model) as any;
  const group = useRef<any>(null);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene])

  // Configuration des ombres pour les arbres
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group position={position} scale={scale}>
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={cloned} {...props} ref={group}/>
      </RigidBody>
      
      {/* Debug helpers pour chaque arbre */}
      {debugMode && (
        <>
          {/* Point de position */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="red" />
          </mesh>
          
          {/* Axes locaux */}
          <axesHelper args={[1]} />
          
          {/* Bounding box pour visualiser la zone */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color="yellow" wireframe />
          </mesh>
        </>
      )}
    </group>
  );
};