'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Sphere Universe
// Renders all songs as individual thin 3D card boxes tightly packed on
// a sphere surface. Reacts to lighting dynamically as it floats.
// ─────────────────────────────────────────────────────────────

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useAppStore } from '@/store/useAppStore';
import { useAudioStore } from '@/store/useAudioStore';
import type { SpatialTrack } from '@/types';
import { MicroUIElements } from './MicroUIElements';

// Sphere config
const SPHERE_RADIUS = 7.0;
const ROWS = 22;
const CARDS_PER_ROW = 46;
const TARGET_COUNT = ROWS * CARDS_PER_ROW; // 1012

// Polar angle limits — avoid extreme poles
const V_MIN = Math.PI * 0.12;
const V_MAX = Math.PI * 0.88;

// ─── Fallback texture generator ───

function createFallbackTexture(
  title: string,
  artist: string,
  bgColor: string,
  provider?: string
): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 384;
  const ctx = cv.getContext('2d')!;

  // Dark base
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, 512, 384);

  // Very subtle accent tint gradient
  const grad = ctx.createRadialGradient(256, 192, 20, 256, 192, 300);
  grad.addColorStop(0, bgColor + '28'); // ~15% opacity
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 512; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 384); ctx.stroke();
  }
  for (let j = 0; j < 384; j += 64) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(512, j); ctx.stroke();
  }

  // Title
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = "bold 26px 'Inter Tight', Inter, sans-serif";
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const displayTitle = title.length > 24 ? title.slice(0, 22) + '…' : title;
  ctx.fillText(displayTitle, 256, 160);

  // Artist
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = "500 14px 'JetBrains Mono', monospace";
  const displayArtist = artist.length > 20 ? artist.slice(0, 18) + '…' : artist;
  ctx.fillText(displayArtist.toUpperCase(), 256, 210);

  // Subtle dot accent colored by provider
  ctx.beginPath();
  ctx.arc(256, 250, 4, 0, Math.PI * 2);
  let dotColor = bgColor;
  if (provider === 'spotify') dotColor = '#1DB954';
  ctx.fillStyle = dotColor + 'aa';
  ctx.fill();

  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── Main Sphere Universe Component ───

export function SphereUniverse() {
  const {
    allSongs,
    currentTrack,
    focusedSong,
    setFocusedSong,
    setCameraTarget,
    searchQuery,
    searchResults,
    sphereSource,
  } = useAppStore();

  const bass = useAudioStore((s) => s.bass);
  const energy = useAudioStore((s) => s.energy);
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const cardsGroupRef = useRef<THREE.Group>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const pointerStart = useRef({ x: 0, y: 0 }); // Track start of pointer click/drag
  const textureLoader = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    return loader;
  }, []);

  // Filter songs based on active sphereSource selection
  const filteredSongs = useMemo(() => {
    if (sphereSource === 'all') return allSongs;
    if (sphereSource === 'liked') {
      return allSongs.filter((s) => s.sources ? s.sources.includes('Liked Songs') : s.source === 'Liked Songs');
    }
    return allSongs.filter((s) => s.sources ? s.sources.includes(sphereSource) : s.source === sphereSource);
  }, [allSongs, sphereSource]);

  // Reset focus when sphere source changes
  useEffect(() => {
    setFocusedSong(null);
    setCameraTarget(null);
  }, [sphereSource, setFocusedSong, setCameraTarget]);

  // Clean up cursor style on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  // Build the card meshes when songs change
  useEffect(() => {
    if (!cardsGroupRef.current) return;

    const cardsGroup = cardsGroupRef.current;

    // Clear previous meshes
    while (cardsGroup.children.length > 0) {
      const child = cardsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      
      // Dispose materials array
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        } else {
          const mat = child.material as any;
          if (mat.map) mat.map.dispose();
          mat.dispose();
        }
      }
      cardsGroup.remove(child);
    }
    meshesRef.current = [];
    hoveredMeshRef.current = null;

    if (filteredSongs.length === 0) return;

    console.log('[SphereUniverse] Building', filteredSongs.length, '3D card meshes');

    // Replicate tracks to fill the sphere if needed (like reference)
    const denseTracks: SpatialTrack[] = [];
    while (denseTracks.length < TARGET_COUNT) {
      filteredSongs.forEach((track) => {
        if (denseTracks.length < TARGET_COUNT) {
          denseTracks.push({
            ...track,
            id: denseTracks.length < filteredSongs.length 
              ? track.id 
              : `${track.id}_v_${denseTracks.length}`,
            index: denseTracks.length,
          });
        }
      });
    }

    const cardMeshes: THREE.Mesh[] = [];

    denseTracks.forEach((track, index) => {
      const row = Math.floor(index / CARDS_PER_ROW);
      const col = index % CARDS_PER_ROW;

      // Azimuthal angle: full 360°
      const phi = (col / CARDS_PER_ROW) * Math.PI * 2;

      // Polar angle: distribute vertically
      const theta = V_MIN + (row / (ROWS - 1)) * (V_MAX - V_MIN);

      // Spherical → Cartesian (Y-up)
      const x = SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi);
      const y = SPHERE_RADIUS * Math.cos(theta);
      const z = -SPHERE_RADIUS * Math.sin(theta) * Math.cos(phi);

      // Calculate seamless width for this latitude
      const latCircumference = 2 * Math.PI * SPHERE_RADIUS * Math.sin(theta);
      const exactCellWidth = latCircumference / CARDS_PER_ROW;
      // Spacing (gaps) factor of 0.82 leaves clean margins
      const itemWidth = Math.max(0.15, exactCellWidth * 0.82);

      // Calculate seamless height
      const sphereSpanHeight = SPHERE_RADIUS * (V_MAX - V_MIN);
      const exactCellHeight = sphereSpanHeight / (ROWS - 1);
      const itemHeight = exactCellHeight * 0.82;

      // Create a thin 3D box geometry instead of a flat plane (thickness = 0.02)
      const geometry = new THREE.BoxGeometry(itemWidth, itemHeight, 0.02);

      // Create fallback cover texture
      const fallbackTexture = createFallbackTexture(
        track.title,
        track.artist,
        track.accentColor,
        track.provider
      );

      // Materials for the box: index 4 is the front face (+Z), other faces are dark composite backing
      const backMaterial = new THREE.MeshStandardMaterial({
        color: 0x16161a,
        roughness: 0.5,
        metalness: 0.25,
      });

      const frontMaterial = new THREE.MeshBasicMaterial({
        map: fallbackTexture,
        toneMapped: true,
        transparent: false,
      });

      const materials = [
        backMaterial, // Right (+X)
        backMaterial, // Left (-X)
        backMaterial, // Top (+Y)
        backMaterial, // Bottom (-Y)
        frontMaterial, // Front (+Z) — Shows the cover art
        backMaterial, // Back (-Z)
      ];

      // Load real cover if available
      if (track.coverUrl) {
        try {
          textureLoader.load(
            track.coverUrl,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              frontMaterial.map = tex;
              frontMaterial.needsUpdate = true;
            },
            undefined,
            () => {
              // Failed — keep fallback
            }
          );
        } catch {
          // Keep fallback
        }
      }

      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.set(x, y, z);

      // Face inward toward camera at origin
      mesh.lookAt(0, 0, 0);

      mesh.userData = {
        track,
        index,
        basePosition: new THREE.Vector3(x, y, z),
        baseRotation: mesh.rotation.clone(),
        normal: new THREE.Vector3(x, y, z).clone().normalize(),
      };

      // Create a slightly larger back-plane outline glow that appears on hover
      const glowGeo = new THREE.PlaneGeometry(itemWidth * 1.08, itemHeight * 1.08);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(track.accentColor).multiplyScalar(1.6),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(0, 0, -0.015); // Place slightly behind the card front
      glowMesh.name = 'hoverGlow';
      mesh.add(glowMesh);
      
      cardsGroup.add(mesh);
      cardMeshes.push(mesh);
    });

    meshesRef.current = cardMeshes;
    console.log('[SphereUniverse] Built', cardMeshes.length, '3D card meshes. Radius:', SPHERE_RADIUS);
  }, [filteredSongs, textureLoader]);

  // Frame animation loop for floating, wobble, and smooth hover/audio reactive scaling
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const meshes = meshesRef.current;
    const len = meshes.length;

    for (let i = 0; i < len; i++) {
      const mesh = meshes[i];
      const { basePosition, baseRotation, normal, index } = mesh.userData;
      if (!basePosition) continue;

      // 1. Floating translation (slightly faster, dynamic drift)
      const phase = index * 0.15;
      const speed = 0.65;
      
      const rOffset = Math.sin(time * speed + phase) * 0.075;
      const yOffset = Math.cos(time * 0.75 * speed + phase * 1.3) * 0.06;
      const xOffset = Math.sin(time * 0.55 * speed + phase * 0.8) * 0.05;

      mesh.position.copy(basePosition).addScaledVector(normal, rOffset);
      mesh.position.y += yOffset;
      mesh.position.x += xOffset;

      // 2. Wobble rotation (organic tilt angles displaying 3D depth)
      const wobbleX = Math.sin(time * 0.25 * speed + phase * 1.1) * 0.025;
      const wobbleY = Math.cos(time * 0.2 * speed + phase * 0.7) * 0.025;
      const wobbleZ = Math.sin(time * 0.15 * speed + phase * 1.5) * 0.015;

      mesh.rotation.x = baseRotation.x + wobbleX;
      mesh.rotation.y = baseRotation.y + wobbleY;
      mesh.rotation.z = baseRotation.z + wobbleZ;

      // 3. Smooth hover scale (no audio reactive pulsing)
      const isHovered = hoveredMeshRef.current === mesh;
      const finalScaleTarget = isHovered ? 1.22 : 1.0;

      mesh.scale.x = THREE.MathUtils.lerp(mesh.scale.x, finalScaleTarget, 0.1);
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, finalScaleTarget, 0.1);
      mesh.scale.z = THREE.MathUtils.lerp(mesh.scale.z, finalScaleTarget, 0.1);

      // 4. Accent glow outline hover lerp
      const glowMesh = mesh.getObjectByName('hoverGlow') as THREE.Mesh;
      if (glowMesh) {
        const glowMat = glowMesh.material as THREE.MeshBasicMaterial;
        const targetOpacity = isHovered ? 0.95 : 0.0;
        glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, targetOpacity, 0.15);
      }
    }
  });

  // Handle click on cards via raycasting
  const handlePointerDown = (e: any) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!e.object?.userData?.track) return;

    // Calculate distance between pointer down and click to ignore drags
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If moved more than 6 pixels, treat it as drag rotation, not card selection
    if (dist > 6) return;

    const track = e.object.userData.track as SpatialTrack;
    const mesh = e.object as THREE.Mesh;

    // Get world position of clicked card
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    setFocusedSong(track);
    setCameraTarget([worldPos.x, worldPos.y, worldPos.z]);
  };

  // Hover handlers for smooth cursor indicator and hover tracking
  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const intersected = e.object as THREE.Mesh;
    if (intersected && intersected.userData && intersected.userData.track) {
      if (hoveredMeshRef.current !== intersected) {
        hoveredMeshRef.current = intersected;
        document.body.style.cursor = 'pointer';
      }
    } else {
      clearHover();
    }
  };

  const handlePointerOut = (e: any) => {
    clearHover();
  };

  const clearHover = () => {
    if (hoveredMeshRef.current) {
      document.body.style.cursor = 'default';
      hoveredMeshRef.current = null;
    }
  };

  if (filteredSongs.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* Background Micro UI Elements (r=8.5) */}
      <MicroUIElements />

      <group
        ref={cardsGroupRef}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      />
    </group>
  );
}
