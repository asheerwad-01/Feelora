'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Sphere Universe
// Renders all songs as individual card meshes tightly packed on
// a sphere surface surrounding the viewer (planetarium style).
// Uses individual meshes (not instanced) for maximum reliability,
// following the exact approach from the reference SphericalGallery.
// ─────────────────────────────────────────────────────────────

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import { useAppStore } from '@/store/useAppStore';
import { useAudioStore } from '@/store/useAudioStore';
import type { SpatialTrack } from '@/types';

// Sphere config
const SPHERE_RADIUS = 7.0;
const ROWS = 22;
const CARDS_PER_ROW = 46;
const TARGET_COUNT = ROWS * CARDS_PER_ROW; // 1012

// Polar angle limits — avoid extreme poles
const V_MIN = Math.PI * 0.12;
const V_MAX = Math.PI * 0.88;

// ─── Fallback texture generator (matching reference) ───

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

  // Build the card meshes when songs change
  useEffect(() => {
    if (!cardsGroupRef.current) return;

    const cardsGroup = cardsGroupRef.current;

    // Clear previous meshes
    while (cardsGroup.children.length > 0) {
      const child = cardsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mat = child.material as THREE.MeshBasicMaterial;
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
      cardsGroup.remove(child);
    }
    meshesRef.current = [];

    if (filteredSongs.length === 0) return;

    console.log('[SphereUniverse] Building', filteredSongs.length, 'card meshes');

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
      const itemWidth = Math.max(0.15, exactCellWidth - 0.015);

      // Calculate seamless height
      const sphereSpanHeight = SPHERE_RADIUS * (V_MAX - V_MIN);
      const exactCellHeight = sphereSpanHeight / (ROWS - 1);
      const itemHeight = exactCellHeight - 0.015;

      // Create geometry for this card
      const geometry = new THREE.PlaneGeometry(itemWidth, itemHeight, 1, 1);

      // Create fallback texture
      const fallbackTexture = createFallbackTexture(
        track.title,
        track.artist,
        track.accentColor,
        track.provider
      );

      const material = new THREE.MeshBasicMaterial({
        map: fallbackTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
        toneMapped: true,
      });

      // Load real cover if available
      if (track.coverUrl) {
        try {
          textureLoader.load(
            track.coverUrl,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              material.map = tex;
              material.needsUpdate = true;
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

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);

      // Face inward toward camera at origin
      mesh.lookAt(0, 0, 0);

      mesh.userData = { track, index, defaultScale: 1 };
      cardsGroup.add(mesh);
      cardMeshes.push(mesh);
    });

    meshesRef.current = cardMeshes;
    console.log('[SphereUniverse] Built', cardMeshes.length, 'card meshes. Radius:', SPHERE_RADIUS);
  }, [filteredSongs, textureLoader]);



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

  if (filteredSongs.length === 0) return null;

  return (
    <group ref={groupRef}>
      <group
        ref={cardsGroupRef}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      />
    </group>
  );
}
