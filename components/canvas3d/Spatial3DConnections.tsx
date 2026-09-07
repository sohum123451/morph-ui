'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3Tuple } from './types';

interface Spatial3DConnectionsProps {
  nodes: Array<{ id: string; position: Vector3Tuple }>;
}

export function Spatial3DConnections({ nodes }: Spatial3DConnectionsProps) {
  const lines = useMemo(() => {
    if (nodes.length < 2) return [];
    const segments: Array<{ points: THREE.Vector3[]; key: string; color: string }> = [];

    const colors = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#a855f7'];

    for (let i = 0; i < nodes.length - 1; i++) {
      const pA = nodes[i].position;
      const pB = nodes[i + 1].position;

      const vA = new THREE.Vector3(pA[0], 0.2, pA[2]);
      const vB = new THREE.Vector3(pB[0], 0.2, pB[2]);

      // Create a smooth curved midpoint arc
      const mid = new THREE.Vector3()
        .addVectors(vA, vB)
        .multiplyScalar(0.5);
      mid.y = 1.2; // elevated arch

      const curve = new THREE.QuadraticBezierCurve3(vA, mid, vB);
      const points = curve.getPoints(32);

      segments.push({
        points,
        key: `conn-${nodes[i].id}-${nodes[i + 1].id}`,
        color: colors[i % colors.length],
      });
    }

    return segments;
  }, [nodes]);

  return (
    <group>
      {lines.map((line) => (
        <LineSegment key={line.key} points={line.points} color={line.color} />
      ))}
    </group>
  );
}

function LineSegment({ points, color }: { points: THREE.Vector3[]; color: string }) {
  const lineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <group>
      {/* Base line */}
      <primitive
        object={new THREE.Line(
          lineGeo,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.7,
            linewidth: 2,
          })
        )}
      />
    </group>
  );
}
