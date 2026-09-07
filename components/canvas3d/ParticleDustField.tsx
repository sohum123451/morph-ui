'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ParticleDustField({ count = 350 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 25 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;

      sc[i] = Math.random() * 0.15 + 0.05;
    }

    return [pos, sc];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * 0.2;
    const pos = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      let y = pos.getY(i);
      y += Math.sin(t + i) * 0.015;
      if (y > 26) y = 0.5;
      if (y < 0.5) y = 26;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#38bdf8"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
