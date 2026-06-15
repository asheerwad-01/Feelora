'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Environment Effects
// Fog, ambient lighting — tuned for inside-out sphere (r=7)
// ─────────────────────────────────────────────────────────────

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useAppStore } from '@/store/useAppStore';
import { useAudioStore } from '@/store/useAudioStore';

export function EnvironmentEffects() {
  const currentTrack = useAppStore((s) => s.currentTrack);
  const isFocusMode = useAppStore((s) => s.isFocusMode);
  const energy = useAudioStore((s) => s.energy);

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const accentColor = useRef(new THREE.Color('#101018'));

  // Update accent color and ambient background spheres
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (currentTrack?.accentColor) {
      accentColor.current.lerp(
        new THREE.Color(currentTrack.accentColor),
        0.02
      );
    }

    // Audio-reactive lighting (always clean white)
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 3.0 + energy * 4;
      pointLightRef.current.color.set('#ffffff');
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = isFocusMode ? 0.12 : 0.28 + energy * 0.12;
    }
  });

  return (
    <>
      {/* Subtle fog for depth — adjusted for r=7 sphere */}
      <fog attach="fog" args={['#040406', 5, 25]} />

      {/* Ambient fill light */}
      <ambientLight ref={ambientRef} intensity={0.28} color="#ffffff" />

      {/* Central point light — white/accent tinted */}
      <pointLight
        ref={pointLightRef}
        position={[0, 0, 0]}
        intensity={5.5}
        distance={20}
        decay={2}
        color="#ffffff"
      />
    </>
  );
}
