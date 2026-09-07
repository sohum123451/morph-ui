'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Spatial3DNodeData } from './types';

interface PhysicsSpringNodeProps {
  node: Spatial3DNodeData;
  onFocus: (node: Spatial3DNodeData) => void;
  isFocused: boolean;
  index: number;
}

export function PhysicsSpringNode({ node, onFocus, isFocused, index }: PhysicsSpringNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Physics Spring Simulation State (Harmonic Damped Oscillator)
  const spring = useRef({
    currentY: node.position[1],
    targetY: node.position[1],
    velocity: 0,
    currentScale: 1,
    targetScale: 1,
    scaleVelocity: 0,
    rotX: 0,
    rotZ: 0,
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = spring.current;

    // Organic atmospheric bob
    const t = performance.now() * 0.0015 + index * 1.5;
    const ambientBob = Math.sin(t * 1.8) * 0.12 + Math.cos(t * 0.9) * 0.06;

    s.targetY = node.position[1] + (isFocused ? 0.35 : 0) + (hovered ? 0.2 : 0) + ambientBob;
    s.targetScale = isFocused ? 1.04 : hovered ? 1.02 : 1;

    // Spring physics integration: F = -k*(x - target) - c*velocity
    const stiffness = 160;
    const damping = 14;

    const forceY = -stiffness * (s.currentY - s.targetY) - damping * s.velocity;
    s.velocity += forceY * delta;
    s.currentY += s.velocity * delta;

    const forceScale = -stiffness * (s.currentScale - s.targetScale) - damping * s.scaleVelocity;
    s.scaleVelocity += forceScale * delta;
    s.currentScale += s.scaleVelocity * delta;

    groupRef.current.position.y = s.currentY;
    groupRef.current.scale.setScalar(s.currentScale);

    // Subtle tilt toward orientation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, hovered ? 0.03 : 0, 0.1);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, hovered ? -0.02 : 0, 0.1);

    // Spin repulsion ring
    if (ringRef.current) {
      ringRef.current.rotation.z += (hovered || isFocused ? 0.04 : 0.015);
    }
  });

  const accentColor = node.accentColor || '#00f0ff';

  return (
    <group position={[node.position[0], 0, node.position[2]]}>
      {/* 3D Cybernetic Ground Anchor Pedestal */}
      <mesh
        position={[0, 0.05, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFocus(node);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[2.2, 2.6, 0.1, 32]} />
        <meshStandardMaterial
          color="#060913"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Plasma Energy Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.12, 0]}
      >
        <ringGeometry args={[2.0, 2.2, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={hovered || isFocused ? 0.95 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Upward Holographic Data Beacon Beam */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.02, 0.08, 2.4, 8]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={hovered || isFocused ? 0.6 : 0.2}
        />
      </mesh>

      {/* Floating Workstation Container */}
      <group ref={groupRef} position={[0, node.position[1], 0]}>
        {/* Node Telemetry Tag floating above widget */}
        <Html
          transform
          distanceFactor={18}
          position={[0, 3.4, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-700/80 backdrop-blur-md shadow-2xl text-[10px] font-mono tracking-widest uppercase">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-slate-300 font-bold">{node.tag}</span>
            <span className="text-slate-500">|</span>
            <span style={{ color: accentColor }}>{node.status}</span>
          </div>
        </Html>

        {/* Interactive Widget Panel via Drei Html */}
        <Html
          transform
          distanceFactor={16}
          position={[0, 0.5, 0]}
          center
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onFocus(node);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`transition-all duration-300 ${
              isFocused
                ? 'ring-2 ring-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.25)] scale-[1.01]'
                : hovered
                ? 'ring-1 ring-cyan-500/50 shadow-xl'
                : 'opacity-95'
            }`}
          >
            {node.content}
          </div>
        </Html>
      </group>
    </group>
  );
}
