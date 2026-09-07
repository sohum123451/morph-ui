'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Spatial3DNodeData } from './types';

interface Spatial3DNodeProps {
  node: Spatial3DNodeData;
  onFocus?: (node: Spatial3DNodeData) => void;
  isFocused?: boolean;
}

export function Spatial3DNode({ node, onFocus, isFocused }: Spatial3DNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const accentColor = node.accentColor || '#38bdf8';

  // Gentle levitation bobbing
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + (node.nodeIndex || 0) * 1.2;
    groupRef.current.position.y = node.position[1] + Math.sin(t * 1.5) * 0.08;
  });

  return (
    <group position={node.position}>
      {/* 3D Ground Station Pedestal */}
      <mesh
        position={[0, 0.1, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFocus?.(node);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[1.8, 2.2, 0.2, 32]} />
        <meshStandardMaterial
          color="#090d16"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Glowing Cybernetic Base Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}>
        <ringGeometry args={[1.6, 1.8, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={hovered || isFocused ? 0.9 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Panel Anchor Geometry */}
      <group ref={groupRef} position={[0, node.position[1], 0]}>
        {/* Mini Holographic Base Beacon */}
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.25]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={hovered ? 1.5 : 0.8}
            wireframe
          />
        </mesh>

        {/* Drei HTML Overlay wrapping the interactive widget */}
        <Html
          transform
          distanceFactor={18}
          position={[0, 1.8, 0]}
          center
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          <div
            onClick={(e) => {
              // Clicking inside the widget card focuses it
              e.stopPropagation();
              onFocus?.(node);
            }}
            className={`transition-all duration-300 ${
              isFocused ? 'scale-[1.02] ring-2 ring-sky-500/80' : ''
            }`}
          >
            {node.content}
          </div>
        </Html>
      </group>
    </group>
  );
}
