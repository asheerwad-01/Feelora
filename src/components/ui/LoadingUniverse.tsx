'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Loading Universe
// Premium loading experience while data fetches
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

import { useAppStore } from '@/store/useAppStore';

export function LoadingUniverse() {
  const { isLoading, loadingMessage } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dotsRef.current) return;

    // Animate loading dots
    const dots = dotsRef.current.querySelectorAll('.loading-dot');
    gsap.fromTo(
      dots,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.15,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
      }
    );

    // Animate glowing sweep line
    if (progressRef.current) {
      gsap.fromTo(
        progressRef.current,
        { x: '-100%' },
        {
          x: '100%',
          duration: 2.5,
          repeat: -1,
          ease: 'power1.inOut',
        }
      );
    }

    // Animate central spinning orb breathing scale
    const orb = containerRef.current?.querySelector('.relative.w-20.h-20');
    if (orb) {
      gsap.to(orb, {
        scale: 1.05,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    return () => {
      gsap.killTweensOf(dots);
      if (progressRef.current) gsap.killTweensOf(progressRef.current);
      if (orb) gsap.killTweensOf(orb);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 bg-black flex items-center justify-center"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-[#0A84FF]/5 blur-[100px] animate-breathe" />
        <div className="absolute bottom-1/3 right-1/3 w-56 h-56 rounded-full bg-[#BF5AF2]/5 blur-[80px] animate-breathe" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 text-center">
        {/* Spinning orb */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border border-white/5 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
          <div className="absolute inset-4 rounded-full border border-[#0A84FF]/20 animate-spin-slow" style={{ animationDuration: '10s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#0A84FF] animate-pulse-glow" />
          </div>
        </div>

        <p className="text-sm text-white font-medium mb-2">
          Building your universe
        </p>
        <p className="text-xs text-[#8E8E93] font-mono max-w-xs mx-auto">
          {loadingMessage || 'Fetching your music from Spotify...'}
        </p>

        {/* Animated dots */}
        <div ref={dotsRef} className="flex items-center justify-center gap-1.5 mt-6">
          <div className="loading-dot w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
          <div className="loading-dot w-1.5 h-1.5 rounded-full bg-[#BF5AF2]" />
          <div className="loading-dot w-1.5 h-1.5 rounded-full bg-[#64D2FF]" />
          <div className="loading-dot w-1.5 h-1.5 rounded-full bg-[#30D158]" />
        </div>

        {/* Subtle glowing loading sweep line */}
        <div className="w-48 h-[1px] bg-white/10 mx-auto rounded-full overflow-hidden mt-6 relative">
          <div
            ref={progressRef}
            className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-[#0A84FF] to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
