'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Micro UI Background Elements
// Renders procedural sci-fi HUD elements and floating dust particles
// to create a fully immersive, volumetric 3D space.
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

  ctx.beginPath();
  ctx.moveTo(8, 32); ctx.lineTo(22, 32);
  ctx.moveTo(42, 32); ctx.lineTo(56, 32);
  ctx.moveTo(32, 8);  ctx.lineTo(32, 22);
  ctx.moveTo(32, 42); ctx.lineTo(32, 56);
  ctx.stroke();

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
  velocity: THREE.Vector3;
  rotationAxis: THREE.Vector3;
  rotationSpeed: number;
  scale: number;
  color: THREE.Color;
  baseOpacity: number;
}

const INNER_R = 4.0;
const OUTER_R = 14.0;

function DustField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1200;
  
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    const palette = [
      new THREE.Color('#0A84FF'), // Electric Blue
      new THREE.Color('#30D158'), // Bright Green
      new THREE.Color('#BF5AF2'), // Purple
      new THREE.Color('#ffffff'), // Clean White
      new THREE.Color('#5E5CE6'), // Indigo
    ];
    
    for(let i = 0; i < count; i++) {
      const r = INNER_R + Math.random() * (OUTER_R - INNER_R);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i*3] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+1] = r * Math.cos(phi);
      pos[i*3+2] = r * Math.sin(phi) * Math.cos(theta);

      // Micro drift velocity
      vel[i*3] = (Math.random() - 0.5) * 0.004;
      vel[i*3+1] = (Math.random() - 0.5) * 0.004;
      vel[i*3+2] = (Math.random() - 0.5) * 0.004;
      
      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = color.r;
      col[i*3+1] = color.g;
      col[i*3+2] = color.b;
    }
    return [pos, vel, col];
  }, []);

  const energy = useAudioStore((s) => s.energy);

  useFrame(() => {
    if(!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    
    const speedMult = 1.0 + energy * 2.5;

    for(let i = 0; i < count; i++) {
       posAttr.array[i*3] += velocities[i*3] * speedMult;
       posAttr.array[i*3+1] += velocities[i*3+1] * speedMult;
       posAttr.array[i*3+2] += velocities[i*3+2] * speedMult;

       const x = posAttr.array[i*3];
       const y = posAttr.array[i*3+1];
       const z = posAttr.array[i*3+2];
       const dist = Math.sqrt(x*x + y*y + z*z);
       
       // Spherical bounds reflection (bounce)
       if (dist > OUTER_R || dist < INNER_R) {
          const nx = x / dist;
          const ny = y / dist;
          const nz = z / dist;
          
          const dot = velocities[i*3]*nx + velocities[i*3+1]*ny + velocities[i*3+2]*nz;
          velocities[i*3] -= 2 * dot * nx;
          velocities[i*3+1] -= 2 * dot * ny;
          velocities[i*3+2] -= 2 * dot * nz;
          
          posAttr.array[i*3] += velocities[i*3] * speedMult;
          posAttr.array[i*3+1] += velocities[i*3+1] * speedMult;
          posAttr.array[i*3+2] += velocities[i*3+2] * speedMult;
       }
    }
    posAttr.needsUpdate = true;
    
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.2 + energy * 0.4;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.06} 
        vertexColors 
        transparent 
        opacity={0.3} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
        sizeAttenuation={true}
      />
    </points>
  );
}

export function MicroUIElements() {
  const elementsRef = useRef<THREE.Mesh[]>([]);
  const energy = useAudioStore((s) => s.energy);

  const elementsData = useMemo(() => {
    const arr: ElementData[] = [];
    const count = 180; // Denser volume

    const colors = [
      new THREE.Color('#0A84FF'),
      new THREE.Color('#30D158'),
      new THREE.Color('#BF5AF2'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#5E5CE6'),
    ];

    const types: ElementData['type'][] = ['crosshair', 'plus', 'ring', 'square'];

    for (let i = 0; i < count; i++) {
      const r = INNER_R + Math.random() * (OUTER_R - INNER_R);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.cos(theta);
      
      const type = types[i % types.length];
      const isSquare = type === 'square';
      const baseOpacity = isSquare ? 0.05 : 0.12;

      arr.push({
        id: i,
        type,
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012
        ),
        rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        scale: 0.08 + Math.random() * 0.15,
        color: colors[i % colors.length],
        baseOpacity,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const meshes = elementsRef.current;
    const len = meshes.length;
    
    const pulseFactor = 1.0 + energy * 0.4;
    const speedMult = 1.0 + energy * 1.5;

    for (let i = 0; i < len; i++) {
      const mesh = meshes[i];
      if (!mesh) continue;

      const data = elementsData[i];

      data.position.x += data.velocity.x * speedMult;
      data.position.y += data.velocity.y * speedMult;
      data.position.z += data.velocity.z * speedMult;

      const dist = data.position.length();
      
      // Spherical bounds reflection
      if (dist > OUTER_R || dist < INNER_R) {
         const n = data.position.clone().normalize();
         const dot = data.velocity.dot(n);
         data.velocity.sub(n.multiplyScalar(2 * dot));
         data.position.add(data.velocity.clone().multiplyScalar(speedMult));
      }

      mesh.position.copy(data.position);
      
      // HUD elements always face origin to read nicely, but slowly spin on Z
      if (data.type === 'square') {
         mesh.rotateOnAxis(data.rotationAxis, data.rotationSpeed);
      } else {
         mesh.lookAt(0, 0, 0);
         mesh.rotateZ(state.clock.getElapsedTime() * data.rotationSpeed);
      }

      const finalScale = data.scale * pulseFactor * (data.type === 'ring' ? 1.6 : 1.0);
      mesh.scale.set(finalScale, finalScale, 1);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = data.baseOpacity + energy * 0.18;
    }
  });

  return (
    <group>
      <DustField />
      
      {elementsData.map((el, index) => {
        let texture: THREE.Texture | null = null;
        if (el.type === 'crosshair') texture = getCrosshairTexture();
        else if (el.type === 'plus') texture = getPlusTexture();
        else if (el.type === 'ring') texture = getRingTexture();

        return (
          <mesh
            key={el.id}
            ref={(node) => {
              if (node) elementsRef.current[index] = node;
            }}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={texture}
              color={el.color}
              transparent
              opacity={el.baseOpacity}
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
