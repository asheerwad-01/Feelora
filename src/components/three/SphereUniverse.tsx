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
import { getConcentricRowPositions } from '@/utils/sphereDistribution';
import { useAudioStore } from '@/store/useAudioStore';
import type { SpatialTrack } from '@/types';
import { MicroUIElements } from './MicroUIElements';

// Sphere config
const SPHERE_RADIUS = 7.5;
const ROWS = 22;
const CARDS_PER_ROW = 46;
const TARGET_COUNT = ROWS * CARDS_PER_ROW; // 1012

// Polar angle limits — avoid extreme poles
const V_MIN = Math.PI * 0.12;
const V_MAX = Math.PI * 0.88;

// Reusable scratch objects for zero-allocation math in frame loop
const _tempEuler = new THREE.Euler();
const _tempQuat = new THREE.Quaternion();

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
    activeCategory,
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

  // Filter songs based on active sphereSource selection AND activeCategory
  const filteredSongs = useMemo(() => {
    let list = allSongs;
    if (sphereSource === 'liked') {
      list = allSongs.filter((s) => s.sources ? s.sources.includes('Liked Songs') : s.source === 'Liked Songs');
    } else if (sphereSource !== 'all') {
      list = allSongs.filter((s) => s.sources ? s.sources.includes(sphereSource) : s.source === sphereSource);
    }

    if (activeCategory) {
      const cat = activeCategory.toLowerCase();
      const mappings: Record<string, string[]> = {
        soothing: ['soothing', 'calm', 'relax', 'acoustic', 'sleep', 'ambient', 'peace', 'soft', 'gentle'],
        pop: ['pop', 'hits', 'chart', 'dance', 'party'],
        gaming: ['gaming', 'ost', 'nintendo', 'game', 'cyber', 'synth', 'electronic', 'beat'],
        fast: ['fast', 'speed', 'hyper', 'run', 'workout', 'beat', 'up-tempo', 'rock', 'metal', 'edm'],
        moody: ['moody', 'dark', 'sad', 'night', 'rain', 'cry', 'deep', 'blues', 'ghost', 'shadow'],
        orchestral: ['orchestra', 'symph', 'classical', 'piano', 'violin', 'cello', 'instrumental'],
        peaceful: ['peaceful', 'calm', 'zen', 'meditation', 'soft', 'pure', 'nature'],
        dance: ['dance', 'club', 'edm', 'house', 'techno', 'beat', 'party', 'electronic'],
        chill: ['chill', 'lofi', 'lo-fi', 'relax', 'lounge', 'breeze', 'wave', 'study'],
        romantic: ['love', 'romantic', 'heart', 'valentine', 'together', 'kiss', 'sweet', 'romance'],
        nostalgia: ['nostalgia', 'old', 'retro', 'classic', 'memory', '80s', '90s', 'vintage'],
        anime: ['anime', 'j-pop', 'vocaloid', 'japan', 'otaku', 'ost', 'jpop'],
        relaxing: ['relax', 'chill', 'breeze', 'soft', 'meditation', 'wave', 'calm'],
        slow: ['slow', 'acoustic', 'soft', 'gentle', 'sleep', 'ballade'],
        quiet: ['quiet', 'silent', 'whispers', 'soft', 'low', 'peaceful'],
      };

      const keywords = mappings[cat] || [cat];
      list = list.filter((s) => {
        const title = (s.title || '').toLowerCase();
        const artist = (s.artist || '').toLowerCase();
        const album = (s.album || '').toLowerCase();
        return keywords.some(
          (kw) => title.includes(kw) || artist.includes(kw) || album.includes(kw)
        );
      });
    }

    return list;
  }, [allSongs, sphereSource, activeCategory]);

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

    // Replicate tracks to fill the sphere if needed (minimum 450, no maximum limit)
    const TARGET_MIN_COUNT = 450;
    const denseTracks: SpatialTrack[] = [];
    if (filteredSongs.length >= TARGET_MIN_COUNT) {
      filteredSongs.forEach((track, index) => {
        denseTracks.push({
          ...track,
          index,
        });
      });
    } else {
      while (denseTracks.length < TARGET_MIN_COUNT) {
        filteredSongs.forEach((track) => {
          if (denseTracks.length < TARGET_MIN_COUNT) {
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
    }

    const cardMeshes: THREE.Mesh[] = [];
    const positions = getConcentricRowPositions(denseTracks.length, SPHERE_RADIUS);

    // Group positions by theta to find the card count in each row ring
    const rowCountsMap = new Map<number, number>();
    positions.forEach((p) => {
      rowCountsMap.set(p.theta, (rowCountsMap.get(p.theta) || 0) + 1);
    });

    // Find the minimum horizontal center-to-center spacing among all rows containing >= 2 cards
    let minHorizontalSpacing = Infinity;
    rowCountsMap.forEach((count, theta) => {
      if (count >= 2) {
        const rowSpacing = (2 * Math.PI * SPHERE_RADIUS * Math.sin(theta)) / count;
        if (rowSpacing < minHorizontalSpacing) {
          minHorizontalSpacing = rowSpacing;
        }
      }
    });

    // Compute dynamic, uniform card size to ensure there is always a visible gap horizontally and vertically
    // We scale the card size to 88% of the minimum horizontal spacing, capped at a maximum of 0.88
    const dynamicCardSize = minHorizontalSpacing === Infinity
      ? 0.88
      : Math.min(0.88, minHorizontalSpacing * 0.88);

    denseTracks.forEach((track, index) => {
      const pos = positions[index] || { x: 0, y: 0, z: 0, theta: 0, phi: 0 };
      const { x, y, z, theta, phi } = pos;

      // Store phi/theta coordinates on track object for CameraRig interpolation
      track.phi = phi;
      track.theta = theta;

      const itemWidth = dynamicCardSize;
      const itemHeight = dynamicCardSize;

      // Create a thin 3D box geometry instead of a flat plane (thickness = 0.02)
      const geometry = new THREE.BoxGeometry(itemWidth, itemHeight, 0.02);

      // Create fallback cover texture
      const fallbackTexture = createFallbackTexture(
        track.title,
        track.artist,
        track.accentColor,
        track.provider
      );

      const backMaterial = new THREE.MeshPhongMaterial({
        color: 0x16161a,
        shininess: 15,
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

      const normalVec = new THREE.Vector3(x, y, z).normalize();

      // If the card is at the poles, lookAt orientation can have a singularity with default up vector (0,1,0)
      // We set the up vector to (0, 0, 1) to resolve the lookAt singularity
      if (Math.abs(normalVec.y) > 0.96) {
        mesh.up.set(0, 0, 1);
      }

      // Face inward toward camera at origin
      mesh.lookAt(0, 0, 0);

      mesh.userData = {
        track,
        index,
        basePosition: new THREE.Vector3(x, y, z),
        baseRotation: mesh.rotation.clone(),
        baseQuaternion: mesh.quaternion.clone(),
        normal: normalVec,
        right: new THREE.Vector3(1, 0, 0).applyEuler(mesh.rotation),
        up: new THREE.Vector3(0, 1, 0).applyEuler(mesh.rotation),
        itemWidth,
        itemHeight,
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
  // Track the current pop-up offset per mesh for smooth lerp
  const popUpOffsetsRef = useRef<Float32Array>(new Float32Array(0));

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const meshes = meshesRef.current;
    const len = meshes.length;

    // Ensure popUp offsets array matches mesh count
    if (popUpOffsetsRef.current.length !== len) {
      popUpOffsetsRef.current = new Float32Array(len);
    }

    const currentTrackId = currentTrack?.id ?? null;

    for (let i = 0; i < len; i++) {
      const mesh = meshes[i];
      const { basePosition, baseQuaternion, normal, right, up, index, track } = mesh.userData;
      if (!basePosition) continue;

      // 1. Floating translation (subtle radial bobbing)
      const phase = index * 0.12;
      const speed = 0.35; // Slow, elegant breathing
      const rOffset = Math.sin(time * speed + phase) * 0.12;

      // 2. Pop-up effect for the currently playing / hovered song
      const isPlaying = track && currentTrackId && track.id === currentTrackId;
      const isHovered = hoveredMeshRef.current === mesh;
      const targetPopUp = isPlaying ? -0.5 : isHovered ? -0.22 : 0;
      if (Math.abs(popUpOffsetsRef.current[i] - targetPopUp) > 0.005) {
        popUpOffsetsRef.current[i] = THREE.MathUtils.lerp(
          popUpOffsetsRef.current[i],
          targetPopUp,
          0.08
        );
      } else if (popUpOffsetsRef.current[i] !== targetPopUp) {
        popUpOffsetsRef.current[i] = targetPopUp;
      }

      // Subtle tangential drift
      const floatX = Math.sin(time * 0.25 + index) * 0.06;
      const floatY = Math.cos(time * 0.2 + index * 1.5) * 0.06;

      // Zero-allocation position update (1 sync)
      mesh.position.copy(basePosition)
        .addScaledVector(normal, rOffset + popUpOffsetsRef.current[i])
        .addScaledVector(right, floatX)
        .addScaledVector(up, floatY);

      // 3. Subtle floating rotation (micro-tilt)
      const rx = Math.sin(time * 0.4 + index) * 0.035;
      const ry = Math.cos(time * 0.3 + index * 1.2) * 0.035;
      const rz = Math.sin(time * 0.2 + index * 2.5) * 0.025;

      // Zero-allocation quaternion update (1 sync)
      _tempEuler.set(rx, ry, rz, 'XYZ');
      _tempQuat.setFromEuler(_tempEuler);
      mesh.quaternion.copy(baseQuaternion).multiply(_tempQuat);

      // 4. Smooth hover/playing scale (no audio reactive pulsing, optimized)
      const finalScaleTarget = isPlaying ? 1.25 : isHovered ? 1.38 : 1.0;

      if (Math.abs(mesh.scale.x - finalScaleTarget) > 0.005) {
        const val = THREE.MathUtils.lerp(mesh.scale.x, finalScaleTarget, 0.1);
        mesh.scale.set(val, val, val);
      } else if (mesh.scale.x !== finalScaleTarget) {
        mesh.scale.set(finalScaleTarget, finalScaleTarget, finalScaleTarget);
      }

      // 5. Accent glow outline hover/playing lerp (optimized)
      const glowMesh = mesh.getObjectByName('hoverGlow') as THREE.Mesh;
      if (glowMesh) {
        const glowMat = glowMesh.material as THREE.MeshBasicMaterial;
        const targetOpacity = isPlaying ? 0.85 : isHovered ? 0.95 : 0.0;
        if (Math.abs(glowMat.opacity - targetOpacity) > 0.005) {
          glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, targetOpacity, 0.15);
        } else if (glowMat.opacity !== targetOpacity) {
          glowMat.opacity = targetOpacity;
        }
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

    // Set focused song for playback — but do NOT rotate camera to prevent
    // the sphere from randomly spinning when tapping a card
    setFocusedSong(track);
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
    <group
      ref={groupRef}
      onPointerMissed={() => {
        setFocusedSong(null);
        setCameraTarget(null);
      }}
    >
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
