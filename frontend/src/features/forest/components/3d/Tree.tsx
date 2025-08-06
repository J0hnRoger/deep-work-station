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

// Tree model paths based on type and evolution stage
const TREE_MODELS = {
  // Final tree models
  oak: '/models/trees/Oak.glb',
  pine: '/models/trees/Pine.glb', 
  birch: '/models/trees/Birch.glb',
  willow: '/models/trees/Willow.glb',
  // Evolution stages
  seed: '/models/trees/seed.glb',
  bush: '/models/trees/bush.glb'
} as const;

// Preload evolution stage models to ensure smooth transitions
useGLTF.preload(TREE_MODELS.seed);
useGLTF.preload(TREE_MODELS.bush);

export const Tree = ({ tree, debugMode = false, showSessionInfo = false, ...props }: TreeProps) => {
  const [hovered, setHovered] = useState(false);
  const [lastStage, setLastStage] = useState(tree.evolutionStage);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Select model based on evolution stage
  const getModelPath = () => {
    switch (tree.evolutionStage) {
      case 'seed': return TREE_MODELS.seed
      case 'bush': return TREE_MODELS.bush
      case 'tree': return TREE_MODELS[tree.treeType] || TREE_MODELS.oak
      default: return TREE_MODELS.seed
    }
  }
  
  const modelPath = getModelPath();
  const { scene } = useGLTF(modelPath) as any;
  const group = useRef<any>(null);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  
  // Handle evolution stage transitions with visual feedback
  useEffect(() => {
    if (tree.evolutionStage !== lastStage) {
      console.log(`🌱 Tree evolution: ${lastStage} → ${tree.evolutionStage} (Session: ${tree.sessionId})`);
      setIsTransitioning(true);
      
      // Brief transition animation
      setTimeout(() => {
        setIsTransitioning(false);
        setLastStage(tree.evolutionStage);
      }, 300);
    }
  }, [tree.evolutionStage, lastStage, tree.sessionId]);

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

  // Add scale animation for transitions and breathing effect for active trees
  const isActive = !tree.completed && tree.sessionProgress !== undefined;
  const scaleMultiplier = isTransitioning ? 1.1 : 1.0;
  const breathingScale = isActive ? 1 + Math.sin(Date.now() * 0.002) * 0.02 : 1;
  const finalScale = tree.scale * scaleMultiplier * breathingScale;
  
  return (
    <group 
      position={[tree.position.x, tree.position.y - 0.5, tree.position.z]} 
      scale={finalScale}
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
            <div className="flex items-center gap-1">
              {tree.evolutionStage === 'seed' && <span>🌱</span>}
              {tree.evolutionStage === 'bush' && <span>🌿</span>}
              {tree.evolutionStage === 'tree' && <span>🌳</span>}
              <span className="capitalize">{tree.evolutionStage}</span>
              {tree.sessionProgress !== undefined && (
                <span className="text-blue-400">({Math.round(tree.sessionProgress * 100)}%)</span>
              )}
              {isTransitioning && (
                <span className="text-green-400 animate-pulse">✨ Growing!</span>
              )}
            </div>
            {tree.completed ? (
              <div className="text-green-400">✓ Completed</div>
            ) : (
              <div className="text-yellow-400">○ In Progress</div>
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
            {`${tree.evolutionStage} • ${tree.treeType} • ${tree.duration}min • ${tree.completed ? 'Complete' : 'In Progress'}`}
          </Text>
        </>
      )}
    </group>
  );
};