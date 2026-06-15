'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Main Three.js Canvas Wrapper
// Clean dark immersive background — no distracting color overlays
// ─────────────────────────────────────────────────────────────

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { useAppStore } from '@/store/useAppStore';
import { SphereUniverse } from './SphereUniverse';
import { CameraRig } from './CameraRig';
import { EnvironmentEffects } from './EnvironmentEffects';

export function SphereCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bloomIntensity = useAppStore((state) => state.bloomIntensity);

  return (
    <div className="canvas-container">
      <Canvas
        ref={canvasRef}
        camera={{
          fov: 60,
          near: 0.1,
          far: 100,
          position: [0, 0, 0],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
        style={{ background: '#000000' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <Suspense fallback={null}>
          {/* Environment: fog + lighting */}
          <EnvironmentEffects />

          {/* The main song sphere universe */}
          <SphereUniverse />

          {/* Camera controller (GSAP-driven) */}
          <CameraRig />

          {/* Post-processing pipeline */}
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={bloomIntensity}
              luminanceThreshold={0.3}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette
              offset={0.3}
              darkness={0.7}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
