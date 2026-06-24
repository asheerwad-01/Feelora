'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Now Playing HUD
// Floating glassmorphism playback controls
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

import { useAppStore } from '@/store/useAppStore';
import { useAudioStore } from '@/store/useAudioStore';
import { spotifyPlayer } from '@/services/spotify/spotifyPlayer';
import { playbackController } from '@/services/audio/playbackController';

export function NowPlayingHUD() {
  const {
    currentTrack,
    allSongs,
    isPlaying,
    progress,
    volume,
    setIsPlaying,
    setProgress,
    setVolume,
    spotifyDeviceId,
    isPremium,
    isLyricsOpen,
    setIsLyricsOpen,
    isFocusMode,
    setIsFocusMode,
    setFocusedSong,
    setCameraTarget,
    setCurrentTrack,
    playbackQueue,
  } = useAppStore();

  const energy = useAudioStore((s) => s.energy);

  const panelRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLImageElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (currentTrack && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, [currentTrack?.id]);

  // Audio-reactive artwork glow
  useEffect(() => {
    if (artworkRef.current && isPlaying) {
      const glowSize = 20 + energy * 30;
      artworkRef.current.style.boxShadow = `0 0 ${glowSize}px ${currentTrack?.accentColor || '#0A84FF'}40`;
    }
  }, [energy, isPlaying, currentTrack]);

  const handleTogglePlay = useCallback(async () => {
    if (!currentTrack) return;

    const isSpotify = !!(currentTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
    if (isPlaying) {
      await playbackController.pause(isSpotify);
    } else {
      await playbackController.resume(isSpotify, currentTrack.title);
    }
  }, [currentTrack, isPlaying, spotifyDeviceId, isPremium]);

  const handleNext = useCallback(async () => {
    const queue = allSongs;
    if (!currentTrack || queue.length === 0) return;

    let nextIndex = 0;
    const currentIndex = queue.findIndex((s) => s.id === currentTrack.id);
    if (currentIndex !== -1) {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    const nextTrack = queue[nextIndex];
    setCurrentTrack(nextTrack);
    setFocusedSong(nextTrack);
    setProgress(0);

    try {
      await playbackController.play(
        nextTrack,
        spotifyDeviceId,
        isPremium,
        volume
      );
    } catch (err) {
      console.error('[NowPlayingHUD] Next track play error:', err);
    }
  }, [
    currentTrack,
    allSongs,
    playbackQueue,
    spotifyDeviceId,
    isPremium,
    volume,
    setCurrentTrack,
    setFocusedSong,
    setCameraTarget,
    setProgress,
  ]);

  const handlePrev = useCallback(async () => {
    const queue = allSongs;
    if (!currentTrack || queue.length === 0) return;

    let prevIndex = queue.length - 1;
    const currentIndex = queue.findIndex((s) => s.id === currentTrack.id);
    if (currentIndex !== -1) {
      prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    }

    const prevTrack = queue[prevIndex];
    setCurrentTrack(prevTrack);
    setFocusedSong(prevTrack);
    setProgress(0);

    try {
      await playbackController.play(
        prevTrack,
        spotifyDeviceId,
        isPremium,
        volume
      );
    } catch (err) {
      console.error('[NowPlayingHUD] Prev track play error:', err);
    }
  }, [
    currentTrack,
    allSongs,
    playbackQueue,
    spotifyDeviceId,
    isPremium,
    volume,
    setCurrentTrack,
    setFocusedSong,
    setCameraTarget,
    setProgress,
  ]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!currentTrack || !progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      const seekTime = pct * currentTrack.duration;
      
      const isSpotify = !!(currentTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
      playbackController.seek(seekTime, isSpotify);
    },
    [currentTrack, spotifyDeviceId, isPremium]
  );

  const handleFlyToSong = useCallback(() => {
    if (currentTrack) {
      setFocusedSong(currentTrack);
      setCameraTarget(currentTrack.position);
    }
  }, [currentTrack, setFocusedSong, setCameraTarget]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const progressPct = currentTrack.duration > 0 ? (progress / currentTrack.duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-4 md:bottom-8 z-30 hud-interactive"
      style={{ left: '50%', transform: 'translateX(-50%)' }}
    >
      <div
        ref={panelRef}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl p-2 pb-3 md:px-6 md:py-4 w-[95vw] md:w-[520px] max-w-[620px] flex flex-col gap-2 md:gap-3 relative overflow-hidden"
      >
        {/* Top Row: Artwork, Playback Controls, Volume/Toggles */}
        <div className="flex items-center justify-between w-full">
          
          {/* Left: Artwork + Track details */}
          <div className="flex items-center gap-2 md:gap-3 w-[130px] md:w-[160px] shrink-0 min-w-0">
            <div
              className="relative w-9 h-9 md:w-12 md:h-12 rounded-md md:rounded-lg overflow-hidden shrink-0 cursor-pointer group"
              onClick={handleFlyToSong}
            >
              {currentTrack.coverUrl ? (
                <img
                  ref={artworkRef}
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#8E8E93]">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[6px] md:text-[8px] font-mono text-white/80 tracking-widest uppercase">Fly To</span>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="text-xs md:text-sm font-semibold text-white truncate">
                {currentTrack.title}
              </h3>
              <p className="text-[9px] md:text-[10px] text-[#8E8E93] font-mono truncate mt-0.5 tracking-wide uppercase">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2 md:gap-4 justify-center flex-1">
            <button onClick={handlePrev} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/5 transition-all cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="md:w-[14px] md:h-[14px]">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button onClick={handleTogglePlay} className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer" style={{ boxShadow: `0 0 16px ${currentTrack.accentColor}40` }}>
              {isPlaying ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="md:w-[15px] md:h-[15px]"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="md:w-[15px] md:h-[15px]"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={handleNext} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/5 transition-all cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="md:w-[14px] md:h-[14px]">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Right: Volume & Toggles */}
          <div className="flex items-center gap-1 md:gap-3 justify-end w-auto md:w-[160px] shrink-0">
            <div className="items-center gap-1.5 hidden md:flex">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8E8E93]">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); const isSpotify = !!(currentTrack?.isSpotifyTrack && spotifyDeviceId && isPremium); playbackController.setVolume(v, isSpotify); }} className="w-12 h-1 accent-white" />
            </div>

            <div className="flex items-center gap-0.5">
              <button onClick={() => setIsLyricsOpen(!isLyricsOpen)} className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isLyricsOpen ? 'bg-[#0A84FF]/20 text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white hover:bg-white/5'}`} title="Lyrics">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[13px] md:h-[13px]"><path d="M4 6h16M4 10h12M4 14h16M4 18h8" /></svg>
              </button>
              <button onClick={() => setIsFocusMode(!isFocusMode)} className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isFocusMode ? 'bg-[#BF5AF2]/20 text-[#BF5AF2]' : 'text-[#8E8E93] hover:text-white hover:bg-white/5'}`} title="Focus Mode">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[13px] md:h-[13px]"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Progress */}
        <div className="w-full px-1 md:px-4 flex items-center gap-2 md:gap-3 mt-1 md:mt-0">
          <span className="text-[9px] md:text-[10px] font-mono text-[#8E8E93] w-7 md:w-8 text-right shrink-0">{formatTime(progress)}</span>
          <div ref={progressBarRef} className="flex-1 py-1 cursor-pointer relative group" onClick={handleSeek}>
            <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-100" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${currentTrack.accentColor}, ${currentTrack.accentColor}80)` }} />
            </div>
            <div className="absolute top-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110 pointer-events-none" style={{ left: `${progressPct}%`, transform: 'translate(-50%, -50%)', boxShadow: `0 0 10px ${currentTrack.accentColor}60` }} />
          </div>
          <span className="text-[9px] md:text-[10px] font-mono text-[#8E8E93] w-7 md:w-8 shrink-0">{formatTime(currentTrack.duration)}</span>
        </div>
      </div>
    </div>
  );
}
