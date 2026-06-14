'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Spatial Search (⌘K)
// Songs illuminate in 3D as user types
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback, useState } from 'react';
import gsap from 'gsap';

import { useAppStore } from '@/store/useAppStore';
import { spotifyApi } from '@/services/spotify/spotifyApi';
import { playbackController } from '@/services/audio/playbackController';
import type { SpatialTrack, Track } from '@/types';

export function SpatialSearch() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    setSearchResults,
    allSongs,
    setFocusedSong,
    setCameraTarget,
    currentTrack,
    setCurrentTrack,
    spotifyDeviceId,
    isPremium,
    volume,
    setProgress,
    setIsLyricsOpen,
    connectedProviders,
    sphereSource,
    setPlaybackQueue,
  } = useAppStore();

  const [spotifyResults, setSpotifyResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSearchOpen, setIsSearchOpen]);

  // Animate open/close
  useEffect(() => {
    if (isSearchOpen) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(
        panelRef.current,
        { y: -20, xPercent: -50, opacity: 0, scale: 0.98 },
        { y: 0, xPercent: -50, opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setSpotifyResults([]);
    }
  }, [isSearchOpen, setSearchQuery, setSearchResults]);

  // Search logic — filter local songs + optional Spotify search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        setSearchResults([]);
        setSpotifyResults([]);
        return;
      }

      // Local filter: songs in the sphere
      const q = query.toLowerCase();
      const localMatches = allSongs
        .filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            s.album.toLowerCase().includes(q)
        )
        .map((s) => s.id);

      setSearchResults(localMatches);

      // Navigate camera to first match
      if (localMatches.length > 0) {
        const firstMatch = allSongs.find((s) => s.id === localMatches[0]);
        if (firstMatch) {
          setCameraTarget(firstMatch.position);
        }
      }

      // Debounced multi-catalog search
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        const searchPromises: Promise<void>[] = [];

        if (connectedProviders.spotify) {
          searchPromises.push(
            spotifyApi.search(query, 5)
              .then((results) => setSpotifyResults(results.tracks))
              .catch(() => setSpotifyResults([]))
          );
        } else {
          setSpotifyResults([]);
        }

        await Promise.all(searchPromises);
        setIsSearching(false);
      }, 500);
    },
    [allSongs, setSearchQuery, setSearchResults, setCameraTarget, connectedProviders]
  );

  const handlePlaySong = useCallback(
    async (song: SpatialTrack) => {
      setCurrentTrack(song);
      setFocusedSong(song);
      setCameraTarget(song.position);
      setProgress(0);
      setIsLyricsOpen(true);
      setIsSearchOpen(false);

      // Set playbackQueue to the active sphere list when playing a song from sphere search results
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
        console.error('[SpatialSearch] Play error:', err);
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
      setIsSearchOpen,
      setPlaybackQueue,
    ]
  );

  const handlePlayCatalogSong = useCallback(
    async (track: Track) => {
      const spatialTrack: SpatialTrack = {
        ...track,
        position: [0, 0, 0],
        theta: 0,
        phi: 0,
        radius: 0,
        glowColor: track.accentColor,
        scale: 1,
        index: -1,
        source: 'Search Result',
      };

      // Set queue to the corresponding search catalog results category
      let queueResults: Track[] = [];
      if (track.provider === 'spotify') queueResults = spotifyResults;

      const spatialQueue: SpatialTrack[] = queueResults.map((t) => ({
        ...t,
        position: [0, 0, 0],
        theta: 0,
        phi: 0,
        radius: 0,
        glowColor: t.accentColor,
        scale: 1,
        index: -1,
        source: 'Search Result',
      }));

      const activeQueue = spatialQueue.length > 0 ? spatialQueue : [spatialTrack];
      setPlaybackQueue(activeQueue);

      await handlePlaySong(spatialTrack);
    },
    [handlePlaySong, spotifyResults, setPlaybackQueue]
  );

  if (!isSearchOpen) return null;

  const localMatches = allSongs.filter((s) =>
    searchQuery.trim()
      ? s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
      : false
  );

  return (
    <div className="fixed inset-0 z-50 hud-interactive">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsSearchOpen(false)}
      />

      {/* Search panel */}
      <div
        ref={panelRef}
        className="absolute top-[15%] left-1/2 w-full max-w-xl z-10"
        style={{ transform: 'translateX(-50%)' }}
      >
        <div className="glass rounded-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[#8E8E93] shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search your universe..."
              className="flex-1 bg-transparent text-white text-base outline-none placeholder-[#48484A] font-light"
            />
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5">
              <span className="text-[9px] font-mono text-[#48484A]">ESC</span>
            </div>
          </div>

          {/* Results */}
          {searchQuery.trim() && (
            <div className="max-h-[400px] overflow-y-auto">
              {/* Local matches (in sphere) */}
              {localMatches.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-mono text-[#48484A] uppercase tracking-widest px-1 mb-2">
                    In Your Universe · {localMatches.length} found
                  </p>
                  {localMatches.slice(0, 8).map((song) => (
                    <button
                      key={song.id}
                      onClick={() => handlePlaySong(song)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer group"
                    >
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate font-medium">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-[#8E8E93] truncate">
                          {song.artist} · {song.album}
                        </p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: song.accentColor }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Spotify catalog results */}
              {connectedProviders.spotify && spotifyResults.length > 0 && (
                <div className="px-4 py-2 border-t border-white/5">
                  <p className="text-[10px] font-mono text-[#1DB954] uppercase tracking-widest px-1 mb-2">
                    Spotify Catalog
                  </p>
                  {spotifyResults.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => handlePlayCatalogSong(song)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer group"
                    >
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0 animate-fade-in"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate font-medium">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-[#8E8E93] truncate font-light">
                          {song.artist}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}



              {/* No results */}
              {localMatches.length === 0 &&
                spotifyResults.length === 0 &&
                !isSearching && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-[#48484A]">
                      No songs found in your universe or catalogs
                    </p>
                  </div>
                )}

              {/* Loading */}
              {isSearching && (
                <div className="px-5 py-4 text-center">
                  <p className="text-xs text-[#48484A] font-mono animate-pulse">
                    Searching Spotify catalog...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!searchQuery.trim() && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-[#48484A] font-light">
                Type to search your music universe
              </p>
              <p className="text-[10px] text-[#2C2C2E] font-mono mt-2">
                Songs will illuminate in 3D as you type
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
