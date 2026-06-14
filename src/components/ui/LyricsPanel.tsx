'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Lyrics Panel
// Cinematic synchronized lyrics experience
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect, useState, useMemo } from 'react';
import gsap from 'gsap';

import { useAppStore } from '@/store/useAppStore';
import { fetchLyrics } from '@/services/lyrics/lyricsService';
import { playbackController } from '@/services/audio/playbackController';
import type { LyricsData } from '@/types';

export function LyricsPanel() {
  const {
    currentTrack,
    isPlaying,
    progress,
    isLyricsOpen,
    setIsLyricsOpen,
    isFocusMode,
    setIsFocusMode,
    spotifyDeviceId,
    isPremium,
  } = useAppStore();

  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const linesContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // Seek song when clicking a synced lyric line
  const handleLineClick = async (time: number) => {
    if (!currentTrack) return;
    const isSpotify = !!(currentTrack.isSpotifyTrack && spotifyDeviceId && isPremium);
    try {
      await playbackController.seek(time, isSpotify);
    } catch (err) {
      console.warn('[LyricsPanel] Seek error:', err);
    }
  };

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack) {
      setLyrics(null);
      return;
    }

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
  }, [currentTrack?.id]);

  // Find current lyric line
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

  // Scroll current line into view
  useEffect(() => {
    if (currentLineRef.current && linesContainerRef.current) {
      const container = linesContainerRef.current;
      const line = currentLineRef.current;
      const containerHeight = container.clientHeight;
      const lineTop = line.offsetTop;
      const lineHeight = line.clientHeight;

      const targetScroll = lineTop - containerHeight / 3 + lineHeight / 2;

      gsap.to(container, {
        scrollTop: targetScroll,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  }, [currentLineIndex]);

  // Panel entrance
  useEffect(() => {
    if (isLyricsOpen && panelRef.current) {
      if (isFocusMode) {
        gsap.fromTo(
          panelRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      } else {
        gsap.fromTo(
          panelRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      }
    }
  }, [isLyricsOpen, isFocusMode]);

  if (!isLyricsOpen) return null;

  return (
    <div
      className={`fixed z-30 ${
        isFocusMode
          ? 'inset-0 flex items-center justify-center pointer-events-none'
          : 'bottom-[235px] md:bottom-[255px] w-[420px] md:w-[520px] max-w-[620px] h-[420px] hud-interactive'
      }`}
      style={isFocusMode ? undefined : { left: '50%', transform: 'translateX(-50%)' }}
    >


      <div
        ref={panelRef}
        className={`relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col pointer-events-auto ${
          isFocusMode
            ? 'w-[600px] h-[70vh] max-w-[90vw]'
            : 'h-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            {currentTrack?.coverUrl && (
              <img
                src={currentTrack.coverUrl}
                alt=""
                className="w-8 h-8 rounded-lg object-cover"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest">
                {lyrics?.synced ? 'SYNCED LYRICS' : 'LYRICS'}
              </p>
              <p className="text-xs text-white/60 truncate max-w-[200px]">
                {currentTrack?.title}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsLyricsOpen(false);
              setIsFocusMode(false);
            }}
            className="w-7 h-7 rounded-full hover:bg-white/5 flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Lyrics body */}
        <div
          ref={linesContainerRef}
          className={`flex-1 overflow-y-auto px-6 scroll-smooth ${
            isFocusMode ? 'py-8' : 'py-4'
          }`}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-[#48484A] font-mono animate-pulse">
                Finding lyrics...
              </p>
            </div>
          )}

          {!isLoading && (!lyrics || lyrics.lines.length === 0) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-[#48484A]">
                  No lyrics available
                </p>
                <p className="text-[10px] text-[#2C2C2E] mt-2 font-mono">
                  {lyrics?.source || ''}
                </p>
              </div>
            </div>
          )}

          {!isLoading && lyrics && lyrics.lines.length > 0 && (
            <div className={`space-y-4 ${isFocusMode ? 'pb-32' : 'pb-16'}`}>
              {lyrics.lines.map((line, i) => {
                const isCurrent = i === currentLineIndex;
                const isPast = i < currentLineIndex;
                const isUpcoming = i > currentLineIndex;

                return (
                  <div
                    key={i}
                    ref={isCurrent ? currentLineRef : null}
                    onClick={() => handleLineClick(line.time)}
                    className="transition-all duration-500 cursor-pointer hover:scale-[1.02] active:scale-[0.98] select-none"
                    style={{
                      opacity: isCurrent ? 1 : isPast ? 0.2 : 0.4,
                      transform: isCurrent
                        ? 'scale(1)'
                        : isPast
                        ? 'scale(0.95) translateY(-2px)'
                        : 'scale(0.95)',
                    }}
                  >
                    <p
                      className={`text-center transition-all duration-500 leading-relaxed ${
                        isFocusMode
                          ? isCurrent
                            ? 'text-3xl font-bold text-white'
                            : 'text-xl font-light text-white/40'
                          : isCurrent
                          ? 'text-xl font-semibold text-white'
                          : 'text-base font-light text-white/50'
                      }`}
                      style={
                        isCurrent && currentTrack
                          ? {
                              textShadow: `0 0 30px ${currentTrack.accentColor}30`,
                            }
                          : undefined
                      }
                    >
                      {line.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Source attribution */}
        {lyrics?.source && lyrics.source !== 'unavailable' && (
          <div className="px-5 py-2 border-t border-white/5 shrink-0">
            <p className="text-[8px] font-mono text-[#2C2C2E] text-right">
              via {lyrics.source}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
