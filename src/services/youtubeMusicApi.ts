// ─────────────────────────────────────────────────────────────
// Feelora 2 — YouTube Music API Wrapper (Simulated)
// ─────────────────────────────────────────────────────────────

import type { Track } from '@/types';

// Curated high quality dark neon/retro synthwave covers for YouTube Music
const YOUTUBE_ARTWORK_URLS = [
  'https://images.unsplash.com/photo-1515462277126-270d878326e5?w=200&auto=format&fit=crop&q=60', // Neon grid
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=60', // Cyberpunk purple
  'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=200&auto=format&fit=crop&q=60', // Tokyo neon street
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&auto=format&fit=crop&q=60', // Cyber server
  'https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=200&auto=format&fit=crop&q=60', // Tokyo arcade glow
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=60', // Cyberpunk character
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=60', // Neon chips
  'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=200&auto=format&fit=crop&q=60', // Laser grid
  'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=200&auto=format&fit=crop&q=60', // Red wireframe
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60', // Abstract wave
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=60', // Retro controller
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60', // Neon code
  'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=200&auto=format&fit=crop&q=60', // Retro red tape
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&auto=format&fit=crop&q=60', // Red star camper
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=60', // Dark sax player
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=60', // Red stage lasers
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=60', // DJ decks red
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=60', // Red mic
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&auto=format&fit=crop&q=60', // Crowd fire
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200&auto=format&fit=crop&q=60', // Laser concert
];

const YOUTUBE_BRAND_COLORS = [
  { accent: '#FF0000', secondary: '#4E0000' }, // YouTube Red
  { accent: '#CC0000', secondary: '#330000' }, // Darker YouTube Red
  { accent: '#FF4D4D', secondary: '#661A1A' }, // Coral Red
  { accent: '#E60023', secondary: '#4D000B' }, // Ruby Red
  { accent: '#FF5E5B', secondary: '#3F0F0E' }, // Retro Red-orange
  { accent: '#BD081C', secondary: '#3C0000' }, // Crimson
  { accent: '#990000', secondary: '#260000' }, // Maroon
];

export const youtubeMusicApi = {
  /**
   * Procedurally generates 310 curated tracks with YouTube Music aesthetics.
   */
  async getSavedTracks(): Promise<Track[]> {
    const genres = ['Synthwave Pulse', 'Chillwave Vibes', 'Lo-Fi Gaming', 'Cyberpunk Retro', 'Dark Synth', 'Night Drive'];
    const trackNames = [
      'Neon Grid', 'Laser Storm', 'Cyber City', 'Retro Wave', 'Midnight Cruise',
      'Analog Heart', 'Signal Noise', 'Tokyo Glow', 'Overdrive', 'Speedway',
      'Stardust Grid', 'Infinite Loop', 'Vapor Trails', 'Digital Dreams', 'Nightfall',
      'Warp Speed', 'Siren Call', 'Sub-Zero', 'Glitch Realm', 'Outrun'
    ];
    const artists = [
      'Vector Sub', 'Dynatron Pulse', 'Com Truise Fan', 'Mitch Murderer', 'Lazerhawk',
      'Kavinsky Kid', 'Miami Nights', 'Perturbator Boy', 'Carpenter Brutal', 'Gunship'
    ];

    const tracks: Track[] = [];
    for (let i = 0; i < 310; i++) {
      const genre = genres[i % genres.length];
      const artist = artists[(i + Math.floor(i / 12)) % artists.length];
      const nameTemplate = trackNames[(i * 9 + 17) % trackNames.length];
      const title = `${nameTemplate} (Pt. ${Math.floor(i / trackNames.length) + 1})`;
      
      const soundHelixIndex = (i % 16) + 1;
      const audioUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${soundHelixIndex}.mp3`;
      
      const colors = YOUTUBE_BRAND_COLORS[i % YOUTUBE_BRAND_COLORS.length];
      const coverUrl = YOUTUBE_ARTWORK_URLS[i % YOUTUBE_ARTWORK_URLS.length];

      tracks.push({
        id: `youtube-music-${i}`,
        title,
        artist,
        album: `${genre} Archives, Vol. ${Math.floor(i / 20) + 1}`,
        duration: 150 + (i % 140), // 2.5 to 4.8 minutes
        audioUrl,
        coverUrl,
        accentColor: colors.accent,
        secondaryColor: colors.secondary,
        isSpotifyTrack: false,
        provider: 'youtube-music',
      });
    }

    return tracks;
  },

  /**
   * Queries the public iTunes API and maps the results to YouTube Music branded tracks.
   */
  async search(query: string, limit = 10): Promise<Track[]> {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const data = await response.json();
      const items = data.results || [];
      
      return items.map((item: any, i: number) => {
        const artworkUrl = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb.jpg', '400x400bb.jpg')
          : '';
        
        const colors = YOUTUBE_BRAND_COLORS[i % YOUTUBE_BRAND_COLORS.length];
        
        return {
          id: `youtube-music-external-${item.trackId || Math.random().toString(36).slice(2)}`,
          title: item.trackName || 'Unknown Track',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Unknown Album',
          duration: item.trackTimeMillis ? Math.floor(item.trackTimeMillis / 1000) : 0,
          audioUrl: item.previewUrl || '',
          coverUrl: artworkUrl,
          accentColor: colors.accent,
          secondaryColor: colors.secondary,
          isSpotifyTrack: false,
          provider: 'youtube-music',
        };
      });
    } catch (err) {
      console.warn('[YouTubeMusicApi] Search error:', err);
      return [];
    }
  }
};
