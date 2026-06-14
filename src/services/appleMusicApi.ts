// ─────────────────────────────────────────────────────────────
// Feelora 2 — Apple Music API Wrapper (Simulated + iTunes Search)
// ─────────────────────────────────────────────────────────────

import type { Track } from '@/types';

// Curated high quality abstract art covers for Apple Music
const APPLE_ARTWORK_URLS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60', // 3D wave
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=200&auto=format&fit=crop&q=60', // Pink/gold gradient
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=200&auto=format&fit=crop&q=60', // Glassmorphism shape
  'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=200&auto=format&fit=crop&q=60', // Abstract paint
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200&auto=format&fit=crop&q=60', // Dark neon wave
  'https://images.unsplash.com/photo-1618005198143-e528346d9a59?w=200&auto=format&fit=crop&q=60', // 3D pastel
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&auto=format&fit=crop&q=60', // Fluid colors
  'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=200&auto=format&fit=crop&q=60', // Neon pink glow
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=60', // Laser lights
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&auto=format&fit=crop&q=60', // Floral neon
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&auto=format&fit=crop&q=60', // Crumpled silk
  'https://images.unsplash.com/photo-1500462969772-60633d1afb17?w=200&auto=format&fit=crop&q=60', // Neon split
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=200&auto=format&fit=crop&q=60', // Neon mountain
  'https://images.unsplash.com/photo-1549490349-8643362247b5?w=200&auto=format&fit=crop&q=60', // Holographic drape
  'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&auto=format&fit=crop&q=60', // Abstract marble
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=60', // Motherboard neon
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&auto=format&fit=crop&q=60', // Prism ray
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=60', // Retro computer glow
  'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=200&auto=format&fit=crop&q=60', // Golden swirl
  'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=200&auto=format&fit=crop&q=60', // Galactic spiral
];

const APPLE_BRAND_COLORS = [
  { accent: '#FF2D55', secondary: '#580B1A' }, // Rose Pink
  { accent: '#AF52DE', secondary: '#3A104D' }, // Purple
  { accent: '#FF9500', secondary: '#4C2700' }, // Orange Gold
  { accent: '#FF3B30', secondary: '#4D0E0E' }, // Apple Red
  { accent: '#5AC8FA', secondary: '#0A3E50' }, // Apple Blue
  { accent: '#FF2A5B', secondary: '#3B0A12' }, // Neon Crimson
  { accent: '#D13438', secondary: '#4C0000' }, // Magenta
];

export const appleMusicApi = {
  /**
   * Procedurally generates 320 curated tracks with Apple Music aesthetics.
   */
  async getSavedTracks(): Promise<Track[]> {
    const genres = ['Spatial Classical', 'Acoustic Dreams', 'Indie Ambient', 'Chill Electronica', 'Dream Pop', 'Lo-Fi Chillout'];
    const trackNames = [
      'Infinite Bloom', 'Weightless Drift', 'Velvet Horizon', 'Glass Shards', 'Silent Echoes',
      'Cascade', 'Morning Mist', 'Prism Light', 'Golden Hour', 'Subterranean',
      'Solitude', 'Stretching Sky', 'Breathe Out', 'Neon Reverie', 'Autumn Leaves',
      'Timeless Voyage', 'Distant Shore', 'Hidden Path', 'Midnight Sun', 'Rising Tide'
    ];
    const artists = [
      'Olavur Arnalds', 'Lumina Trio', 'Hania Rose', 'Kiasmos Echo', 'Sandro K',
      'Fogel', 'Clemency', 'Vessel', 'Aria Space', 'Hammock Drift'
    ];

    const tracks: Track[] = [];
    for (let i = 0; i < 320; i++) {
      const genre = genres[i % genres.length];
      const artist = artists[(i + Math.floor(i / 15)) % artists.length];
      const nameTemplate = trackNames[(i * 7 + 13) % trackNames.length];
      const title = `${nameTemplate} (Pt. ${Math.floor(i / trackNames.length) + 1})`;
      
      const soundHelixIndex = (i % 16) + 1;
      const audioUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${soundHelixIndex}.mp3`;
      
      const colors = APPLE_BRAND_COLORS[i % APPLE_BRAND_COLORS.length];
      const coverUrl = APPLE_ARTWORK_URLS[i % APPLE_ARTWORK_URLS.length];

      tracks.push({
        id: `apple-music-${i}`,
        title,
        artist,
        album: `${genre} Collection, Vol. ${Math.floor(i / 25) + 1}`,
        duration: 160 + (i % 180), // 2.5 to 5.5 minutes
        audioUrl,
        coverUrl,
        accentColor: colors.accent,
        secondaryColor: colors.secondary,
        isSpotifyTrack: false,
        provider: 'apple-music',
      });
    }

    return tracks;
  },

  /**
   * Queries the public, rate-limit-free iTunes API and maps the results to Apple Music branded tracks.
   */
  async search(query: string, limit = 10): Promise<Track[]> {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const data = await response.json();
      const items = data.results || [];
      
      return items.map((item: any, i: number) => {
        // Fetch higher-res artwork by scaling up the cover art size
        const artworkUrl = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb.jpg', '400x400bb.jpg')
          : '';
        
        const colors = APPLE_BRAND_COLORS[i % APPLE_BRAND_COLORS.length];
        
        return {
          id: `apple-music-external-${item.trackId || Math.random().toString(36).slice(2)}`,
          title: item.trackName || 'Unknown Track',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Unknown Album',
          duration: item.trackTimeMillis ? Math.floor(item.trackTimeMillis / 1000) : 0,
          audioUrl: item.previewUrl || '',
          coverUrl: artworkUrl,
          accentColor: colors.accent,
          secondaryColor: colors.secondary,
          isSpotifyTrack: false,
          provider: 'apple-music',
        };
      });
    } catch (err) {
      console.warn('[AppleMusicApi] Search error:', err);
      return [];
    }
  }
};
