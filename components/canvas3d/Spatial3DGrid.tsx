'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface Spatial3DGridProps {
  size?: number;
  divisions?: number;
  gridColor?: string;
  subColor?: string;
  floorColor?: string;
}

export function Spatial3DGrid({
  size = 120,
  divisions = 60,
  gridColor = '#0284c7', // Sky 600
  subColor = '#1e293b',  // Slate 800
  floorColor = '#030712', // Zinc 950
}: Spatial3DGridProps) {
  return (
    <group position={[0, 0, 0]}>
      {/* Base shadow-receiving ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[size * 1.5, size * 1.5]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Grid Helper with glowing primary / secondary coordinates */}
      <gridHelper
        args={[size, divisions, new THREE.Color(gridColor), new THREE.Color(subColor)]}
        position={[0, 0.01, 0]}
      />

      {/* Subtle outer horizon ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[size * 0.48, size * 0.5, 64]} />
        <meshBasicMaterial color={gridColor} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
