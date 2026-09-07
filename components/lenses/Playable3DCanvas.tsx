'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
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
  isDark: boolean;
}

function EntityObject3D({
  name,
  score,
  rank,
  position,
  isLeader,
  onSelect,
  isSelected,
  isDark,
}: EntityObject3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pillarRef = useRef<THREE.Mesh>(null);
  const targetPillarHeight = Math.max(1, (score / 100) * 4);
  const currentHeight = useRef(targetPillarHeight);

  useFrame((state, delta) => {
    // Smooth frame lerp for pillar elevation
    currentHeight.current = THREE.MathUtils.lerp(
      currentHeight.current,
      targetPillarHeight,
      delta * 4.0
    );

    if (pillarRef.current) {
      pillarRef.current.scale.y = currentHeight.current;
      pillarRef.current.position.y = currentHeight.current / 2;
    }

    if (meshRef.current && isLeader) {
      meshRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group position={position}>
      {/* Smoothly Animated Foundation Pillar */}
      <mesh ref={pillarRef} position={[0, targetPillarHeight / 2, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 1, 32]} />
        <meshStandardMaterial
          color={isDark ? (isLeader ? '#355E58' : '#1D443D') : (isLeader ? '#DCD4C4' : '#EAE4D6')}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Floating Interactive Core Ring */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh
          ref={meshRef}
          position={[0, targetPillarHeight + 0.8, 0]}
          onClick={onSelect}
          scale={isSelected ? [1.25, 1.25, 1.25] : [1, 1, 1]}
        >
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color={isLeader ? (isDark ? '#FE9179' : '#C85A3F') : (isDark ? '#72B0AB' : '#2D6F69')}
            roughness={0.2}
            metalness={0.8}
            wireframe={isSelected}
          />
        </mesh>
      </Float>

      {/* 3D Label & Telemetry Badge */}
      <Html position={[0, targetPillarHeight + 2.0, 0]} center distanceFactor={14}>
        <div
          onClick={onSelect}
          className={`px-3 py-2 rounded-xl border text-xs font-sans whitespace-nowrap cursor-pointer transition-all duration-300 shadow-md ${
            isLeader
              ? 'bg-theme-card border-theme-accent text-theme-text'
              : 'bg-theme-bg border-theme-border text-theme-text'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span>{name}</span>
            <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${isLeader ? 'bg-theme-accent/20 text-theme-accent' : 'bg-theme-card text-theme-secondary'}`}>
              #{rank}
            </span>
          </div>
          <div className="text-[10px] font-mono text-theme-secondary mt-0.5">
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
  isDark: boolean;
}

function MetricOrb({ metric, weight, position, summary, isDark }: MetricOrbProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const targetSize = Math.max(0.25, Math.min(0.6, weight * 0.35));
  const currentSize = useRef(targetSize);

  useFrame((state, delta) => {
    currentSize.current = THREE.MathUtils.lerp(currentSize.current, targetSize, delta * 5.0);
    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentSize.current);
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color={weight > 1.2 ? (isDark ? '#FE9179' : '#C85A3F') : (isDark ? '#BCDDDC' : '#627E78')}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      </group>

      {hovered && (
        <Html position={[0, 0.9, 0]} center distanceFactor={12}>
          <div className="p-2.5 rounded-lg bg-theme-card border border-theme-focus text-[11px] text-theme-text shadow-xl font-sans min-w-[130px]">
            <div className="font-bold text-theme-text">{metric}</div>
            <div className="text-[10px] text-theme-accent font-mono font-bold">Weight: {weight}x</div>
            <div className="text-[10px] text-theme-secondary mt-0.5">{summary}</div>
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
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  const canvasBg = isDark ? '#053229' : '#F7F4EE';
  const gridLine1 = isDark ? '#355E58' : '#D5CCC0';
  const gridLine2 = isDark ? '#1D443D' : '#EAE4D6';

  return (
    <div className="w-full h-[650px] rounded-xl border border-theme-border bg-theme-bg overflow-hidden relative shadow-md">
      <div className="absolute top-3 left-3 z-10 p-2.5 rounded-lg bg-theme-card border border-theme-border text-xs text-theme-text shadow-sm pointer-events-none">
        <div className="font-bold uppercase tracking-wider text-theme-accent">Playable 3D Spatial Canvas</div>
        <div className="text-[11px] text-theme-secondary">Orbit, pan, and click nodes • Elevation eases smoothly with live weights</div>
      </div>

      <Canvas
        camera={{ position: [0, 6, 14], fov: 50 }}
        style={{ width: '100%', height: '100%', background: canvasBg }}
      >
        <ambientLight intensity={isDark ? 0.8 : 1.1} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} color={isDark ? '#FFEDD1' : '#FFFFFF'} />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color={isDark ? '#72B0AB' : '#2D6F69'} />

        {/* Spatial Coordinate Ground Grid */}
        <gridHelper args={[30, 30, gridLine1, gridLine2]} position={[0, 0, 0]} />

        {/* Entity Objects with Frame Easing */}
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
            isDark={isDark}
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
            isDark={isDark}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
}
