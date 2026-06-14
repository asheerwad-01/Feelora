// ─────────────────────────────────────────────────────────────
// Feelora 2 — Spotify Web API Wrapper
// ─────────────────────────────────────────────────────────────

import { spotifyAuth } from './spotifyAuth';
import type {
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyUserProfile,
  Track,
} from '@/types';
import { mapSpotifyTrackToTrack } from '@/types';

const API_BASE = 'v1';

async function fetchFromSpotify(
  endpoint: string,
  options: RequestInit = {},
  retries = 6
): Promise<any> {
  const token = await spotifyAuth.getAccessToken();
  if (!token) throw new Error('Not authenticated with Spotify.');

  const response = await fetch(
    `https://api.spotify.com/${API_BASE}/${endpoint}`,
    {
      ...options,
      cache: 'no-store', // Bypass any browser/framework fetch cache
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (typeof window !== 'undefined') {
    (window as any).lastSpotifyStatus = response.status;
  }

  if (response.status === 401) {
    spotifyAuth.logout();
    throw new Error('Spotify session expired.');
  }

  if (response.status === 429) {
    if (retries > 0) {
      // Calculate exponential backoff delay: 1.5s * 2^(6 - retries) + random jitter (0-1s)
      const multiplier = Math.pow(2, 6 - retries);
      const waitTime = multiplier * 1.5 + Math.random();
      
      console.warn(
        `[SpotifyApi] Rate limit hit (429) for ${endpoint}. CORS hides Retry-After header; using exponential backoff: waiting ${waitTime.toFixed(
          1
        )} seconds... (Retries remaining: ${retries})`
      );
      await new Promise(r => setTimeout(r, waitTime * 1000));
      return fetchFromSpotify(endpoint, options, retries - 1);
    }
    throw new Error('Spotify rate limit hit. Too many retries.');
  }

  if (response.status === 204) return null;

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMsg = errorBody?.error?.message || `Spotify API error: ${response.status}`;
    if (typeof window !== 'undefined') {
      (window as any).lastSpotifyError = errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const spotifyApi = {
  async getUserProfile(): Promise<SpotifyUserProfile> {
    return fetchFromSpotify('me');
  },

  async search(
    query: string,
    limit = 10
  ): Promise<{
    tracks: Track[];
    albums: any[];
    artists: any[];
    playlists: SpotifyPlaylist[];
  }> {
    const safeLimit = Math.max(1, Math.min(10, limit));
    const encodedQuery = encodeURIComponent(query);
    const data = await fetchFromSpotify(
      `search?q=${encodedQuery}&type=track,album,artist,playlist&limit=${safeLimit}`
    );

    return {
      tracks: (data.tracks?.items || []).map((t: SpotifyTrack) =>
        mapSpotifyTrackToTrack(t)
      ),
      albums: data.albums?.items || [],
      artists: data.artists?.items || [],
      playlists: data.playlists?.items || [],
    };
  },

  async getSavedTracks(limit = 50, maxTotal = Infinity): Promise<Track[]> {
    const safeLimit = Math.max(1, Math.min(50, limit));
    let tracks: Track[] = [];

    console.log('[SpotifyApi] Starting to fetch liked songs...');
    try {
      const firstPageUrl = `me/tracks?limit=${safeLimit}`;
      const firstData = await fetchFromSpotify(firstPageUrl);
      const total = firstData.total || 0;
      
      const processItems = (items: any[]) => items
        .filter((item: any) => item && item.track)
        .map((item: { track: SpotifyTrack }) => mapSpotifyTrackToTrack(item.track));

      tracks = [...processItems(firstData.items || [])];

      const totalToFetch = Math.min(total, maxTotal);
      if (tracks.length < totalToFetch) {
        const remainingOffsets = [];
        for (let offset = safeLimit; offset < totalToFetch; offset += safeLimit) {
          remainingOffsets.push(offset);
        }

        // Fetch remaining in chunks of 5 concurrent requests
        const chunkSize = 5;
        for (let i = 0; i < remainingOffsets.length; i += chunkSize) {
          const chunk = remainingOffsets.slice(i, i + chunkSize);
          const promises = chunk.map(offset => 
            fetchFromSpotify(`me/tracks?limit=${safeLimit}&offset=${offset}`).catch(e => {
              console.warn(`[SpotifyApi] Failed to fetch offset ${offset}:`, e);
              return { items: [] }; // Return empty items on failure so Promise.all doesn't reject
            })
          );
          
          const results = await Promise.all(promises);
          for (const res of results) {
            tracks = [...tracks, ...processItems(res.items || [])];
          }
          // Small delay between chunks to prevent aggressive rate limiting
          if (i + chunkSize < remainingOffsets.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
    } catch (err) {
      console.error('[SpotifyApi] Error in getSavedTracks, returning fetched so far:', err);
    }
    
    console.log(`[SpotifyApi] Fetched ${tracks.length} liked songs`);
    return tracks;
  },

  async getRecentlyPlayed(limit = 50): Promise<Track[]> {
    const safeLimit = Math.max(1, Math.min(50, limit));
    const data = await fetchFromSpotify(
      `me/player/recently-played?limit=${safeLimit}`
    );
    const tracksMap = new Map<string, SpotifyTrack>();
    (data.items || []).forEach((item: { track: SpotifyTrack }) => {
      tracksMap.set(item.track.id, item.track);
    });
    return Array.from(tracksMap.values()).map((t) =>
      mapSpotifyTrackToTrack(t)
    );
  },

  async getUserPlaylists(limit = 50): Promise<SpotifyPlaylist[]> {
    const safeLimit = Math.max(1, Math.min(50, limit));
    let playlists: SpotifyPlaylist[] = [];
    let url: string | null = `me/playlists?limit=${safeLimit}`;

    console.log('[SpotifyApi] Starting to fetch user playlists...');
    while (url) {
      const data = await fetchFromSpotify(url);
      if (data && data.items) {
        playlists = [...playlists, ...data.items];
        console.log(`[SpotifyApi] Fetched page of playlists, current count: ${playlists.length}`);
      } else {
        console.warn('[SpotifyApi] No items returned in playlist page data:', data);
      }

      if (data && data.next) {
        const urlObj = new URL(data.next);
        url = urlObj.pathname.replace(/^\/v1\//, '') + urlObj.search;
        await new Promise(r => setTimeout(r, 250)); // Rate limit buffer
      } else {
        url = null;
      }
    }
    console.log(`[SpotifyApi] Fetched ${playlists.length} playlists`);
    return playlists;
  },

  async getPlaylistTracks(
    playlistId: string,
    limit = 50
  ): Promise<Track[]> {
    const safeLimit = Math.max(1, Math.min(50, limit));
    let tracks: Track[] = [];
    let url: string | null = `playlists/${playlistId}/tracks?limit=${safeLimit}`;

    console.log(`[SpotifyApi] Starting to fetch tracks for playlist ${playlistId}...`);
    while (url) {
      const data = await fetchFromSpotify(url);
      const items = (data.items || [])
        .filter((item: any) => item && item.track)
        .map((item: { track: SpotifyTrack }) =>
          mapSpotifyTrackToTrack(item.track)
        );
      tracks = [...tracks, ...items];
      console.log(`[SpotifyApi] Fetched page of playlist tracks, current count: ${tracks.length}`);
      
      if (data.next) {
        const urlObj = new URL(data.next);
        url = urlObj.pathname.replace(/^\/v1\//, '') + urlObj.search;
        await new Promise(r => setTimeout(r, 250)); // Rate limit buffer
      } else {
        url = null;
      }
    }
    console.log(`[SpotifyApi] Fetched ${tracks.length} tracks for playlist ${playlistId}`);
    return tracks;
  },
};
