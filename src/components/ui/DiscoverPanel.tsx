'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Discover Panel
// Floating glassmorphic panel list for Curated & Algorithmic feeds
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { playbackController } from '@/services/audio/playbackController';
import type { SpatialTrack } from '@/types';

export function DiscoverPanel() {
  const {
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
    setPlaybackQueue,
  } = useAppStore();

  // Pick a few stable mock collections from allSongs for curated look
  const featuredSuites = useMemo(() => {
    if (allSongs.length === 0) return [];
    
    // Choose 3 distinct tracks from allSongs to act as "Suites"
    const suiteIndices = [5, 12, 25];
    return suiteIndices
      .map(idx => allSongs[idx % allSongs.length])
      .filter(Boolean);
  }, [allSongs]);

  const recommendedTracks = useMemo(() => {
    if (allSongs.length < 10) return allSongs;
    // Return a slice of 10 tracks starting from index 30 for algorithmic feed
    return allSongs.slice(30, 40);
  }, [allSongs]);

  const handlePlay = async (song: SpatialTrack) => {
    setCurrentTrack(song);
    setFocusedSong(song);
    setCameraTarget(song.position);
    setProgress(0);
    setIsLyricsOpen(true); // Auto-open lyrics panel on playing a track
    setPlaybackQueue(allSongs);

    try {
      await playbackController.play(song, spotifyDeviceId, isPremium, volume);
    } catch (err) {
      console.error('[DiscoverPanel] Play error:', err);
    }
  };

  if (activeTab !== 'discover') return null;

  return (
    <div className="fixed top-24 left-6 bottom-28 w-[380px] z-30 flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden animate-fade-in hud-interactive">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <span className="text-[10px] font-mono text-[#8E8E93] tracking-widest uppercase">Algorithmic Curation</span>
        <h2 className="text-xl font-semibold text-white mt-1">Discover Space</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 scrollbar-thin">
        {/* Curated featured suites */}
        {featuredSuites.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#0A84FF] font-semibold pl-1">
              Featured Suites
            </h3>
            <div className="space-y-3">
              {featuredSuites.map((song) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={`suite-${song.id}`}
                    onClick={() => handlePlay(song)}
                    className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full border border-white/10 group cursor-pointer shadow-lg"
                  >
                    {/* Background accent color gradient */}
                    <div
                      className="absolute inset-0 opacity-80 group-hover:scale-105 transition-transform duration-700"
                      style={{
                        background: `linear-gradient(135deg, ${song.accentColor}dd, ${song.secondaryColor}bb)`,
                      }}
                    />
                    {/* Text overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                      <span className="text-[8px] font-mono tracking-widest text-white/50 uppercase">SONIC ARCHITECTURE</span>
                      <h4 className="text-base font-bold text-white mt-0.5 truncate">{song.title}</h4>
                      <p className="text-[11px] text-white/70 truncate">{song.artist}</p>
                    </div>
                    {/* Hover play button */}
                    <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end gap-[1.5px] w-3 h-3 pb-0.5">
                          <span className="w-[1.5px] h-3 bg-black animate-music-bar-1" />
                          <span className="w-[1.5px] h-1.5 bg-black animate-music-bar-2" />
                          <span className="w-[1.5px] h-4 bg-black animate-music-bar-3" />
                        </div>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Algorithmic recommended feed */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#BF5AF2] font-semibold pl-1">
            Tailored For You
          </h3>
          <div className="space-y-1.5">
            {recommendedTracks.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              return (
                <div
                  key={`rec-${song.id}`}
                  onClick={() => handlePlay(song)}
                  className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer border transition-all duration-300 ${
                    isCurrent
                      ? 'bg-white/10 border-white/10 shadow-lg'
                      : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
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
                      <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-[#BF5AF2]' : 'text-white'}`}>
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
