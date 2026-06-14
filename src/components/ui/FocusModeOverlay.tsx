'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Focus Mode Overlay
// Immersive 2-pane view with 3D album art and synchronized lyrics
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import gsap from 'gsap';

import { useAppStore } from '@/store/useAppStore';
import { useAudioStore } from '@/store/useAudioStore';
import { fetchLyrics } from '@/services/lyrics/lyricsService';
import { playbackController } from '@/services/audio/playbackController';
import type { LyricsData } from '@/types';

export function FocusModeOverlay() {
  const {
    isFocusMode,
    setIsFocusMode,
    currentTrack,
    isPlaying,
    progress,
    volume,
    setIsPlaying,
    spotifyDeviceId,
    isPremium,
    playbackQueue,
    allSongs,
    setCurrentTrack,
    setFocusedSong,
    setCameraTarget,
    setProgress
  } = useAppStore();

  const energy = useAudioStore((s) => s.energy);

  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLImageElement>(null);
  const linesContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Lyrics ───
  useEffect(() => {
    if (!isFocusMode || !currentTrack) return;

    setIsLoading(true);
    fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration)
      .then((data) => {
        setLyrics(data);
        setIsLoading(false);
      })
      .catch(() => {
        setLyrics(null);
        setIsLoading(false);
      });
  }, [currentTrack?.id, isFocusMode]);

  // ─── Animations ───
  useEffect(() => {
    if (isFocusMode && overlayRef.current) {
      // "Sucked into" entrance animation: wait for 3D camera to zoom
      gsap.fromTo(
        overlayRef.current,
        { scale: 1.2, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 }
      );
    }
  }, [isFocusMode]);

  useEffect(() => {
    if (isFocusMode && coverRef.current) {
      // Floating / breathing 3D cover effect
      gsap.to(coverRef.current, {
        y: -15,
        rotationX: 2,
        rotationY: -2,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
    
    return () => {
      if (coverRef.current) gsap.killTweensOf(coverRef.current);
    };
  }, [isFocusMode, currentTrack?.id]);

  useEffect(() => {
    if (coverRef.current && isPlaying) {
      // Audio reactive glow
      const glowSize = 30 + energy * 50;
      coverRef.current.style.boxShadow = `0 20px ${glowSize}px ${currentTrack?.accentColor || '#0A84FF'}40`;
    }
  }, [energy, isPlaying, currentTrack?.accentColor]);

  // ─── Lyrics Syncing ───
  const currentLineIndex = useMemo(() => {
    if (!lyrics || !lyrics.lines.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= progress) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyrics, progress]);

  useEffect(() => {
    if (currentLineRef.current && linesContainerRef.current) {
      const container = linesContainerRef.current;
      const line = currentLineRef.current;
      const containerHeight = container.clientHeight;
      const lineTop = line.offsetTop;
      const lineHeight = line.clientHeight;
      const targetScroll = lineTop - containerHeight / 2 + lineHeight / 2;

      gsap.to(container, {
        scrollTop: targetScroll,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  }, [currentLineIndex]);

  const handleLineClick = async (time: number) => {
    if (!currentTrack) return;
    const isSpotify = !!(currentTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
    try {
      await playbackController.seek(time, isSpotify);
    } catch (err) {
      console.warn('Seek error:', err);
    }
  };

  // ─── Playback Controls ───
  const handleTogglePlay = async () => {
    if (!currentTrack) return;
    const isSpotify = !!(currentTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
    try {
      if (isPlaying) {
        await playbackController.pause(isSpotify);
        setIsPlaying(false);
      } else {
        await playbackController.resume(isSpotify, currentTrack.title);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Toggle play error:', error);
    }
  };

  const handleNext = async () => {
    const queue = playbackQueue.length > 0 ? playbackQueue : allSongs;
    if (!currentTrack || queue.length === 0) return;

    let nextIndex = 0;
    const currentIndex = queue.findIndex((s) => s.id === currentTrack.id);
    if (currentIndex !== -1) {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    const nextTrack = queue[nextIndex];
    setCurrentTrack(nextTrack);
    setFocusedSong(nextTrack);
    setCameraTarget(nextTrack.position);
    setProgress(0);

    const isSpotify = !!(nextTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
    try {
      await playbackController.play(
        nextTrack,
        spotifyDeviceId,
        isPremium,
        volume
      );
    } catch (err) {
      console.error('Next track error:', err);
    }
  };

  const handlePrev = async () => {
    const queue = playbackQueue.length > 0 ? playbackQueue : allSongs;
    if (!currentTrack || queue.length === 0) return;

    let prevIndex = queue.length - 1;
    const currentIndex = queue.findIndex((s) => s.id === currentTrack.id);
    if (currentIndex !== -1) {
      prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    }

    const prevTrack = queue[prevIndex];
    setCurrentTrack(prevTrack);
    setFocusedSong(prevTrack);
    setCameraTarget(prevTrack.position);
    setProgress(0);

    const isSpotify = !!(prevTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
    try {
      await playbackController.play(
        prevTrack,
        spotifyDeviceId,
        isPremium,
        volume
      );
    } catch (err) {
      console.error('Previous track error:', err);
    }
  };

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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!isFocusMode || !currentTrack) return null;

  const progressPct = currentTrack.duration > 0 ? (progress / currentTrack.duration) * 100 : 0;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-[#030308]/85 backdrop-blur-3xl flex items-center justify-center pointer-events-auto origin-center"
      style={{ perspective: '1000px' }}
    >
      {/* Background glow matching cover art */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000"
        style={{ background: `radial-gradient(circle at 30% 50%, ${currentTrack.accentColor || '#0A84FF'} 0%, transparent 60%)` }}
      />

      {/* Exit Button */}
      <button
        onClick={() => setIsFocusMode(false)}
        className="absolute top-8 right-12 z-50 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-[#8E8E93] hover:text-white transition-all cursor-pointer backdrop-blur-md"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="relative z-10 w-full max-w-7xl h-[85vh] flex flex-col md:flex-row gap-12 md:gap-24 px-8 md:px-16 items-center">
        
        {/* Left Pane: Album Cover */}
        <div className="flex-1 flex items-center justify-center w-full max-w-[500px] shrink-0" style={{ transformStyle: 'preserve-3d' }}>
          {currentTrack.coverUrl ? (
            <img
              ref={coverRef}
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              crossOrigin="anonymous"
              className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
              style={{
                boxShadow: `0 30px 60px rgba(0,0,0,0.6), 0 0 40px ${currentTrack.accentColor || '#0A84FF'}30`
              }}
            />
          ) : (
            <div 
              ref={coverRef as any}
              className="w-full aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <span className="text-white/20 font-mono">NO COVER</span>
            </div>
          )}
        </div>

        {/* Right Pane: Lyrics & Player */}
        <div className="flex-1 flex flex-col h-full py-8 min-w-0 w-full">
          
          {/* Header Info */}
          <div className="mb-8 shrink-0">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight truncate font-['SF_Pro_Display',-apple-system,sans-serif]">
              {currentTrack.title}
            </h2>
            <p className="text-xl md:text-2xl text-white/60 font-light mt-2 truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Lyrics Scroller */}
          <div 
            ref={linesContainerRef}
            className="flex-1 overflow-y-auto pr-4 mb-8 scroll-smooth"
            style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
          >
            {isLoading ? (
              <div className="flex h-full items-center">
                <p className="text-white/40 font-mono animate-pulse">Finding lyrics...</p>
              </div>
            ) : (!lyrics || lyrics.lines.length === 0) ? (
              <div className="flex h-full items-center">
                <p className="text-white/40 font-mono">No lyrics available</p>
              </div>
            ) : (
              <div className="space-y-6 pb-32 pt-16">
                {lyrics.lines.map((line, i) => {
                  const isCurrent = i === currentLineIndex;
                  const isPast = i < currentLineIndex;
                  return (
                    <div
                      key={i}
                      ref={isCurrent ? currentLineRef : null}
                      onClick={() => handleLineClick(line.time)}
                      className="cursor-pointer transition-all duration-500 group origin-left"
                      style={{
                        opacity: isCurrent ? 1 : isPast ? 0.3 : 0.5,
                        transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <p
                        className={`transition-all duration-500 leading-snug font-['SF_Pro_Display',-apple-system,sans-serif] ${
                          isCurrent ? 'text-3xl md:text-4xl font-bold text-white' : 'text-2xl md:text-3xl font-medium text-white/70 group-hover:text-white/90'
                        }`}
                        style={isCurrent ? { textShadow: `0 0 20px ${currentTrack.accentColor || '#ffffff'}40` } : undefined}
                      >
                        {line.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sleek Mini-HUD Player */}
          <div className="shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-[#8E8E93] w-10">{formatTime(progress)}</span>
              
              {/* Progress Bar */}
              <div 
                ref={progressBarRef}
                className="flex-1 mx-4 h-1.5 bg-black/50 rounded-full overflow-hidden cursor-pointer group relative"
                onClick={handleSeek}
              >
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-white group-hover:bg-[#30D158] transition-colors"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              
              <span className="text-[10px] font-mono text-[#8E8E93] w-10 text-right">{formatTime(currentTrack.duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button onClick={handlePrev} className="text-[#8E8E93] hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </button>
              
              <button 
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                style={{ boxShadow: `0 0 20px ${currentTrack.accentColor || '#ffffff'}40` }}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              
              <button onClick={handleNext} className="text-[#8E8E93] hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6v12h2V6zm3.5 6l8.5 6V6z" /></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
