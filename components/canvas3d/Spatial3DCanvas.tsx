'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Spatial3DNodeData, Vector3Tuple } from './types';
import { PhysicsSpringNode } from './PhysicsSpringNode';
import { DataStreamEnergyBridges } from './DataStreamEnergyBridges';
import { CinematicFlightCamera } from './CinematicFlightCamera';
import { TacticalGameHUD } from './TacticalGameHUD';
import { ParticleDustField } from './ParticleDustField';
import { FullScaleCommandCenter } from './FullScaleCommandCenter';

export interface Spatial3DCanvasProps {
  nodes: Spatial3DNodeData[];
  isStreaming?: boolean;
  className?: string;
}

export function Spatial3DCanvas({
  nodes = [],
  isStreaming = false,
  className,
}: Spatial3DCanvasProps) {
  const [activeStationId, setActiveStationId] = useState<string>('overview');
  const [isFullScale, setIsFullScale] = useState<boolean>(false);

  // Compute camera flight targets for stations vs overview
  const { targetCamPos, targetLookAt } = useMemo(() => {
    if (activeStationId === 'overview' || !activeStationId) {
      return {
        targetCamPos: [0, 4, 12] as Vector3Tuple,
        targetLookAt: [0, 0.5, 0] as Vector3Tuple,
      };
    }

    const node = nodes.find((n) => n.id === activeStationId);
    if (node) {
      return {
        targetCamPos: [node.position[0], node.position[1] + 1.2, node.position[2] + 6.5] as Vector3Tuple,
        targetLookAt: [node.position[0], node.position[1] + 1.0, node.position[2]] as Vector3Tuple,
      };
    }

    return {
      targetCamPos: [0, 4, 12] as Vector3Tuple,
      targetLookAt: [0, 0.5, 0] as Vector3Tuple,
    };
  }, [activeStationId, nodes]);

  const handleSelectStation = useCallback((stationId: string) => {
    setActiveStationId(stationId);
  }, []);

  const handleResetOverview = useCallback(() => {
    setActiveStationId('overview');
  }, []);

  const handleNodeFocus = useCallback((node: Spatial3DNodeData) => {
    setActiveStationId(node.id);
  }, []);

  const handleToggleFullScale = useCallback(() => {
    setIsFullScale((prev) => !prev);
  }, []);

  return (
    <FullScaleCommandCenter
      isFullScale={isFullScale}
      onToggleFullScale={handleToggleFullScale}
      nodes={nodes}
    >
      {/* Tactical Game HUD Overlay */}
      <TacticalGameHUD
        nodes={nodes}
        activeStationId={activeStationId}
        onSelectStation={handleSelectStation}
        onResetOverview={handleResetOverview}
        isStreaming={isStreaming}
      />

      {/* 3D WebGL Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 4, 12], fov: 50 }}
        onDoubleClick={handleToggleFullScale}
      >
        <color attach="background" args={['#030712']} />

        {/* Ambient & High-contrast Sci-Fi Directional Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[12, 20, 16]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        <pointLight position={[0, 6, 0]} intensity={1.0} color="#00f0ff" distance={25} />

        {/* Cinematic Interpolating Camera */}
        <CinematicFlightCamera
          targetPosition={targetCamPos}
          targetLookAt={targetLookAt}
          flightTriggerKey={activeStationId}
        />

        {/* Smooth Orbit Controls with exact Zoom/Pan requested */}
        <OrbitControls
          makeDefault
          enableZoom={true}
          minDistance={3}
          maxDistance={25}
          zoomSpeed={0.8}
          panSpeed={0.8}
          dampingFactor={0.05}
          enableDamping={true}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.1}
        />

        {/* Floating Cosmic Particle Dust Field */}
        <ParticleDustField count={250} />

        {/* Dark Tactical Matrix Floor Grid */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.05, 0]}
          receiveShadow
          onClick={handleResetOverview}
        >
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#030712" roughness={0.9} metalness={0.1} />
        </mesh>

        <gridHelper
          args={[100, 50, new THREE.Color('#0284c7'), new THREE.Color('#1e293b')]}
          position={[0, 0.01, 0]}
        />

        {/* Dynamic Energy Bridges with Animated Photons */}
        <DataStreamEnergyBridges nodes={nodes} isStreaming={isStreaming} />

        {/* Spring & Physics-driven Floating Node Stations */}
        {nodes.map((node, i) => (
          <PhysicsSpringNode
            key={node.id}
            node={node}
            index={i}
            onFocus={handleNodeFocus}
            isFocused={activeStationId === node.id}
          />
        ))}
      </Canvas>
    </FullScaleCommandCenter>
  );
}

export default Spatial3DCanvas;
