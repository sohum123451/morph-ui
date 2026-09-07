'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Spatial3DNodeData, Vector3Tuple } from './types';

interface DataStreamEnergyBridgesProps {
  nodes: Spatial3DNodeData[];
  isStreaming?: boolean;
}

export function DataStreamEnergyBridges({ nodes, isStreaming = false }: DataStreamEnergyBridgesProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Compute Bezier curves connecting nodes sequentially
  const { curves, particlePositions, colors } = useMemo(() => {
    if (nodes.length < 2) return { curves: [], particlePositions: new Float32Array(0), colors: new Float32Array(0) };

    const curveList: THREE.QuadraticBezierCurve3[] = [];
    const particleCountPerSegment = 40;
    const totalParticles = (nodes.length - 1) * particleCountPerSegment;
    const posArray = new Float32Array(totalParticles * 3);
    const colorArray = new Float32Array(totalParticles * 3);

    for (let i = 0; i < nodes.length - 1; i++) {
      const pA = nodes[i].position;
      const pB = nodes[i + 1].position;

      const vA = new THREE.Vector3(pA[0], pA[1] + 0.2, pA[2]);
      const vB = new THREE.Vector3(pB[0], pB[1] + 0.2, pB[2]);

      // Elevated curved arch midpoint
      const mid = new THREE.Vector3().addVectors(vA, vB).multiplyScalar(0.5);
      mid.y += 2.5;

      const curve = new THREE.QuadraticBezierCurve3(vA, mid, vB);
      curveList.push(curve);

      const baseColor = new THREE.Color(nodes[i].accentColor || '#00f0ff');

      for (let j = 0; j < particleCountPerSegment; j++) {
        const idx = (i * particleCountPerSegment + j) * 3;
        const t = j / particleCountPerSegment;
        const pt = curve.getPoint(t);
        posArray[idx] = pt.x;
        posArray[idx + 1] = pt.y;
        posArray[idx + 2] = pt.z;

        colorArray[idx] = baseColor.r;
        colorArray[idx + 1] = baseColor.g;
        colorArray[idx + 2] = baseColor.b;
      }
    }

    return { curves: curveList, particlePositions: posArray, colors: colorArray };
  }, [nodes]);

  // Animated Energy Photons traveling along bezier paths
  useFrame(({ clock }) => {
    if (!particlesRef.current || curves.length === 0) return;

    const t = clock.getElapsedTime();
    const speed = isStreaming ? 1.2 : 0.45;
    const posAttr = particlesRef.current.geometry.attributes.position;
    const particleCountPerSegment = 40;

    let particleGlobalIdx = 0;

    curves.forEach((curve) => {
      for (let j = 0; j < particleCountPerSegment; j++) {
        // Offset time so particles stream continuously
        const progress = ((t * speed + j / particleCountPerSegment) % 1);
        const pt = curve.getPoint(progress);

        posAttr.setXYZ(particleGlobalIdx, pt.x, pt.y, pt.z);
        particleGlobalIdx++;
      }
    });

    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* Base Spline Lines */}
      {curves.map((curve, idx) => {
        const points = curve.getPoints(50);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive
            key={`line-${idx}`}
            object={new THREE.Line(
              geo,
              new THREE.LineBasicMaterial({
                color: new THREE.Color(nodes[idx]?.accentColor || '#00f0ff'),
                transparent: true,
                opacity: 0.35,
                linewidth: 1,
              })
            )}
          />
        );
      })}

      {/* Pulsing Quantum Energy Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
