'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3Tuple } from './types';

interface RoverVehicleProps {
  active: boolean;
  onPositionUpdate?: (pos: Vector3Tuple, speed: number) => void;
  targetFocus?: Vector3Tuple | null;
}

export function RoverVehicle({ active, onPositionUpdate }: RoverVehicleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);

  // Movement physics state
  const state = useRef({
    position: new THREE.Vector3(0, 0.4, 6),
    rotationY: 0,
    speed: 0,
    steering: 0,
    keys: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false,
    },
  });

  const { camera } = useThree();

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active) return;
      // Don't capture when typing in text inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const k = state.current.keys;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          k.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          k.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          k.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          k.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          k.boost = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = state.current.keys;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          k.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          k.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          k.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          k.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          k.boost = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active]);

  // Frame Loop (Physics & Camera Follow)
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const s = state.current;
    const maxSpeed = s.keys.boost ? 14 : 8;
    const accel = s.keys.boost ? 22 : 14;
    const friction = 10;
    const turnRate = 2.8;

    // Acceleration
    if (s.keys.forward) {
      s.speed = Math.min(s.speed + accel * delta, maxSpeed);
    } else if (s.keys.backward) {
      s.speed = Math.max(s.speed - accel * delta, -maxSpeed * 0.5);
    } else {
      // Natural deceleration
      if (s.speed > 0) {
        s.speed = Math.max(0, s.speed - friction * delta);
      } else if (s.speed < 0) {
        s.speed = Math.min(0, s.speed + friction * delta);
      }
    }

    // Steering
    if (Math.abs(s.speed) > 0.1) {
      const dir = s.speed > 0 ? 1 : -1;
      if (s.keys.left) {
        s.rotationY += turnRate * delta * dir;
      }
      if (s.keys.right) {
        s.rotationY -= turnRate * delta * dir;
      }
    }

    // Position updates
    const forwardX = Math.sin(s.rotationY);
    const forwardZ = Math.cos(s.rotationY);

    s.position.x += forwardX * s.speed * delta;
    s.position.z += forwardZ * s.speed * delta;

    // Clamp inside grid boundaries
    s.position.x = Math.max(-50, Math.min(50, s.position.x));
    s.position.z = Math.max(-50, Math.min(50, s.position.z));

    groupRef.current.position.copy(s.position);
    groupRef.current.rotation.y = s.rotationY;

    // Wheel rotation animation
    if (wheelsRef.current && Math.abs(s.speed) > 0.05) {
      wheelsRef.current.children.forEach((wheel) => {
        wheel.rotation.x += s.speed * delta * 4;
      });
    }

    // Camera follow when driving mode is active
    if (active) {
      const camOffset = new THREE.Vector3(
        s.position.x - forwardX * 7,
        s.position.y + 4.2,
        s.position.z - forwardZ * 7
      );
      camera.position.lerp(camOffset, 0.08);
      const lookTarget = new THREE.Vector3(
        s.position.x + forwardX * 4,
        s.position.y + 1,
        s.position.z + forwardZ * 4
      );
      camera.lookAt(lookTarget);
    }

    // Report position & speed back to HUD
    if (onPositionUpdate) {
      onPositionUpdate(
        [s.position.x, s.position.y, s.position.z],
        Math.abs(Math.round(s.speed * 10) / 10)
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.4, 6]}>
      {/* Rover Body / Chassis */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.2, 0.4, 1.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cyber Cockpit Visor */}
      <mesh position={[0, 0.45, 0.1]}>
        <boxGeometry args={[0.9, 0.25, 0.9]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0284c7"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Front Dual Headlights */}
      <mesh position={[-0.4, 0.25, 0.92]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0.4, 0.25, 0.92]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Dynamic Headlight Beam Casting light onto floor */}
      <spotLight
        ref={spotLightRef}
        position={[0, 0.4, 0.9]}
        target-position={[0, 0, 8]}
        angle={0.6}
        penumbra={0.5}
        intensity={2.5}
        color="#38bdf8"
        distance={20}
        castShadow
      />

      {/* Rear Brake / Thruster Glow */}
      <mesh position={[0, 0.25, -0.92]}>
        <boxGeometry args={[0.9, 0.08, 0.05]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>

      {/* Holographic Ground Circle Under Rover */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* 4 Off-road Wheels */}
      <group ref={wheelsRef}>
        {/* Front Left */}
        <mesh position={[-0.7, 0, 0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Front Right */}
        <mesh position={[0.7, 0, 0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Rear Left */}
        <mesh position={[-0.7, 0, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Rear Right */}
        <mesh position={[0.7, 0, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
