'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { VerifiedMetric, EntityVerdict } from '@/types/morphui';

interface EntityObject3DProps {
  name: string;
  score: number;
  rank: number;
  position: [number, number, number];
  isLeader: boolean;
  onSelect: () => void;
  isSelected: boolean;
}

function EntityObject3D({
  name,
  score,
  rank,
  position,
  isLeader,
  onSelect,
  isSelected,
}: EntityObject3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pillarHeight = Math.max(1, (score / 100) * 4);

  useFrame((state) => {
    if (meshRef.current && isLeader) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Base Foundation Pillar */}
      <mesh position={[0, pillarHeight / 2, 0]}>
        <cylinderGeometry args={[0.9, 1.1, pillarHeight, 32]} />
        <meshStandardMaterial
          color={isLeader ? '#355E58' : '#053229'}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Floating Interactive Core Ring */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh
          ref={meshRef}
          position={[0, pillarHeight + 0.8, 0]}
          onClick={onSelect}
          scale={isSelected ? [1.2, 1.2, 1.2] : [1, 1, 1]}
        >
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color={isLeader ? '#FE9179' : '#72B0AB'}
            roughness={0.2}
            metalness={0.8}
            wireframe={isSelected}
          />
        </mesh>
      </Float>

      {/* 3D Label & Telemetry Badge */}
      <Html position={[0, pillarHeight + 2.0, 0]} center distanceFactor={14}>
        <div
          onClick={onSelect}
          className={`px-3 py-2 rounded-xl border text-xs font-sans whitespace-nowrap cursor-pointer transition-all shadow-xl ${
            isLeader
              ? 'bg-[#355E58] border-[#FE9179] text-[#FFEDD1]'
              : 'bg-[#053229] border-[#355E58] text-[#FFEDD1]'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span>{name}</span>
            <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${isLeader ? 'bg-[#FE9179]/20 text-[#FE9179]' : 'bg-[#355E58] text-[#BCDDDC]'}`}>
              #{rank}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#BCDDDC] mt-0.5">
            Priority Score: {score}%
          </div>
        </div>
      </Html>
    </group>
  );
}

interface MetricOrbProps {
  metric: string;
  weight: number;
  position: [number, number, number];
  summary: string;
}

function MetricOrb({ metric, weight, position, summary }: MetricOrbProps) {
  const [hovered, setHovered] = useState(false);
  const size = Math.max(0.25, Math.min(0.6, weight * 0.35));

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={weight > 1.2 ? '#FE9179' : '#BCDDDC'}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {hovered && (
        <Html position={[0, 0.8, 0]} center distanceFactor={12}>
          <div className="p-2 rounded-lg bg-[#355E58] border border-[#72B0AB] text-[11px] text-[#FFEDD1] shadow-2xl font-sans min-w-[120px]">
            <div className="font-bold text-[#FFEDD1]">{metric}</div>
            <div className="text-[10px] text-[#FE9179] font-mono">Weight: {weight}x</div>
            <div className="text-[10px] text-[#BCDDDC] mt-0.5">{summary}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

export interface Playable3DCanvasProps {
  entities: EntityVerdict[];
  metrics: VerifiedMetric[];
  weights: Record<string, number>;
}

export function Playable3DCanvas({
  entities = [],
  metrics = [],
  weights = {},
}: Playable3DCanvasProps) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const entityData = useMemo(() => {
    return entities.map((e, idx) => {
      let totalW = 0;
      let weightedSum = 0;

      metrics.forEach((m) => {
        const metricName = m.metric || 'Metric';
        const w = weights[metricName] !== undefined ? weights[metricName] : 1.0;
        const val = m.values?.[idx] !== undefined ? m.values[idx] : (idx === 0 ? m.entity_a : m.entity_b) || '';
        const num = parseFloat((val.match(/(\d+(\.\d+)?)/) || ['0', '0'])[1]);
        const score = num > 0 ? Math.min(100, Math.max(30, num % 100)) : 70;
        weightedSum += score * w;
        totalW += w;
      });

      const finalScore = totalW > 0 ? Math.round(weightedSum / totalW) : 75;
      const spacing = 7;
      const startX = -((entities.length - 1) * spacing) / 2;

      return {
        name: e.name || `Entity ${idx + 1}`,
        score: finalScore,
        rank: idx + 1,
        position: [startX + idx * spacing, 0, 0] as [number, number, number],
        isLeader: idx === 0,
      };
    });
  }, [entities, metrics, weights]);

  const metricOrbs = useMemo(() => {
    return metrics.slice(0, 8).map((m, idx) => {
      const metricName = m.metric || `Metric ${idx + 1}`;
      const weight = weights[metricName] !== undefined ? weights[metricName] : 1.0;
      const angle = (idx / Math.max(1, Math.min(8, metrics.length))) * Math.PI * 2;
      const radius = 4.5 + weight * 1.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 1.5 + (idx % 3) * 0.8;

      const valA = m.values?.[0] || m.entity_a || '';
      const valB = m.values?.[1] || m.entity_b || '';

      return {
        metric: metricName,
        weight: Math.round(weight * 10) / 10,
        position: [x, y, z] as [number, number, number],
        summary: `${valA.slice(0, 10)} / ${valB.slice(0, 10)}`,
      };
    });
  }, [metrics, weights]);

  return (
    <div className="w-full h-[650px] rounded-xl border border-[#355E58] bg-[#053229] overflow-hidden relative shadow-2xl">
      <div className="absolute top-3 left-3 z-10 p-2.5 rounded-lg bg-[#355E58]/90 border border-[#355E58] text-xs text-[#FFEDD1] backdrop-blur-md pointer-events-none">
        <div className="font-bold uppercase tracking-wider text-[#FE9179]">Playable 3D Spatial Canvas</div>
        <div className="text-[11px] text-[#BCDDDC]">Orbit, pan, and click nodes • Pillar elevation encodes real weighted scores</div>
      </div>

      <Canvas
        camera={{ position: [0, 6, 14], fov: 50 }}
        style={{ width: '100%', height: '100%', background: '#053229' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} color="#FFEDD1" />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#72B0AB" />

        {/* Spatial Coordinate Ground Grid */}
        <gridHelper args={[30, 30, '#355E58', '#053229']} position={[0, 0, 0]} />

        {/* Entity Objects */}
        {entityData.map((ent, idx) => (
          <EntityObject3D
            key={idx}
            name={ent.name}
            score={ent.score}
            rank={ent.rank}
            position={ent.position}
            isLeader={ent.isLeader}
            onSelect={() => setSelectedEntity(ent.name)}
            isSelected={selectedEntity === ent.name}
          />
        ))}

        {/* Metric Divergence Orbs */}
        {metricOrbs.map((orb, idx) => (
          <MetricOrb
            key={idx}
            metric={orb.metric}
            weight={orb.weight}
            position={orb.position}
            summary={orb.summary}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
}
