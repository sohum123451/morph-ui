'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Spatial3DNodeData, Vector3Tuple } from './types';
import { Spatial3DGrid } from './Spatial3DGrid';
import { Spatial3DNode } from './Spatial3DNode';
import { Spatial3DConnections } from './Spatial3DConnections';
import { RoverVehicle } from './RoverVehicle';
import { Spatial3DHUD } from './Spatial3DHUD';

interface CameraControllerProps {
  targetPosition: Vector3Tuple;
  targetLookAt: Vector3Tuple;
  isDriving: boolean;
}

function CameraController({ targetPosition, targetLookAt, isDriving }: CameraControllerProps) {
  const { camera } = useThree();

  useFrame(() => {
    if (isDriving) return; // Rover handles camera follow

    const curPos = camera.position;
    const dest = new THREE.Vector3(...targetPosition);
    curPos.lerp(dest, 0.05);

    // Look at target point smoothly
    const lookDest = new THREE.Vector3(...targetLookAt);
    camera.lookAt(lookDest);
  });

  return null;
}

export interface SpatialCanvas3DProps {
  nodes: Spatial3DNodeData[];
  className?: string;
  theme?: 'dark' | 'light' | 'botanical' | 'pink';
}

export function SpatialCanvas3D({
  nodes = [],
  className = 'relative w-full h-[60vh] sm:h-[70vh] md:h-[calc(100vh-140px)] min-h-[480px] rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl bg-zinc-950',
  theme = 'dark',
}: SpatialCanvas3DProps) {
  const [activePreset, setActivePreset] = useState<string>('overview');
  const [roverActive, setRoverActive] = useState<boolean>(false);
  const [roverPos, setRoverPos] = useState<Vector3Tuple>([0, 0.4, 6]);
  const [roverSpeed, setRoverSpeed] = useState<number>(0);

  // Dynamic Camera targets for stations
  const { camPos, camLookAt } = useMemo(() => {
    if (activePreset === 'overview') {
      return {
        camPos: [0, 18, 22] as Vector3Tuple,
        camLookAt: [0, 1, 0] as Vector3Tuple,
      };
    }

    const targetNode = nodes.find((n) => n.id === activePreset);
    if (targetNode) {
      const p = targetNode.position;
      return {
        camPos: [p[0], p[1] + 1.8, p[2] + 9] as Vector3Tuple,
        camLookAt: [p[0], p[1] + 1.5, p[2]] as Vector3Tuple,
      };
    }

    return {
      camPos: [0, 18, 22] as Vector3Tuple,
      camLookAt: [0, 1, 0] as Vector3Tuple,
    };
  }, [activePreset, nodes]);

  const handleSelectPreset = useCallback((presetId: string) => {
    setRoverActive(false);
    setActivePreset(presetId);
  }, []);

  const handleNodeFocus = useCallback((node: Spatial3DNodeData) => {
    setRoverActive(false);
    setActivePreset(node.id);
  }, []);

  const handleToggleRover = useCallback(() => {
    setRoverActive((prev) => !prev);
  }, []);

  const handleResetCamera = useCallback(() => {
    setRoverActive(false);
    setActivePreset('overview');
  }, []);

  const handleRoverUpdate = useCallback((pos: Vector3Tuple, speed: number) => {
    setRoverPos(pos);
    setRoverSpeed(speed);
  }, []);

  return (
    <div className={className}>
      {/* 2D HUD UI Overlay */}
      <Spatial3DHUD
        nodes={nodes}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        roverActive={roverActive}
        onToggleRover={handleToggleRover}
        roverPos={roverPos}
        roverSpeed={roverSpeed}
        onResetCamera={handleResetCamera}
      />

      {/* Three.js WebGL Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 18, 22], fov: 45 }}
      >
        <color attach="background" args={['#030712']} />

        {/* Ambient & Directional Scene Lighting */}
        <ambientLight intensity={0.6} />
        <hemisphereLight
          args={['#38bdf8', '#0f172a', 0.5]}
        />
        <directionalLight
          position={[12, 24, 18]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={60}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />

        {/* Camera Lerp Controller */}
        <CameraController
          targetPosition={camPos}
          targetLookAt={camLookAt}
          isDriving={roverActive}
        />

        {/* Controls */}
        {!roverActive && (
          <OrbitControls
            makeDefault
            minDistance={4}
            maxDistance={50}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2.1}
            enableDamping
            dampingFactor={0.05}
          />
        )}

        {/* 3D Grid Terrain */}
        <Spatial3DGrid />

        {/* 3D Cable Connections Between Stations */}
        <Spatial3DConnections nodes={nodes} />

        {/* Controllable Rover / Drone Navigator */}
        <RoverVehicle
          active={roverActive}
          onPositionUpdate={handleRoverUpdate}
        />

        {/* 3D Spatial Widget Nodes */}
        {nodes.map((node) => (
          <Spatial3DNode
            key={node.id}
            node={node}
            onFocus={handleNodeFocus}
            isFocused={activePreset === node.id}
          />
        ))}
      </Canvas>
    </div>
  );
}

export default SpatialCanvas3D;
