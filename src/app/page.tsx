'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Main Page
// Orchestrates the spatial music universe experience
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';

import { useAppStore } from '@/store/useAppStore';
import { spotifyAuth } from '@/services/spotify/spotifyAuth';
import { spotifyApi } from '@/services/spotify/spotifyApi';
import { spotifyPlayer } from '@/services/spotify/spotifyPlayer';
import { mergeAndDistribute, distributeTracks } from '@/utils/sphereDistribution';
import { mapSpotifyTrackToTrack } from '@/types';
import type { Track, SpatialTrack, SpotifyPlaylist } from '@/types';
import { audioAnalyzer } from '@/services/audio/audioAnalyzer';
import { playbackController } from '@/services/audio/playbackController';

// UI Components
import { LoginGate } from '@/components/ui/LoginGate';
import { FocusModeOverlay } from '@/components/ui/FocusModeOverlay';
import { NowPlayingHUD } from '@/components/ui/NowPlayingHUD';
import { SpatialSearch } from '@/components/ui/SpatialSearch';
import { LyricsPanel } from '@/components/ui/LyricsPanel';
import { LoadingUniverse } from '@/components/ui/LoadingUniverse';
import { NavigationBar } from '@/components/ui/NavigationBar';
import { DiscoverPanel } from '@/components/ui/DiscoverPanel';
import { LibraryPanel } from '@/components/ui/LibraryPanel';
import { CategoryBar } from '@/components/ui/CategoryBar';
import { GenreModal } from '@/components/ui/GenreModal';
import { SpatialControls } from '@/components/ui/SpatialControls';

// Dynamic import for Three.js canvas (client-only, no SSR)
const SphereCanvas = dynamic(
  () =>
    import('@/components/three/SphereCanvas').then((mod) => ({
      default: mod.SphereCanvas,
    })),
  {
    ssr: false,
    loading: () => null,
  }
);

// AudioVisualizer removed — clean dark aesthetic restored

// ─── Color palette for SDK track mapping ───
const COLOR_PALETTE = [
  { accent: '#0A84FF', secondary: '#002C66' },
  { accent: '#FF375F', secondary: '#580B1A' },
  { accent: '#30D158', secondary: '#0A3B12' },
  { accent: '#BF5AF2', secondary: '#3A104D' },
  { accent: '#FF9500', secondary: '#4C2700' },
  { accent: '#64D2FF', secondary: '#0E3E50' },
  { accent: '#FFD60A', secondary: '#4C3E00' },
];

// ─── Curated Unsplash images for demo cover art thumbnails ───
const DEMO_ARTWORK_URLS = [
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1484876065684-b683cf17d276?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1526218626217-dc65a29bb444?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1513829096963-f9c3dc523fcc?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1517230878791-4d28214057c2?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1518911710364-17ec553bde5d?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1453090927415-5f45085b65c0?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1543794327-59a91fb7d041?w=150&auto=format&fit=crop&q=60'
];

// ─── Generate Demo Tracks (1000+ tracks) ───
function generateDemoTracks(): Track[] {
  const genres = ['Synthwave', 'Ambient Space', 'Neo-Classical', 'Lo-Fi Chill', 'Cyberpunk', 'Deep Focus', 'Dream Pop', 'Liquid Drum & Bass'];
  const trackNameTemplates = [
    'Solar Wind', 'Nebula Drift', 'Event Horizon', 'Cosmic Dust', 'Supernova Pulse',
    'Quantum Jump', 'Stardust Dreams', 'Dark Matter', 'Gravitational Pull', 'Warp Drive',
    'Black Hole Sun', 'Parallel Universe', 'Interstellar Echo', 'Light Speed', 'Orion Belt',
    'Andromeda Void', 'Galactic Core', 'Lunar Reflection', 'Solar Flare', 'Time Dilation'
  ];
  const artists = [
    'Aetheris', 'Cosmic Kid', 'Lumina', 'Vektor', 'Neo-Scribe',
    'Spectral Core', 'Hologram', 'Eclipse', 'Chronos', 'Solaris'
  ];
  
  const tracks: Track[] = [];
  for (let i = 0; i < 1000; i++) {
    const genre = genres[i % genres.length];
    const artist = artists[(i + Math.floor(i / 10)) % artists.length];
    const template = trackNameTemplates[(i * 3 + 7) % trackNameTemplates.length];
    const title = `${template} (Part ${Math.floor(i / trackNameTemplates.length) + 1})`;
    
    // Cyclic soundhelix mp3s
    const soundHelixIndex = (i % 16) + 1;
    const audioUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${soundHelixIndex}.mp3`;
    
    // Premium color palette for visual variety
    const colors = COLOR_PALETTE[i % COLOR_PALETTE.length];
    const coverUrl = DEMO_ARTWORK_URLS[i % DEMO_ARTWORK_URLS.length];
    
    tracks.push({
      id: `demo-${i}`,
      title,
      artist,
      album: `${genre} Archives, Vol. ${Math.floor(i / 20) + 1}`,
      duration: 180 + (i % 120), // 3 to 5 minutes
      audioUrl,
      coverUrl, // Assigned high quality image cover art URL
      accentColor: colors.accent,
      secondaryColor: colors.secondary,
      isSpotifyTrack: false,
    });
  }
  return tracks;
}

export default function FeeloraPage() {
  const {
    isAuthenticated,
    setAuthenticated,
    setUserProfile,
    allSongs,
    setAllSongs,
    setLibrarySongs,
    playlists,
    setPlaylists,
    setIsLoading,
    setLoadingMessage,
    isLoading,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    setProgress,
    volume,
    setVolume,
    spotifyDeviceId,
    setSpotifyDeviceId,
    isPremium,
    setIsPremium,
    focusedSong,
    setFocusedSong,
    setCameraTarget,
    isFocusMode,
    activeTab,
    setIsLyricsOpen,
    sphereSource,
    setSphereSource,
    connectedProviders,
    setProviderConnected,
    hasLaunchedUniverse,
    setHasLaunchedUniverse,
    playbackQueue,
    setPlaybackQueue,
    bloomIntensity,
    setBloomIntensity,
    isLyricsOpen,
  } = useAppStore();

  const [hydrated, setHydrated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingPlaylist, setSyncingPlaylist] = useState('');
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
  const [playlistLoadingName, setPlaylistLoadingName] = useState('');
  const [diagInfo, setDiagInfo] = useState({
    status: 'Disconnected',
    playlistsCount: 0,
    likedCount: 0,
    error: '',
  });
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const playbackStateRef = useRef<any>(null);
  const attemptedPlaylistsRef = useRef<Set<string>>(new Set());
  const likedSongsRef = useRef<Track[]>([]);
  const playlistTracksRef = useRef<Record<string, Track[]>>({});

  console.log('[FeeloraPage] Render - hydrated:', hydrated, 'isAuthenticated:', isAuthenticated, 'isDemoMode:', isDemoMode);

  // ─── Hydration guard for SSR ───
  useEffect(() => {
    console.log('[FeeloraPage] Client mount - setting hydrated: true');
    setHydrated(true);

    // Suppress deprecated THREE.Clock warning generated internally by R3F
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
        return;
      }
      originalWarn(...args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  // ─── Reset camera focus when returning to default Universe tab ───
  useEffect(() => {
    if (activeTab === 'universe') {
      setFocusedSong(null);
      setCameraTarget(null);
    }
  }, [activeTab, setFocusedSong, setCameraTarget]);

  // ─── Check Spotify auth / Demo mode on mount ───
  useEffect(() => {
    if (!hydrated) return;

    const checkAuth = async () => {
      // Check demo mode first
      const isDemo = localStorage.getItem('feelora_demo_mode') === 'true';
      if (isDemo) {
        console.log('[FeeloraPage] Auto-loading demo universe');
        setIsDemoMode(true);
        setAuthenticated(true);
        setHasLaunchedUniverse(true);
        
        setIsLoading(true);
        setLoadingMessage('Rebuilding your demo universe...');
        const mockTracks = generateDemoTracks();
        
        const likedTracks = mockTracks.slice(0, 50);
        const playlist1Tracks = mockTracks.slice(50, 100);
        const playlist2Tracks = mockTracks.slice(100, 150);
        const otherTracks = mockTracks.slice(150);

        likedSongsRef.current = likedTracks;
        playlistTracksRef.current['demo-pl-1'] = playlist1Tracks;
        playlistTracksRef.current['demo-pl-2'] = playlist2Tracks;
        playlistTracksRef.current['demo-pl-3'] = otherTracks;

        const sources = [
          { tracks: likedTracks, source: 'Liked Songs' },
          { tracks: playlist1Tracks, source: 'demo-pl-1' },
          { tracks: playlist2Tracks, source: 'demo-pl-2' },
          { tracks: otherTracks, source: 'demo-pl-3' },
        ];
        const spatialTracks = mergeAndDistribute(sources, 7.5);
        setAllSongs(spatialTracks);
        setLibrarySongs(spatialTracks);
        
        const mockPlaylists: SpotifyPlaylist[] = [
          { id: 'demo-pl-1', name: 'Coding Vibes', description: 'Focus beats', uri: '', owner: { display_name: 'Feelora' }, tracks: { total: 50 } },
          { id: 'demo-pl-2', name: 'Late Night Jazz', description: 'Smooth jazz', uri: '', owner: { display_name: 'Feelora' }, tracks: { total: 50 } },
          { id: 'demo-pl-3', name: 'Ambient Space', description: 'Floating textures', uri: '', owner: { display_name: 'Feelora' }, tracks: { total: 850 } },
        ];
        setPlaylists(mockPlaylists);
        setSphereSource('liked');
        
        setIsLoading(false);
        return;
      }

      // Handle OAuth callback
      const isCallback = await spotifyAuth.handleAuthCallback();
      if (isCallback) {
        setAuthenticated(true);
        setProviderConnected('spotify', true);
        localStorage.setItem('feelora_has_launched', 'true');
        setHasLaunchedUniverse(true);
        return;
      }

      // Check existing session
      if (spotifyAuth.isLoggedIn()) {
        setAuthenticated(true);
      }
    };

    // Redirect localhost → 127.0.0.1
    if (window.location.hostname === 'localhost') {
      const protocol = window.location.protocol;
      const port = window.location.port || '3000';
      window.location.replace(
        `${protocol}//127.0.0.1:${port}${window.location.pathname}${window.location.search}`
      );
      return;
    }

    checkAuth();
  }, [hydrated, setAuthenticated, setAllSongs, setPlaylists, setSphereSource, setIsLoading, setLoadingMessage, setProviderConnected, setHasLaunchedUniverse]);

  // ─── Initialize SDKs + Fetch data once connected & launched ───
  useEffect(() => {
    if (!hasLaunchedUniverse || !hydrated) return;

    // Skip if in demo mode
    const isDemo = localStorage.getItem('feelora_demo_mode') === 'true';
    if (isDemo) {
      return;
    }

    let active = true;

    const initialize = async () => {
      setIsLoading(true);
      setLoadingMessage('Configuring spatial services...');

      try {
        let spotifyTracks: Track[] = [];
        let userPlaylists: SpotifyPlaylist[] = [];

        let unsubReady: (() => void) | null = null;
        let unsubNotReady: (() => void) | null = null;
        let unsubState: (() => void) | null = null;
        let unsubError: (() => void) | null = null;

        // 1. Spotify connection
        const { connectedProviders: latestProviders } = useAppStore.getState();
        if (latestProviders.spotify) {
          setLoadingMessage('Connecting to Spotify...');
          const token = await spotifyAuth.getAccessToken();
          if (token && active) {
            try {
              setLoadingMessage('Initializing playback...');
              await spotifyPlayer.init(token);

              unsubReady = spotifyPlayer.subscribeReady((devId) => {
                setSpotifyDeviceId(devId);
                setIsPremium(true);
              });

              unsubNotReady = spotifyPlayer.subscribeNotReady(() => {
                setSpotifyDeviceId(null);
              });

              unsubState = spotifyPlayer.subscribeStateChanged((state) => {
                playbackStateRef.current = state;
                if (state) {
                  playbackController.setActivePlayer('spotify');
                  const paused = state.paused;
                  setIsPlaying(!paused);

                  if (!paused) {
                    if (state.track_window?.current_track?.name) {
                      audioAnalyzer.setBpmFromTrack(state.track_window.current_track.name);
                    }
                    audioAnalyzer.start();
                  } else {
                    audioAnalyzer.stop();
                  }

                  if (state.track_window?.current_track) {
                    const sdkTrack = state.track_window.current_track;
                    const hash = (sdkTrack.name || '')
                      .split('')
                      .reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
                    const colors = COLOR_PALETTE[hash % COLOR_PALETTE.length];

                    const currentAllSongs = useAppStore.getState().allSongs;
                    const existingSong = currentAllSongs.find(
                      (s) => s.spotifyUri === sdkTrack.uri
                    );
                    if (existingSong) {
                      setCurrentTrack(existingSong);
                    } else {
                      setCurrentTrack({
                        id: `spotify-${sdkTrack.id}`,
                        title: sdkTrack.name,
                        artist: sdkTrack.artists.map((a: any) => a.name).join(', '),
                        album: sdkTrack.album.name,
                        duration: Math.floor(state.duration / 1000),
                        audioUrl: '',
                        coverUrl: sdkTrack.album.images?.[0]?.url || '',
                        accentColor: colors.accent,
                        secondaryColor: colors.secondary,
                        spotifyUri: sdkTrack.uri,
                        isSpotifyTrack: true,
                        provider: 'spotify',
                        position: [0, 0, 0],
                        theta: 0,
                        phi: 0,
                        radius: 0,
                        glowColor: colors.accent,
                        scale: 1,
                        index: -1,
                        source: 'sdk',
                      } as SpatialTrack);
                    }
                  }
                }
              });

              unsubError = spotifyPlayer.subscribeError((err) => {
                if (err.includes('Requires Premium')) {
                  setIsPremium(false);
                }
              });
            } catch (sdkError) {
              console.warn('[Feelora] Spotify SDK player setup skipped:', sdkError);
              setIsPremium(false);
            }

            // Profile
            try {
              setLoadingMessage('Fetching Spotify profile...');
              const profile = await spotifyApi.getUserProfile();
              if (active) setUserProfile(profile);
            } catch (err) {
              console.warn('[Feelora] Profile query skipped:', err);
            }

            // Liked songs
            try {
              setLoadingMessage('Loading Spotify library...');
              spotifyTracks = await spotifyApi.getSavedTracks();
              likedSongsRef.current = spotifyTracks;
            } catch (err) {
              console.warn('[Feelora] Spotify liked songs fetch failed:', err);
            }

            // Playlists
            try {
              setLoadingMessage('Loading Spotify playlists...');
              userPlaylists = await spotifyApi.getUserPlaylists();
              if (active) setPlaylists(userPlaylists);
            } catch (err) {
              console.warn('[Feelora] Spotify playlists fetch failed:', err);
            }
          }
        }


        // 2. Merge libraries and build spatial coordinates
        if (active) {
          setLoadingMessage('Building your universe...');
          const initialSources: { tracks: Track[]; source: string }[] = [];
          
          if (spotifyTracks.length > 0) {
            initialSources.push({ tracks: spotifyTracks, source: 'Spotify' });
            initialSources.push({ tracks: spotifyTracks, source: 'Liked Songs' });
          }

          // Add loaded playlists
          userPlaylists.forEach(pl => {
            const tracks = playlistTracksRef.current[pl.id] || [];
            if (tracks.length > 0) {
              initialSources.push({ tracks, source: pl.id });
            }
          });

          let spatialTracks = mergeAndDistribute(initialSources, 7.5);

          if (spatialTracks.length === 0) {
            console.log('[Feelora] No services returned tracks, generating demo fallback.');
            const mockTracks = generateDemoTracks();
            spatialTracks = mergeAndDistribute([
              { tracks: mockTracks.slice(0, 100), source: 'Liked Songs' },
              { tracks: mockTracks.slice(100), source: 'Ambient Space' }
            ], 7.5);
          }

          setAllSongs(spatialTracks);
          setLibrarySongs(spatialTracks);
          setSphereSource('all');
          setIsLoading(false);
        }

        return () => {
          if (unsubReady) unsubReady();
          if (unsubNotReady) unsubNotReady();
          if (unsubState) unsubState();
          if (unsubError) unsubError();
          audioAnalyzer.stop();
        };
      } catch (error) {
        console.error('[Feelora] Multi-service launch error:', error);
        if (active) {
          setIsLoading(false);
          setLoadingMessage('');
        }
      }
    };

    const cleanupPromise = initialize();

    return () => {
      active = false;
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [hasLaunchedUniverse, hydrated]);

  // ─── Progress tick for Spotify playback ───
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (isPlaying && currentTrack?.isSpotifyTrack) {
      let lastCalibrationTime = 0;

      progressIntervalRef.current = setInterval(async () => {
        const now = Date.now();
        
        // Calibrate progress with Spotify player SDK's official state every 1 second to correct drift/lag
        if (now - lastCalibrationTime > 1000 && spotifyPlayer.player) {
          try {
            const state = await spotifyPlayer.player.getCurrentState();
            if (state) {
              playbackStateRef.current = state;
              lastCalibrationTime = now;
            }
          } catch (err) {
            console.warn('[Feelora] Spotify player state calibration skipped:', err);
          }
        }

        const state = playbackStateRef.current;
        if (state && !state.paused) {
          const elapsed = Date.now() - state.timestamp;
          const posMs = state.position + elapsed;
          setProgress(Math.min(posMs / 1000, currentTrack.duration));
        }
      }, 100);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentTrack?.id, setProgress]);

  // ─── Volume sync ───
  useEffect(() => {
    const isSpotify = !!(currentTrack?.isSpotifyTrack && spotifyDeviceId && isPremium);
    playbackController.setVolume(volume, isSpotify).catch(() => {});
  }, [volume, currentTrack, spotifyDeviceId, isPremium]);

  // ─── Auto-open lyrics when entering focus mode ───
  useEffect(() => {
    if (isFocusMode) {
      setIsLyricsOpen(true);
    }
  }, [isFocusMode, setIsLyricsOpen]);

  // ─── Global Keyboard Shortcuts for Playback (Space: play/pause, ArrowLeft/Right: prev/next) ───
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't intercept shortcuts when user is typing in an input/textarea
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!currentTrack) return;
        const isSpotify = !!(currentTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
        if (isPlaying) {
          await playbackController.pause(isSpotify);
        } else {
          await playbackController.resume(isSpotify, currentTrack.title);
        }
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const queue = playbackQueue.length > 0 ? playbackQueue : allSongs;
        if (!currentTrack || queue.length === 0) return;

        let nextIndex = 0;
        const currentIndex = queue.findIndex((s: any) => s.id === currentTrack.id);
        if (currentIndex !== -1) {
          nextIndex = (currentIndex + 1) % queue.length;
        }

        const nextTrack = queue[nextIndex];
        setCurrentTrack(nextTrack);
        setFocusedSong(nextTrack);
        setProgress(0);

        try {
          await playbackController.play(nextTrack, spotifyDeviceId, isPremium, volume);
        } catch (err) {
          console.error('[GlobalKeyboard] Next track play error:', err);
        }
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const queue = playbackQueue.length > 0 ? playbackQueue : allSongs;
        if (!currentTrack || queue.length === 0) return;

        let prevIndex = queue.length - 1;
        const currentIndex = queue.findIndex((s: any) => s.id === currentTrack.id);
        if (currentIndex !== -1) {
          prevIndex = (currentIndex - 1 + queue.length) % queue.length;
        }

        const prevTrack = queue[prevIndex];
        setCurrentTrack(prevTrack);
        setFocusedSong(prevTrack);
        setProgress(0);

        try {
          await playbackController.play(prevTrack, spotifyDeviceId, isPremium, volume);
        } catch (err) {
          console.error('[GlobalKeyboard] Prev track play error:', err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentTrack,
    isPlaying,
    volume,
    allSongs,
    playbackQueue,
    spotifyDeviceId,
    isPremium,
    setCurrentTrack,
    setFocusedSong,
    setCameraTarget,
    setProgress,
  ]);

  // ─── Dynamic Playlist Loading & Selection Sync ───
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Skip if in demo mode
    const isDemo = localStorage.getItem('feelora_demo_mode') === 'true';
    if (isDemo) return;

    if (sphereSource !== 'all' && sphereSource !== 'liked' && sphereSource !== 'Spotify') {
      // Single playlist selection
      const pl = playlists.find((p) => p.id === sphereSource);
      if (pl && !playlistTracksRef.current[pl.id]) {
        // Not loaded yet! Load immediately on demand
        setIsPlaylistLoading(true);
        setPlaylistLoadingName(pl.name);
        
        spotifyApi.getPlaylistTracks(pl.id, 50).then((tracks) => {
          playlistTracksRef.current[pl.id] = tracks;
          // Rebuild the sphere
          const updatedSources = [
            { tracks: likedSongsRef.current, source: 'Spotify' },
            { tracks: likedSongsRef.current, source: 'Liked Songs' },
            ...playlists.map(p => ({
              tracks: playlistTracksRef.current[p.id] || [],
              source: p.id
            })).filter(s => s.tracks.length > 0)
          ];
          const newSpatialTracks = mergeAndDistribute(updatedSources, 7.5);
          setAllSongs(newSpatialTracks);
          setLibrarySongs(newSpatialTracks);
        }).catch((err) => {
          console.warn(`[Feelora] Failed to fetch playlist on-demand ${pl.name}:`, err);
        }).finally(() => {
          setIsPlaylistLoading(false);
          setPlaylistLoadingName('');
        });
      }
    }
  }, [sphereSource, isAuthenticated, playlists, setAllSongs]);

  // ─── Play a song from the sphere ───
  const handlePlaySong = useCallback(
    async (song: SpatialTrack) => {
      setCurrentTrack(song);
      setFocusedSong(song);
      setProgress(0);
      // Lyrics auto-open is handled only in Focus Mode via useEffect

      // Set the active queue to match the filtered tracks in the sphere view
      let activeTracks = allSongs;
      if (sphereSource === 'liked') {
        activeTracks = allSongs.filter((s) => s.sources ? s.sources.includes('Liked Songs') : s.source === 'Liked Songs');
      } else if (sphereSource !== 'all') {
        activeTracks = allSongs.filter((s) => s.sources ? s.sources.includes(sphereSource) : s.source === sphereSource);
      }
      setPlaybackQueue(activeTracks);

      try {
        await playbackController.play(
          song,
          spotifyDeviceId,
          isPremium,
          volume
        );
      } catch (err) {
        console.error('[Feelora] Play error:', err);
      }
    },
    [
      spotifyDeviceId,
      isPremium,
      volume,
      allSongs,
      sphereSource,
      setCurrentTrack,
      setFocusedSong,
      setCameraTarget,
      setProgress,
      setIsLyricsOpen,
      setPlaybackQueue,
    ]
  );

  // ─── Handle song click from the 3D sphere ───
  useEffect(() => {
    if (focusedSong && focusedSong.id !== currentTrack?.id) {
      // Double-click / confirm to play — single click just focuses
      // For now, auto-play on focus (will refine with interaction states)
      handlePlaySong(focusedSong);
    }
  }, [focusedSong?.id]);

  // ─── Enter Demo Universe ───
  const handleEnterDemo = useCallback(() => {
    console.log('[FeeloraPage] Entering demo universe');
    setIsLoading(true);
    setLoadingMessage('Building your demo universe...');
    
    localStorage.setItem('feelora_demo_mode', 'true');
    setIsDemoMode(true);
    
    const mockTracks = generateDemoTracks();
    const likedTracks = mockTracks.slice(0, 50);
    const playlist1Tracks = mockTracks.slice(50, 100);
    const playlist2Tracks = mockTracks.slice(100, 150);
    const otherTracks = mockTracks.slice(150);

    likedSongsRef.current = likedTracks;
    playlistTracksRef.current['demo-pl-1'] = playlist1Tracks;
    playlistTracksRef.current['demo-pl-2'] = playlist2Tracks;
    playlistTracksRef.current['demo-pl-3'] = otherTracks;

    const sources = [
      { tracks: likedTracks, source: 'Liked Songs' },
      { tracks: playlist1Tracks, source: 'demo-pl-1' },
      { tracks: playlist2Tracks, source: 'demo-pl-2' },
      { tracks: otherTracks, source: 'demo-pl-3' },
    ];
    const spatialTracks = mergeAndDistribute(sources, 7.5);
    
    setAllSongs(spatialTracks);
    setLibrarySongs(spatialTracks);
    
    const mockPlaylists: SpotifyPlaylist[] = [
      { id: 'demo-pl-1', name: 'Coding Vibes', description: 'Focus beats', uri: '', owner: { display_name: 'Feelora' }, tracks: { total: 50 } },
      { id: 'demo-pl-2', name: 'Late Night Jazz', description: 'Smooth jazz', uri: '', owner: { display_name: 'Feelora' }, tracks: { total: 50 } },
      { id: 'demo-pl-3', name: 'Ambient Space', description: 'Floating textures', uri: '', owner: { display_name: 'Feelora' }, tracks: { total: 850 } },
    ];
    setPlaylists(mockPlaylists);
    setSphereSource('liked');
    
    setAuthenticated(true);
    setHasLaunchedUniverse(true);
    setIsLoading(false);
  }, [setAllSongs, setPlaylists, setSphereSource, setAuthenticated, setHasLaunchedUniverse, setIsLoading, setLoadingMessage]);

  // ─── Logout / Exit Demo ───
  const handleLogout = useCallback(() => {
    localStorage.removeItem('feelora_demo_mode');
    localStorage.removeItem('feelora_has_launched');
    spotifyAuth.logout();
    setProviderConnected('spotify', false);
    setHasLaunchedUniverse(false);
  }, [setProviderConnected, setHasLaunchedUniverse]);

  // ─── Render ───
  if (!hydrated) return null;

  return (
    <div className="relative w-full h-full">
      {/* Login gate */}
      {!hasLaunchedUniverse && <LoginGate onEnterDemo={handleEnterDemo} />}

      {/* Loading state */}
      {hasLaunchedUniverse && <LoadingUniverse />}

      {/* Background: clean dark — no distracting color overlays */}

      {/* 3D Canvas (always mounted for smooth transitions) */}
      {hasLaunchedUniverse && <SphereCanvas />}

      {/* Focus Mode Overlay */}
      <FocusModeOverlay />

      {/* Top Header Row (Logo, Bloom, Nav, Search, Disconnect) - Always mounted at root level for focus mode overlay visibility */}
      {hasLaunchedUniverse && !isLoading && (
        <div className="fixed top-6 left-6 right-6 flex justify-between items-center z-[60] pointer-events-none">
          {/* Left: Logo & Bloom Control Bar */}
          <div className="flex items-center gap-4 select-none shrink-0 pointer-events-auto">
            {/* Logo */}
            <div className={`flex items-center gap-2.5 transition-all duration-500 ease-in-out ${isFocusMode ? 'opacity-0 pointer-events-none max-w-0 overflow-hidden mr-0' : 'opacity-100 max-w-[220px] mr-1'}`}>
              <img src="https://i.postimg.cc/N0C3R1s6/Feelora-Icon.png" alt="Feelora" className="w-9 h-9 object-contain shrink-0" />
              <span className="text-[12px] font-mono tracking-[0.3em] uppercase font-bold text-white/70 shrink-0">
                FEELORA
              </span>
              {isDemoMode && (
                <span className="px-2 py-0.5 rounded-md bg-[#BF5AF2]/20 border border-[#BF5AF2]/30 text-[9px] font-mono text-[#BF5AF2] uppercase tracking-wider font-bold shrink-0">
                  Demo
                </span>
              )}
            </div>

            {/* Bloom control slider - Moved to a separate vertical container for mobile */}
          </div>

          {/* Center: Navigation, Dropdown, Search (hidden in Focus Mode) */}
          <div className={`flex items-center gap-2 md:gap-4 justify-end md:justify-center flex-1 pointer-events-auto transition-all duration-500 ease-in-out ${isFocusMode ? 'opacity-0 pointer-events-none scale-95 overflow-hidden h-0' : 'opacity-100 scale-100'}`}>
            <div className="scale-90 md:scale-100 origin-center shrink-0">
              <NavigationBar />
            </div>
            
            <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0 hidden md:block" />

            <div className="relative shrink-0">
              <select
                value={sphereSource}
                onChange={(e) => setSphereSource(e.target.value)}
                className="appearance-none glass backdrop-blur-xl bg-black/40 text-[#8E8E93] hover:text-white border border-white/10 rounded-full pl-3 md:pl-4 pr-6 md:pr-9 py-2 text-[10px] md:text-[11px] font-mono hover:bg-white/5 focus:outline-none focus:border-white/25 transition-all cursor-pointer w-[90px] md:min-w-[130px] md:max-w-[180px] h-[34px] shadow-sm truncate"
              >
                <option value="all">All</option>
                <option value="liked">Liked</option>
                {connectedProviders.spotify && <option value="Spotify">Spotify</option>}
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name.length > 16 ? pl.name.slice(0, 14) + '…' : pl.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 md:right-3.5 top-[52%] -translate-y-1/2 pointer-events-none text-white/40 text-[6px]">
                ▼
              </div>
            </div>

            <button
              onClick={() => useAppStore.getState().setIsSearchOpen(true)}
              className="flex items-center justify-center gap-2 w-[34px] md:w-auto px-0 md:px-4 py-2 rounded-full glass backdrop-blur-xl border border-white/10 bg-black/40 text-[10px] md:text-[11px] font-mono text-[#8E8E93] hover:text-white hover:bg-white/5 transition-all cursor-pointer h-[34px] shrink-0"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="hidden md:inline">Search Universe</span>
              <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[8px] text-[#48484A]">
                <span>⌘K</span>
              </div>
            </button>
          </div>

          {/* Right: Disconnect / Exit Demo (hidden in Focus Mode) */}
          <div className={`flex justify-end shrink-0 pointer-events-auto transition-all duration-500 ease-in-out ${isFocusMode ? 'opacity-0 pointer-events-none w-0 overflow-hidden' : 'opacity-100 md:w-[140px] pl-2'}`}>
            <button
              onClick={handleLogout}
              className="px-3 md:px-5 py-2 rounded-full glass backdrop-blur-xl border border-white/10 bg-black/40 text-[10px] md:text-[11px] font-mono text-[#FF375F] hover:text-[#ff5c7d] hover:bg-[#FF375F]/15 transition-all cursor-pointer shadow-[0_4px_12px_rgba(255,55,95,0.1)] truncate"
            >
              <span className="md:hidden">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </span>
              <span className="hidden md:inline">{isDemoMode ? 'Exit Demo' : 'Disconnect'}</span>
            </button>
          </div>
        </div>
      )}

      {/* HUD Layer */}
      {hasLaunchedUniverse && !isLoading && (
        <div className="hud-layer">

          {/* Song count indicator */}
          {!isFocusMode && (
            <div className="absolute bottom-32 left-6 hud-interactive">
              <div className="glass-pill rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                <span className="text-[10px] font-mono text-[#8E8E93] tracking-wider">
                  {allSongs.length} songs in universe
                </span>
              </div>
            </div>
          )}



          {/* Discover Sidebar Overlay */}
          {!isFocusMode && <DiscoverPanel />}

          {/* Library Sidebar Overlay */}
          {!isFocusMode && <LibraryPanel />}

          {/* Now Playing HUD */}
          {!isFocusMode && <NowPlayingHUD />}

          {/* Category Bar */}
          <div 
            className="fixed right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto z-40 bottom-[140px] md:bottom-[170px]"
            style={{ width: 'min(95vw, 680px)' }}
          >
            <CategoryBar />
          </div>

          {/* Spatial controls D-pad + Zoom */}
          <SpatialControls />
          
          {/* Vertical Bloom Slider for Mobile (Bottom Right) */}
          {!isFocusMode && (
            <div className={`fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 md:top-24 md:translate-y-0 pointer-events-auto flex flex-col items-center gap-3 p-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-opacity duration-300 ${isLyricsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/70">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <div className="relative h-28 w-4 flex items-center justify-center">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={bloomIntensity}
                  onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                  className="cursor-pointer accent-white absolute origin-center"
                  style={{ transform: 'rotate(270deg)', width: '100px', background: 'rgba(255,255,255,0.15)', borderRadius: '9999px', outline: 'none', WebkitAppearance: 'none', height: '4px' }}
                />
              </div>
              <span className="text-[9px] font-mono text-white/80 font-bold tracking-tighter">
                {bloomIntensity.toFixed(1)}
              </span>
            </div>
          )}

          {/* Spatial Search */}
          <SpatialSearch />

          {/* Lyrics Panel */}
          <LyricsPanel />

          {/* Dynamic Playlist Loading Pill */}
          {isPlaylistLoading && (
            <div className="fixed bottom-[130px] right-6 md:bottom-[230px] md:right-8 z-50 animate-fade-in pointer-events-none">
              <div className="glass-pill rounded-full px-4.5 py-2.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 bg-black/70 backdrop-blur-2xl">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-[#0A84FF] animate-spin" />
                <span className="text-[10px] font-mono text-white/90 tracking-wider font-semibold">
                  Loading {playlistLoadingName}...
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
