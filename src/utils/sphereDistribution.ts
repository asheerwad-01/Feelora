// ─────────────────────────────────────────────────────────────
// Feelora 2 — Sphere Distribution Algorithm
// Dense grid packing on a sphere surface, row-wise concentric rings
// ─────────────────────────────────────────────────────────────

import type { Track, SpatialTrack } from '@/types';

/**
 * Distribute N cards on a sphere in horizontal concentric row rings.
 */
export function getConcentricRowPositions(
  n: number,
  radius: number
): { x: number; y: number; z: number; theta: number; phi: number }[] {
  if (n === 0) return [];

  // Determine row count (M) using dynamic factor
  const M = Math.max(1, Math.round(0.88 * Math.sqrt(n)));

  const rows: { theta: number; count: number }[] = [];
  let totalWeight = 0;

  for (let i = 0; i < M; i++) {
    // Spacing rows evenly across the entire range (0, PI) to cover poles
    const theta = Math.PI * (i + 0.5) / M;
    const weight = Math.sin(theta);
    totalWeight += weight;
    rows.push({ theta, count: 0 });
  }

  // Distribute n cards across rows proportionally to sin(theta) to keep packing density constant
  let remaining = n;
  const rowCounts = rows.map((row) => {
    const exact = (Math.sin(row.theta) / totalWeight) * n;
    const count = Math.max(2, Math.floor(exact)); // Enforce at least 2 cards per row
    remaining -= count;
    return count;
  });

  // Handle over-allocation
  if (remaining < 0) {
    const entries = rowCounts
      .map((count, idx) => ({ idx, count, exact: (Math.sin(rows[idx].theta) / totalWeight) * n }))
      .filter((e) => e.count > 2);
    entries.sort((a, b) => a.exact - b.exact);
    let toSubtract = -remaining;
    for (let i = 0; i < toSubtract && i < entries.length; i++) {
      rowCounts[entries[i].idx]--;
      remaining++;
    }
  }

  // Handle under-allocation
  if (remaining > 0) {
    const fracParts = rows.map((row, idx) => ({
      idx,
      frac: (Math.sin(row.theta) / totalWeight) * n - rowCounts[idx],
    }));
    fracParts.sort((a, b) => b.frac - a.frac);
    for (let r = 0; r < remaining; r++) {
      rowCounts[fracParts[r % fracParts.length].idx]++;
    }
  }

  for (let i = 0; i < M; i++) {
    rows[i].count = rowCounts[i];
  }

  // Generate 3D coordinates
  const positions: { x: number; y: number; z: number; theta: number; phi: number }[] = [];

  for (let i = 0; i < M; i++) {
    const { theta, count } = rows[i];
    for (let j = 0; j < count; j++) {
      // phi spaced evenly around the circular ring (perfect horizontal row, aligned at phi=0)
      const phi = (2 * Math.PI * j) / count;

      const yVal = Math.cos(theta);
      const rAtY = Math.sin(theta);

      // Coordinate mapping to match R3F/CameraRig conventions
      const x = radius * rAtY * Math.sin(phi);
      const y = radius * yVal;
      const z = -radius * rAtY * Math.cos(phi);

      positions.push({ x, y, z, theta, phi });
    }
  }

  return positions;
}

/**
 * Distribute tracks in a dense Concentric Row pattern.
 * Camera is at origin looking outward, so cards face inward toward (0,0,0).
 */
export function distributeTracks(
  tracks: Track[],
  radius: number = 7.5, // Default radius for inside-out viewing
  source: string = 'liked'
): SpatialTrack[] {
  const n = tracks.length;
  if (n === 0) return [];

  const positions = getConcentricRowPositions(n, radius);

  return tracks.map((track, index) => {
    const pos = positions[index] || { x: 0, y: 0, z: 0, theta: 0, phi: 0 };
    return {
      ...track,
      position: [pos.x, pos.y, pos.z] as [number, number, number],
      theta: pos.theta,
      phi: pos.phi,
      radius,
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
 * deduplicating by track ID, and distribute them on Concentric Rows.
 */
export function mergeAndDistribute(
  sources: { tracks: Track[]; source: string }[],
  radius: number = 7.5
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

  const positions = getConcentricRowPositions(n, radius);

  return uniqueTracks.map((track, index) => {
    const pos = positions[index] || { x: 0, y: 0, z: 0, theta: 0, phi: 0 };
    const trackSources = seen.get(track.id) || [];

    return {
      ...track,
      position: [pos.x, pos.y, pos.z] as [number, number, number],
      theta: pos.theta,
      phi: pos.phi,
      radius,
      glowColor: track.accentColor,
      scale: 1.0,
      index,
      source: trackSources[0] || '',
      sources: trackSources,
    };
  });
}

