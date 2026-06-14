// ─────────────────────────────────────────────────────────────
// Feelora 2 — Lyrics Service (lrclib.net)
// Free synced lyrics fetching
// ─────────────────────────────────────────────────────────────

import type { LyricsData, LyricLine } from '@/types';

const LRCLIB_BASE = 'https://lrclib.net/api';

// In-memory cache
const cache = new Map<string, LyricsData>();

/**
 * Cleans track titles by stripping common suffixes and parentheticals like "Remastered", "Live", "feat.", etc.
 */
function cleanTrackTitle(title: string): string {
  return title
    .replace(/\s*-\s*.*?(remaster|live|radio|edit|mono|stereo|bonus|single|version|mix).*?$/gi, '')
    .replace(/\s*\[.*?(remaster|live|radio|edit|mono|stereo|bonus|single|version|mix).*?\]/gi, '')
    .replace(/\s*\(.*?(remaster|live|radio|edit|mono|stereo|bonus|single|version|mix).*?\)/gi, '')
    .replace(/\s*\(feat\..*?\)/gi, '')
    .replace(/\s*\[feat\..*?\]/gi, '')
    .replace(/\s*feat\..*?$/gi, '')
    .trim();
}

/**
 * Cleans artist names by extracting the primary artist and removing "feat." additions.
 */
function cleanArtistName(artist: string): string {
  return artist
    .split(',')[0]
    .split(';')[0]
    .replace(/\s*(feat|ft)\.?\s+.*$/i, '')
    .trim();
}

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/g;

  let match;
  while ((match = regex.exec(lrc)) !== null) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const ms = parseInt(match[3].padEnd(3, '0'), 10);
    const time = minutes * 60 + seconds + ms / 1000;
    const text = match[4].trim();
    if (text) {
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export async function fetchLyrics(
  title: string,
  artist: string,
  duration?: number
): Promise<LyricsData> {
  const cleanedTitle = cleanTrackTitle(title);
  const cleanedArtist = cleanArtistName(artist);
  const key = `${cleanedArtist}::${cleanedTitle}`.toLowerCase();

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  try {
    const params = new URLSearchParams({
      track_name: cleanedTitle,
      artist_name: cleanedArtist,
    });

    if (duration) {
      params.set('duration', String(duration));
    }

    const response = await fetch(`${LRCLIB_BASE}/get?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Lyrics not found: ${response.status}`);
    }

    const data = await response.json();

    // Prefer synced lyrics
    if (data.syncedLyrics) {
      const lines = parseLRC(data.syncedLyrics);
      const result: LyricsData = {
        synced: true,
        lines,
        source: 'lrclib.net',
      };
      cache.set(key, result);
      return result;
    }

    // Fallback to plain lyrics (distributed evenly over duration for scrolling sync)
    if (data.plainLyrics) {
      const rawLines = data.plainLyrics
        .split('\n')
        .filter((line: string) => line.trim());

      const lineCount = rawLines.length;
      // Distribute lines linearly over 95% of the song duration to sync scroll from start to finish
      const totalActiveTime = duration ? duration * 0.95 : lineCount * 4;
      const interval = lineCount > 0 ? totalActiveTime / lineCount : 4;

      const lines = rawLines.map((text: string, i: number) => ({
        time: i * interval,
        text: text.trim(),
      }));

      const result: LyricsData = {
        synced: false,
        lines,
        source: 'lrclib.net (distributed)',
      };
      cache.set(key, result);
      return result;
    }

    throw new Error('No lyrics data');
  } catch (err) {
    // Return empty
    const result: LyricsData = {
      synced: false,
      lines: [],
      source: 'unavailable',
    };
    cache.set(key, result);
    return result;
  }
}

