import { useGLTF, Text, Html } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import { SkeletonUtils } from 'three-stdlib'
import type { ForestTree } from "../../slices/forestSlice";

interface TreeProps {
  tree: ForestTree;
  debugMode?: boolean;
  showSessionInfo?: boolean;
  [key: string]: any;
}

// Tree model paths based on type
const TREE_MODELS = {
  oak: '/models/trees/Oak.glb',
  pine: '/models/trees/Pine.glb', 
  birch: '/models/trees/Birch.glb',
  willow: '/models/trees/Willow.glb'
} as const;

export const Tree = ({ tree, debugMode = false, showSessionInfo = false, ...props }: TreeProps) => {
  const [hovered, setHovered] = useState(false);
  const modelPath = TREE_MODELS[tree.treeType] || TREE_MODELS.oak;
  const { scene } = useGLTF(modelPath) as any;
  const group = useRef<any>(null);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Configuration des ombres pour les arbres
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Apply health-based material modifications
        if (child.material) {
          const healthFactor = tree.health;
          // Adjust material properties based on tree health
          if (healthFactor < 0.5) {
            // Unhealthy trees are darker/less vibrant
            child.material.color?.multiplyScalar(0.7 + healthFactor * 0.3);
          }
        }
      }
    });
  }, [scene, tree.health]);

  return (
    <group 
      position={[tree.position.x, tree.position.y, tree.position.z]} 
      scale={tree.scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={cloned} {...props} ref={group}/>
      </RigidBody>
      
      {/* Session info display on hover */}
      {(hovered || showSessionInfo) && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            <div>{tree.mode} • {tree.duration}min</div>
            <div>{tree.plantedDate}</div>
            {tree.completed ? (
              <div className="text-green-400">✓ Completed</div>
            ) : (
              <div className="text-yellow-400">○ Incomplete</div>
            )}
          </div>
        </Html>
      )}
      
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
          
          {/* Session info text */}
          <Text
            position={[0, 2.5, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {`${tree.treeType} • ${tree.duration}min • ${tree.completed ? 'Complete' : 'Incomplete'}`}
          </Text>
        </>
      )}
    </group>
  );
};