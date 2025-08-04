import { Environment, OrthographicCamera, Grid, OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useControls } from "leva";
import { useRef } from "react";
import { CharacterController } from "./CharacterController";
import { Map } from "./Map";
import { useForestStore } from "../../hooks/useForestStore";
import { Tree } from "./Tree";

type MapConfig = {
    scale: number;
    position: [number, number, number];
};

const maps: Record<string, MapConfig> = {
    floor_grass: {
        scale: 2,
        position: [0, -1, 0],
    },
    forest: {
        scale: 10,
        position: [0, 0, 0],
    },
    castle_on_hills: {
        scale: 3,
        position: [-6, -7, 0],
    },
    animal_crossing_map: {
        scale: 20,
        position: [-15, -1, 10],
    },
    city_scene_tokyo: {
        scale: 0.72,
        position: [0, -1, -3.5],
    },
    de_dust_2_with_real_light: {
        scale: 0.3,
        position: [-5, -3, 13],
    },
    medieval_fantasy_book: {
        scale: 0.4,
        position: [-4, 0, -6],
    },
    walk_in_the_woods: {
        scale: 10,
        position: [0, 0, 0],
    },
};

interface ExperienceProps {
    debugMode?: boolean;
}

export const Experience = ({ debugMode = false }: ExperienceProps) => {
    const { trees } = useForestStore()

    const shadowCameraRef = useRef(null);
    const { map, showTrees } = useControls("Map", {
        map: {
            value: "floor_grass",
            options: Object.keys(maps),
        },
        showTrees: {
            value: true,
            label: "Show Trees"
        }
    });

    return (
        <>
            {debugMode && <OrbitControls />}
            <Environment preset="sunset" />
            <directionalLight
                intensity={0.65}
                castShadow
                position={[-15, 10, 15]}
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-bias={-0.00005}
            >
                <OrthographicCamera
                    left={-22}
                    right={15}
                    top={10}
                    bottom={-20}
                    ref={shadowCameraRef}
                    attach={"shadow-camera"}
                />
            </directionalLight>
            <Physics key={map}>
                {showTrees && trees.map((tree) => (
                    <Tree
                        key={tree.id}
                        tree={tree}
                        debugMode={debugMode}
                        showSessionInfo={debugMode}
                    />
                ))}
                <Map
                    scale={maps[map].scale}
                    position={maps[map].position}
                    model={`models/${map}.glb`}
                />
                <CharacterController />
            </Physics>

            {/* Debug helpers */}
            {debugMode && (
                <>
                    <Grid
                        args={[20, 20]}
                        cellSize={1}
                        cellThickness={0.5}
                        cellColor="#6f6f6f"
                        sectionSize={5}
                        sectionThickness={1}
                        sectionColor="#9d4b4b"
                        fadeDistance={25}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid={true}
                    />
                    <axesHelper args={[5]} />
                </>
            )}
        </>
    );
};