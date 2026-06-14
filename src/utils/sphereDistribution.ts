// ─────────────────────────────────────────────────────────────
// Feelora 2 — Sphere Distribution Algorithm
// Dense grid packing on a sphere surface, inspired by the
// reference SphericalGallery.tsx approach with tight card layout
// ─────────────────────────────────────────────────────────────

import type { Track, SpatialTrack } from '@/types';

/**
 * Distribute tracks in a dense grid pattern on a sphere surface.
 * Uses the reference approach: rows × columns with tight seamless packing.
 * Camera is at origin looking outward, so cards face inward toward (0,0,0).
 */
export function distributeTracks(
  tracks: Track[],
  radius: number = 7, // Default radius for inside-out viewing
  source: string = 'liked'
): SpatialTrack[] {
  const n = tracks.length;
  if (n === 0) return [];

  // Calculate a dense grid layout: rows × cardsPerRow ≥ n
  // Reference uses 8 rows × 18 cols = 144 for ~50 tracks
  // For 1000 tracks, we need more: ~25 rows × 40 cols = 1000
  const cardsPerRow = Math.ceil(Math.sqrt(n * 2.25)); // wider than tall
  const rows = Math.ceil(n / cardsPerRow);

  // The sphere radius — for inside-out viewing, this is the "wall" distance
  const r = radius;

  // Polar angle limits — avoid extreme poles to prevent distortion
  const vMin = Math.PI * 0.08;
  const vMax = Math.PI * 0.92;

  return tracks.map((track, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;

    // Azimuthal angle: wrap full 360° horizontally
    const phi = (col / cardsPerRow) * Math.PI * 2;

    // Polar angle: distribute vertically across the sphere
    const theta = rows > 1
      ? vMin + (row / (rows - 1)) * (vMax - vMin)
      : Math.PI / 2; // single row at equator

    // Spherical → Cartesian (Three.js convention: Y-up)
    const x = r * Math.sin(theta) * Math.sin(phi);
    const y = r * Math.cos(theta);
    const z = -r * Math.sin(theta) * Math.cos(phi);

    return {
      ...track,
      position: [x, y, z] as [number, number, number],
      theta,
      phi,
      radius: r,
      glowColor: track.accentColor,
      scale: 1.0,
      index,
      source,
      sources: [source],
    };
  });
}

/**
 * Merge multiple track sources into a unified sphere,
 * deduplicating by track ID.
 */
export function mergeAndDistribute(
  sources: { tracks: Track[]; source: string }[],
  radius: number = 7
): SpatialTrack[] {
  const seen = new Map<string, string[]>(); // Map track ID to list of sources
  const uniqueTracks: Track[] = [];

  for (const { tracks, source } of sources) {
    for (const track of tracks) {
      if (!seen.has(track.id)) {
        seen.set(track.id, [source]);
        uniqueTracks.push(track);
      } else {
        const existingSources = seen.get(track.id)!;
        if (!existingSources.includes(source)) {
          existingSources.push(source);
        }
      }
    }
  }

  const n = uniqueTracks.length;
  if (n === 0) return [];

  const cardsPerRow = Math.ceil(Math.sqrt(n * 2.25));
  const rows = Math.ceil(n / cardsPerRow);
  const r = radius;

  const vMin = Math.PI * 0.08;
  const vMax = Math.PI * 0.92;

  return uniqueTracks.map((track, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;

    const phi = (col / cardsPerRow) * Math.PI * 2;
    const theta = rows > 1
      ? vMin + (row / (rows - 1)) * (vMax - vMin)
      : Math.PI / 2;

    const x = r * Math.sin(theta) * Math.sin(phi);
    const y = r * Math.cos(theta);
    const z = -r * Math.sin(theta) * Math.cos(phi);

    const trackSources = seen.get(track.id) || [];

    return {
      ...track,
      position: [x, y, z] as [number, number, number],
      theta,
      phi,
      radius: r,
      glowColor: track.accentColor,
      scale: 1.0,
      index,
      source: trackSources[0] || '',
      sources: trackSources,
    };
  });
}
