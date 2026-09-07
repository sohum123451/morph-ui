'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3Tuple } from './types';

interface CinematicFlightCameraProps {
  targetPosition: Vector3Tuple;
  targetLookAt: Vector3Tuple;
  flightTriggerKey: string;
}

export function CinematicFlightCamera({
  targetPosition,
  targetLookAt,
  flightTriggerKey,
}: CinematicFlightCameraProps) {
  const { camera } = useThree();

  const camState = useRef({
    pos: new THREE.Vector3(...targetPosition),
    look: new THREE.Vector3(...targetLookAt),
    flightProgress: 1, // 0 = start, 1 = arrived
    duration: 1.2,
    startPos: new THREE.Vector3(),
    startLook: new THREE.Vector3(),
  });

  // Whenever target changes, trigger a cinematic flight swoop curve
  useEffect(() => {
    const s = camState.current;
    s.startPos.copy(camera.position);
    s.startLook.copy(s.look);
    s.pos.set(...targetPosition);
    s.look.set(...targetLookAt);
    s.flightProgress = 0;
  }, [flightTriggerKey, targetPosition, targetLookAt, camera]);

  useFrame((_, delta) => {
    const s = camState.current;
    if (s.flightProgress < 1) {
      s.flightProgress = Math.min(1, s.flightProgress + delta / s.duration);

      // Quintic smooth cubic ease-in-out curve
      const p = s.flightProgress;
      const ease = p < 0.5 ? 16 * p * p * p * p * p : 1 - Math.pow(-2 * p + 2, 5) / 2;

      // Arc interpolation: add slight altitude bump during flight
      const currentPos = new THREE.Vector3().lerpVectors(s.startPos, s.pos, ease);
      const arcHeight = Math.sin(p * Math.PI) * 2.5;
      currentPos.y += arcHeight;

      camera.position.copy(currentPos);

      const currentLook = new THREE.Vector3().lerpVectors(s.startLook, s.look, ease);
      camera.lookAt(currentLook);
    }
  });

  return null;
}
