// ─────────────────────────────────────────────────────────────
// Feelora 2 — Main Application State Store (Zustand)
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { SpatialTrack, SpotifyUserProfile, SpotifyPlaylist } from '@/types';

interface AppState {
  /* ── Auth ── */
  isAuthenticated: boolean;
  userProfile: SpotifyUserProfile | null;
  setAuthenticated: (val: boolean) => void;
  setUserProfile: (profile: SpotifyUserProfile | null) => void;
  connectedProviders: { spotify: boolean };
  setProviderConnected: (
    provider: 'spotify',
    connected: boolean
  ) => void;
  hasLaunchedUniverse: boolean;
  setHasLaunchedUniverse: (val: boolean) => void;

  /* ── Tab Navigation ── */
  activeTab: 'universe' | 'discover' | 'library';
  setActiveTab: (tab: 'universe' | 'discover' | 'library') => void;

  /* ── Music Data ── */
  allSongs: SpatialTrack[];
  playlists: SpotifyPlaylist[];
  setAllSongs: (songs: SpatialTrack[]) => void;
  setPlaylists: (playlists: SpotifyPlaylist[]) => void;

  /* ── Playback ── */
  currentTrack: SpatialTrack | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  playbackQueue: SpatialTrack[];
  setCurrentTrack: (track: SpatialTrack | null) => void;
  setIsPlaying: (val: boolean) => void;
  setProgress: (val: number) => void;
  setVolume: (val: number) => void;
  setPlaybackQueue: (queue: SpatialTrack[]) => void;

  /* ── Spotify SDK ── */
  spotifyDeviceId: string | null;
  isPremium: boolean;
  setSpotifyDeviceId: (id: string | null) => void;
  setIsPremium: (val: boolean) => void;
  
  /* ── 3D Navigation ── */
  focusedSong: SpatialTrack | null;
  cameraTarget: [number, number, number] | null;
  setFocusedSong: (song: SpatialTrack | null) => void;
  setCameraTarget: (target: [number, number, number] | null) => void;
  sphereSource: 'all' | 'liked' | string;
  setSphereSource: (source: 'all' | 'liked' | string) => void;

  /* ── Search ── */
  searchQuery: string;
  searchResults: string[]; // IDs of matching songs
  isSearchOpen: boolean;
  setSearchQuery: (query: string) => void;
  setSearchResults: (ids: string[]) => void;
  setIsSearchOpen: (val: boolean) => void;

  /* ── UI Modes ── */
  isLyricsOpen: boolean;
  isFocusMode: boolean;
  isLoading: boolean;
  loadingMessage: string;
  setIsLyricsOpen: (val: boolean) => void;
  setIsFocusMode: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  setLoadingMessage: (msg: string) => void;

  /* ── Bloom Control ── */
  bloomIntensity: number;
  setBloomIntensity: (val: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  /* ── Auth ── */
  isAuthenticated: false,
  userProfile: null,
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  connectedProviders: { spotify: false },
  setProviderConnected: (provider, connected) =>
    set((state) => {
      const updated = { ...state.connectedProviders, [provider]: connected };
      if (typeof window !== 'undefined') {
        localStorage.setItem('feelora_connected_providers', JSON.stringify(updated));
      }
      return { connectedProviders: updated };
    }),
  hasLaunchedUniverse: false,
  setHasLaunchedUniverse: (val) => set({ hasLaunchedUniverse: val }),

  /* ── Tab Navigation ── */
  activeTab: 'universe',
  setActiveTab: (tab) => set({ activeTab: tab }),

  /* ── Music Data ── */
  allSongs: [],
  playlists: [],
  setAllSongs: (songs) => set({ allSongs: songs }),
  setPlaylists: (playlists) => set({ playlists }),

  /* ── Playback ── */
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  volume: 0.4,
  playbackQueue: [],
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setProgress: (val) => set({ progress: val }),
  setVolume: (val) => set({ volume: val }),
  setPlaybackQueue: (queue) => set({ playbackQueue: queue }),

  /* ── Spotify SDK ── */
  spotifyDeviceId: null,
  isPremium: true,
  setSpotifyDeviceId: (id) => set({ spotifyDeviceId: id }),
  setIsPremium: (val) => set({ isPremium: val }),

  /* ── 3D Navigation ── */
  focusedSong: null,
  cameraTarget: null,
  setFocusedSong: (song) => set({ focusedSong: song }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  sphereSource: 'all',
  setSphereSource: (source) => set({ sphereSource: source }),

  /* ── Search ── */
  searchQuery: '',
  searchResults: [],
  isSearchOpen: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (ids) => set({ searchResults: ids }),
  setIsSearchOpen: (val) => set({ isSearchOpen: val }),

  /* ── UI Modes ── */
  isLyricsOpen: false,
  isFocusMode: false,
  isLoading: false,
  loadingMessage: '',
  setIsLyricsOpen: (val) => set({ isLyricsOpen: val }),
  setIsFocusMode: (val) => set({ isFocusMode: val }),
  setIsLoading: (val) => set({ isLoading: val }),
  setLoadingMessage: (msg) => set({ loadingMessage: msg }),

  /* ── Bloom Control ── */
  bloomIntensity: 0.8,
  setBloomIntensity: (val) => set({ bloomIntensity: val }),
}));
