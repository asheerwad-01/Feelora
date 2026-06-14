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
  const textRef = useRef<HTMLDivElement>(null);

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

    // Animate typography with a subtle breath
    if (textRef.current) {
      const texts = textRef.current.children;
      gsap.fromTo(
        texts,
        { opacity: 0.5 },
        {
          opacity: 1,
          duration: 2,
          stagger: 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        }
      );
    }

    return () => {
      gsap.killTweensOf(dots);
      if (progressRef.current) gsap.killTweensOf(progressRef.current);
      if (textRef.current) gsap.killTweensOf(textRef.current.children);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 bg-black flex items-center justify-center"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-[#0A84FF]/5 blur-[100px] animate-breathe" />
        <div className="absolute bottom-1/3 right-1/3 w-56 h-56 rounded-full bg-[#BF5AF2]/5 blur-[80px] animate-breathe" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 text-center">
        {/* Static Logo */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <img 
            src="https://img.sanishtech.com/u/8de7d55f39754063df8be4065a78de00.png" 
            alt="Feelora Loading Logo" 
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          />
        </div>

        <div ref={textRef}>
          <p className="text-sm text-white font-medium mb-2 font-['SF_Pro_Display',-apple-system,sans-serif]">
            Building your universe
          </p>
          <p className="text-xs text-[#8E8E93] font-mono max-w-xs mx-auto px-4">
            {loadingMessage || 'Fetching your music from Spotify...'}
          </p>
        </div>

        {/* Animated dots */}
        <div ref={dotsRef} className="flex items-center justify-center gap-1.5 mt-8">
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
