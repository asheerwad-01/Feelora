// ─────────────────────────────────────────────────────────────
// Feelora 2 — Spatial Music Universe — Type Definitions
// ─────────────────────────────────────────────────────────────

/* ─── Spotify raw types ─── */

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email?: string;
  product: 'premium' | 'free' | 'open';
  images?: { url: string; height?: number; width?: number }[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  images?: { url: string }[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  images: { url: string; height?: number; width?: number }[];
  release_date?: string;
  artists: SpotifyArtist[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  preview_url: string | null;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  uri: string;
  images?: { url: string }[];
  owner: { display_name: string };
  tracks: { total: number };
}

/* ─── Feelora internal track model ─── */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  audioUrl: string; // preview URL fallback
  coverUrl: string; // album artwork URL
  accentColor: string;
  secondaryColor: string;
  spotifyUri?: string;
  isSpotifyTrack?: boolean;
  provider?: 'spotify' | 'apple-music' | 'youtube-music' | 'demo';
}

/* ─── Spatial track — track positioned in the 3D sphere ─── */

export interface SpatialTrack extends Track {
  /** Cartesian position in the sphere */
  position: [number, number, number];
  /** Spherical coordinates */
  theta: number;
  phi: number;
  radius: number;
  /** Visual properties */
  glowColor: string;
  scale: number;
  /** Index in the master array (for instanced mesh lookup) */
  index: number;
  /** Source collection tag (liked / playlist name) */
  source: string;
  /** List of all collections containing this track */
  sources?: string[];
}

/* ─── Lyrics ─── */

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lines: LyricLine[];
  source: string;
}

/* ─── Audio analysis ─── */

export interface AudioAnalysisData {
  bass: number; // 0–1 normalised
  mid: number;
  treble: number;
  beat: boolean;
  energy: number; // overall 0–1
  frequencyData: Uint8Array | null;
  waveformData: Uint8Array | null;
}

/* ─── Mapping helper ─── */

const COLOR_PALETTE = [
  { accent: '#0A84FF', secondary: '#002C66' }, // Blue
  { accent: '#FF375F', secondary: '#580B1A' }, // Crimson
  { accent: '#30D158', secondary: '#0A3B12' }, // Green
  { accent: '#BF5AF2', secondary: '#3A104D' }, // Purple
  { accent: '#FF9500', secondary: '#4C2700' }, // Orange
  { accent: '#64D2FF', secondary: '#0E3E50' }, // Teal
  { accent: '#FFD60A', secondary: '#4C3E00' }, // Gold
  { accent: '#FF6482', secondary: '#4D0E1F' }, // Rose
  { accent: '#AC8E68', secondary: '#3B2E1A' }, // Warm bronze
  { accent: '#5E5CE6', secondary: '#1C1B4B' }, // Indigo
] as const;

export function mapSpotifyTrackToTrack(spotifyTrack: SpotifyTrack): Track {
  if (!spotifyTrack) {
    return {
      id: `spotify-unknown-${Math.random().toString(36).slice(2)}`,
      title: 'Unknown Track',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      audioUrl: '',
      coverUrl: '',
      accentColor: '#0A84FF',
      secondaryColor: '#002C66',
      spotifyUri: '',
      isSpotifyTrack: true,
    };
  }

  const primaryArtist = Array.isArray(spotifyTrack.artists)
    ? spotifyTrack.artists.map(a => a?.name || 'Unknown Artist').join(', ')
    : 'Unknown Artist';

  const coverUrl =
    spotifyTrack.album?.images?.[0]?.url || '';

  const charCodeSum = (spotifyTrack.name || '')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = COLOR_PALETTE[charCodeSum % COLOR_PALETTE.length];

  return {
    id: `spotify-${spotifyTrack.id || Math.random().toString(36).slice(2)}`,
    title: spotifyTrack.name || 'Unknown Track',
    artist: primaryArtist,
    album: spotifyTrack.album?.name || 'Unknown Album',
    duration: spotifyTrack.duration_ms
      ? Math.floor(spotifyTrack.duration_ms / 1000)
      : 0,
    audioUrl: spotifyTrack.preview_url || '',
    coverUrl,
    accentColor: colors.accent,
    secondaryColor: colors.secondary,
    spotifyUri: spotifyTrack.uri || '',
    isSpotifyTrack: true,
    provider: 'spotify',
  };
}
