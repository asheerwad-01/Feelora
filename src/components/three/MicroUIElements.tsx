'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Micro UI Background Elements
// Renders faint procedural sci-fi HUD elements floating behind
// the card sphere (r=8.5).
// ─────────────────────────────────────────────────────────────

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioStore } from '@/store/useAudioStore';

// Procedural texture generators
let crosshairTex: THREE.CanvasTexture | null = null;
function getCrosshairTexture(): THREE.CanvasTexture {
  if (crosshairTex) return crosshairTex;
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d')!;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1.5;

  // Draw crosshair lines
  ctx.beginPath();
  ctx.moveTo(8, 32); ctx.lineTo(22, 32);
  ctx.moveTo(42, 32); ctx.lineTo(56, 32);
  ctx.moveTo(32, 8);  ctx.lineTo(32, 22);
  ctx.moveTo(32, 42); ctx.lineTo(32, 56);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(32, 32, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();

  crosshairTex = new THREE.CanvasTexture(cv);
  return crosshairTex;
}

let plusTex: THREE.CanvasTexture | null = null;
function getPlusTexture(): THREE.CanvasTexture {
  if (plusTex) return plusTex;
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d')!;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;

  // Simple clean plus symbol
  ctx.beginPath();
  ctx.moveTo(20, 32); ctx.lineTo(44, 32);
  ctx.moveTo(32, 20); ctx.lineTo(32, 44);
  ctx.stroke();

  plusTex = new THREE.CanvasTexture(cv);
  return plusTex;
}

let ringTex: THREE.CanvasTexture | null = null;
function getRingTexture(): THREE.CanvasTexture {
  if (ringTex) return ringTex;
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d')!;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);

  // Dotted/dashed circle
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.stroke();

  ringTex = new THREE.CanvasTexture(cv);
  return ringTex;
}

interface ElementData {
  id: number;
  type: 'crosshair' | 'plus' | 'ring' | 'square';
  position: THREE.Vector3;
  scale: number;
  color: THREE.Color;
  speed: number;
}

export function MicroUIElements() {
  const groupRef = useRef<THREE.Group>(null);
  const elementsRef = useRef<THREE.Mesh[]>([]);
  const energy = useAudioStore((s) => s.energy);

  const elements = useMemo(() => {
    const arr: ElementData[] = [];
    const count = 120;
    const radius = 8.5; // Just behind the song cards (r=7.0)

    const colors = [
      new THREE.Color('#0A84FF'), // Electric Blue
      new THREE.Color('#30D158'), // Bright Green
      new THREE.Color('#BF5AF2'), // Purple
      new THREE.Color('#ffffff'), // Clean White
      new THREE.Color('#5E5CE6'), // Indigo
    ];

    const types: ElementData['type'][] = ['crosshair', 'plus', 'ring', 'square'];

    for (let i = 0; i < count; i++) {
      // Uniform spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = -radius * Math.sin(phi) * Math.cos(theta);

      arr.push({
        id: i,
        type: types[i % types.length],
        position: new THREE.Vector3(x, y, z),
        scale: 0.12 + Math.random() * 0.18, // micro scale
        color: colors[i % colors.length],
        speed: 0.05 + Math.random() * 0.1,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Faint drift rotation of the entire field
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.015;
      groupRef.current.rotation.x = Math.sin(time * 0.008) * 0.01;
    }

    // 2. Audio-reactive scale and opacity pulsing
    const meshes = elementsRef.current;
    const len = meshes.length;
    const pulseFactor = 1.0 + energy * 0.35; // pulses visibly on heavy bass/energy

    for (let i = 0; i < len; i++) {
      const mesh = meshes[i];
      if (!mesh) continue;

      // Base rotation wobble
      mesh.rotation.z += 0.003;

      // Pulse scaling with energy
      const defaultScale = mesh.userData.defaultScale;
      mesh.scale.set(defaultScale * pulseFactor, defaultScale * pulseFactor, 1);

      // Pulse opacity with energy
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const baseOpacity = mesh.userData.baseOpacity;
      mat.opacity = baseOpacity + energy * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      {elements.map((el, index) => {
        let texture: THREE.Texture | null = null;
        let scaleMultiplier = 1.0;

        if (el.type === 'crosshair') {
          texture = getCrosshairTexture();
        } else if (el.type === 'plus') {
          texture = getPlusTexture();
        } else if (el.type === 'ring') {
          texture = getRingTexture();
          scaleMultiplier = 1.6; // rings can look a bit larger
        }

        const isSquare = el.type === 'square';
        const finalScale = el.scale * scaleMultiplier;

        // Faint initial opacity so they blend elegantly in the background
        const baseOpacity = isSquare ? 0.06 : 0.15;

        return (
          <mesh
            key={el.id}
            ref={(node) => {
              if (node) elementsRef.current[index] = node;
            }}
            position={el.position}
            userData={{ defaultScale: finalScale, baseOpacity }}
            onBeforeRender={(renderer, scene, cameraInst) => {
              // Ensure elements always face the origin/camera
              elementsRef.current[index]?.lookAt(0, 0, 0);
            }}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={texture}
              color={el.color}
              transparent
              opacity={baseOpacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
