'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Ambient Particles
// Background star-dust / nebula particles filling the sphere
// Tuned for inside-out viewing (r=7 sphere)
// ─────────────────────────────────────────────────────────────

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useAudioStore } from '@/store/useAudioStore';

interface AmbientParticlesProps {
  count?: number;
}

export function AmbientParticles({ count = 3000 }: AmbientParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const energy = useAudioStore((s) => s.energy);

  // Generate particle positions inside the sphere
  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Random position within the sphere (radius 0.5 to 6)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 + Math.random() * 5.5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Size variation — subtle
      sizes[i] = 0.005 + Math.random() * 0.025;

      // Color: cool white/blue tones only for clean aesthetic
      const colorChoice = Math.random();
      if (colorChoice < 0.5) color.setHSL(0, 0, 0.6 + Math.random() * 0.4); // white
      else if (colorChoice < 0.8) color.setHSL(0.6, 0.3, 0.5); // subtle blue
      else color.setHSL(0.52, 0.2, 0.6); // subtle cyan

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, sizes, colors };
  }, [count]);

  // Gentle particle drift
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.005;
    meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.003) * 0.01;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}
