'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Library Panel
// Floating glassmorphic panel list for Liked Songs & Playlists
// ─────────────────────────────────────────────────────────────

import { useMemo, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { playbackController } from '@/services/audio/playbackController';
import type { SpatialTrack } from '@/types';

export function LibraryPanel() {
  const {
    playlists,
    allSongs,
    currentTrack,
    isPlaying,
    setCurrentTrack,
    setFocusedSong,
    setCameraTarget,
    setProgress,
    spotifyDeviceId,
    isPremium,
    volume,
    activeTab,
    setIsLyricsOpen,
    sphereSource,
    setSphereSource,
    connectedProviders,
    setPlaybackQueue,
  } = useAppStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  const sources = useMemo(() => {
    const list = [
      { id: 'all', name: 'All Tracks' },
      { id: 'liked', name: 'Liked Songs' },
    ];
    if (connectedProviders.spotify) {
      list.push({ id: 'Spotify', name: 'Spotify' });
    }
    return [
      ...list,
      ...playlists.map((p) => ({ id: p.id, name: p.name })),
    ];
  }, [playlists, connectedProviders]);

  const filteredSongs = useMemo(() => {
    if (sphereSource === 'all') return allSongs;
    const searchVal = sphereSource === 'liked' ? 'Liked Songs' : sphereSource;
    return allSongs.filter((song) =>
      song.sources ? song.sources.includes(searchVal) : song.source === searchVal
    );
  }, [allSongs, sphereSource]);

  const handlePlay = async (song: SpatialTrack) => {
    setCurrentTrack(song);
    setFocusedSong(song);
    setCameraTarget(song.position);
    setProgress(0);
    setIsLyricsOpen(true); // Auto-open lyrics panel on playing a track
    setPlaybackQueue(filteredSongs);

    try {
      await playbackController.play(song, spotifyDeviceId, isPremium, volume);
    } catch (err) {
      console.error('[LibraryPanel] Play error:', err);
    }
  };

  if (activeTab !== 'library') return null;

  return (
    <div className="fixed top-24 left-6 bottom-28 w-[380px] z-30 flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden animate-fade-in hud-interactive">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <span className="text-[10px] font-mono text-[#8E8E93] tracking-widest uppercase">Your Library</span>
        <h2 className="text-xl font-semibold text-white mt-1">Music Universe</h2>

        {/* Source Filter Capsule List */}
        <div className="relative mt-4 flex items-center group">
          <button 
            onClick={scrollLeft}
            className="absolute left-0 z-10 w-8 h-full flex items-center justify-center bg-gradient-to-r from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          
          <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-2 flex-1 scroll-smooth">
            {sources.map((src) => (
              <button
                key={src.id}
                onClick={() => setSphereSource(src.id)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                  sphereSource === src.id
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/5 text-[#8E8E93] hover:text-white hover:bg-white/10'
                }`}
              >
                {src.name}
              </button>
            ))}
          </div>

          <button 
            onClick={scrollRight}
            className="absolute right-0 z-10 w-8 h-full flex items-center justify-center bg-gradient-to-l from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 scrollbar-thin">
        {filteredSongs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <p className="text-sm text-[#8E8E93] font-mono">No tracks found.</p>
          </div>
        ) : (
          filteredSongs.map((song) => {
            const isCurrent = currentTrack?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => handlePlay(song)}
                className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-white/10 border-white/10 shadow-lg'
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Cover Artwork or Accent Gradient */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt="" className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, #1c1c1e, ${song.accentColor})`,
                        }}
                      >
                        <span className="text-[12px] opacity-40">♫</span>
                      </div>
                    )}
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-end gap-[2px] w-4.5 h-4.5 pb-0.5">
                          <span className="w-[2px] bg-white animate-music-bar-1" style={{ height: '60%' }} />
                          <span className="w-[2px] bg-white animate-music-bar-2" style={{ height: '30%' }} />
                          <span className="w-[2px] bg-white animate-music-bar-3" style={{ height: '80%' }} />
                        </div>
                      </div>
                    )}
                    {/* Provider brand badge */}
                    {song.provider && song.provider !== 'demo' && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl-md bg-black/80 flex items-center justify-center border-l border-t border-white/5">
                        {song.provider === 'spotify' && (
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.4c-.18.27-.53.37-.8.18-2.22-1.36-5.02-1.67-8.31-.92-.3.07-.6-.12-.67-.42-.07-.3.12-.6.42-.67 3.61-.83 6.71-.48 9.18 1.03.27.18.36.53.18.8zm1.2-2.7c-.22.36-.7.48-1.06.26-2.54-1.56-6.42-2.01-9.42-1.1-.4.12-.82-.12-.94-.52-.12-.4.12-.82.52-.94 3.44-1.04 7.72-.53 10.64 1.26.36.22.48.7.26 1.06zm.12-2.82c-3.05-1.81-8.08-1.98-11-1.09-.47.14-.97-.13-1.11-.6-.14-.47.13-.97.6-1.11 3.36-1.02 8.91-.82 12.44 1.28.42.25.56.79.31 1.21-.25.42-.79.56-1.21.31z"/></svg>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-[#0A84FF]' : 'text-white'}`}>
                      {song.title}
                    </p>
                    <p className="text-xs text-[#8E8E93] truncate mt-0.5 font-light">{song.artist}</p>
                  </div>
                </div>

                <div className="shrink-0 pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow hover:scale-105 transition-all">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
