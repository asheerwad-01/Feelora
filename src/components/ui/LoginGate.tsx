'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Login Gate Dashboard
// Premium multi-service connection dashboard
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { spotifyAuth } from '@/services/spotify/spotifyAuth';
import { useAppStore } from '@/store/useAppStore';
import { SnowParticles } from '@/components/ui/SnowParticles';

export function LoginGate({ onEnterDemo }: { onEnterDemo: () => void }) {
  console.log('[LoginGate] Rendered');
  
  const { 
    connectedProviders, 
    setProviderConnected, 
    setHasLaunchedUniverse,
    hasLaunchedUniverse
  } = useAppStore();

  const [showClientIdInput, setShowClientIdInput] = useState(false);
  const [clientId, setClientId] = useState('');
  

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  // Subtle Floating Animation for the logo
  useEffect(() => {
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        y: -12,
        duration: 3.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
  }, []);

  // Sync Spotify OAuth state on mount / update
  useEffect(() => {
    const isSpotifyLoggedIn = spotifyAuth.isLoggedIn();
    if (isSpotifyLoggedIn && !connectedProviders.spotify) {
      setProviderConnected('spotify', true);
      setHasLaunchedUniverse(true);
      localStorage.setItem('feelora_has_launched', 'true');
    } else if (!isSpotifyLoggedIn && connectedProviders.spotify) {
      setProviderConnected('spotify', false);
    }
  }, [connectedProviders.spotify, setProviderConnected, setHasLaunchedUniverse]);

  // Check if we should automatically launch (e.g. if already launched in localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyLaunched = localStorage.getItem('feelora_has_launched') === 'true';
      const isAnyConnected = spotifyAuth.isLoggedIn();
      if (alreadyLaunched && isAnyConnected) {
        console.log('[LoginGate] Auto-launching active session');
        setHasLaunchedUniverse(true);
      }
    }
  }, [connectedProviders, setHasLaunchedUniverse]);

  // Entrance animations
  useEffect(() => {
    console.log('[LoginGate] Mounted - starting dashboard animations');
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(
      orbsRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 2 }
    );
    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.2 },
      '-=1.5'
    );
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1 },
      '-=0.8'
    );
    tl.fromTo(
      dashboardRef.current,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8 },
      '-=0.5'
    );
  }, []);

  const handleConnectSpotify = async () => {
    const existingId = spotifyAuth.getEffectiveClientId();
    if (!existingId) {
      setShowClientIdInput(true);
      return;
    }
    await spotifyAuth.login();
  };

  const handleDisconnectSpotify = () => {
    spotifyAuth.logout();
    setProviderConnected('spotify', false);
  };

  const handleSubmitClientId = async () => {
    if (clientId.trim()) {
      spotifyAuth.setCustomClientId(clientId.trim());
      await spotifyAuth.login();
    }
  };



  const handleEnterUniverse = () => {
    localStorage.setItem('feelora_has_launched', 'true');
    setHasLaunchedUniverse(true);
  };

  const isAnyConnected = connectedProviders.spotify;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-y-auto py-10"
    >
      <SnowParticles />

      {/* Animated background orbs */}
      <div ref={orbsRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#0A84FF]/5 blur-[120px] animate-breathe" />
        <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-[#BF5AF2]/5 blur-[100px] animate-breathe" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FF2D55]/3 blur-[110px] animate-breathe" style={{ animationDelay: '6s' }} />
      </div>

      <div className="relative z-10 text-center max-w-4xl px-6 mx-auto w-full pt-8">
        {/* Hero Logo */}
        <div className="mb-2 flex justify-center relative">
          <img 
            ref={logoRef}
            src="/Feelora.webp" 
            alt="Feelora Logo" 
            className="w-64 h-64 md:w-[380px] md:h-[380px] object-cover relative z-10 drop-shadow-[0_0_50px_rgba(255,255,255,0.35)]"
            style={{
              maskImage: 'radial-gradient(circle, black 50%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 100%)'
            }}
          />
        </div>

        <p className="text-[11px] font-mono tracking-[0.5em] uppercase text-[#8E8E93] mb-2 select-none opacity-80">
          SPATIAL MUSIC UNIVERSE
        </p>

        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-2 leading-[1.0] select-none font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,system-ui,sans-serif]"
        >
          Feelora
        </h1>

        <p
          ref={subtitleRef}
          className="text-sm md:text-base text-[#8E8E93] font-light mb-6 leading-relaxed max-w-md mx-auto"
        >
          Step inside your 3D music universe. Every song becomes a star in your personal galaxy, ready to be explored from the center.
        </p>

        {!showClientIdInput ? (
          <div ref={dashboardRef} className="flex flex-col items-center gap-5 mt-6 max-w-[280px] mx-auto w-full">
            
            <button
              onClick={handleConnectSpotify}
              className="group flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-[12px] tracking-[0.1em] uppercase transition-all duration-300 shadow-[0_0_20px_rgba(29,185,84,0.3)] hover:shadow-[0_0_30px_rgba(29,185,84,0.5)] cursor-pointer hover:-translate-y-0.5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.4c-.18.27-.53.37-.8.18-2.22-1.36-5.02-1.67-8.31-.92-.3.07-.6-.12-.67-.42-.07-.3.12-.6.42-.67 3.61-.83 6.71-.48 9.18 1.03.27.18.36.53.18.8zm1.2-2.7c-.22.36-.7.48-1.06.26-2.54-1.56-6.42-2.01-9.42-1.1-.4.12-.82-.12-.94-.52-.12-.4.12-.82.52-.94 3.44-1.04 7.72-.53 10.64 1.26.36.22.48.7.26 1.06zm.12-2.82c-3.05-1.81-8.08-1.98-11-1.09-.47.14-.97-.13-1.11-.6-.14-.47.13-.97.6-1.11 3.36-1.02 8.91-.82 12.44 1.28.42.25.56.79.31 1.21-.25.42-.79.56-1.21.31z"/>
              </svg>
              <span>Connect Spotify</span>
            </button>

            <button
              onClick={onEnterDemo}
              className="relative w-full px-6 py-3.5 rounded-full font-bold text-[10px] tracking-[0.2em] uppercase transition-all duration-500 cursor-pointer text-white/60 hover:text-white border border-white/10 hover:border-white/30 bg-black/50 overflow-hidden group shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
            >
              {/* Edge Lighting Sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              {/* Inner Glow */}
              <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] rounded-full group-hover:shadow-[inset_0_0_25px_rgba(255,255,255,0.15)] transition-shadow duration-500" />
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                Explore Demo Universe <span className="text-sm leading-none group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
          </div>
        ) : (
          /* Client ID Input for Spotify */
          <div className="space-y-4 max-w-sm mx-auto animate-fade-in bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-3xl">
            <p className="text-xs text-[#8E8E93] font-mono">
              Enter your Spotify Developer Client ID
            </p>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Paste your Client ID here..."
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-[#48484A] focus:outline-none focus:border-[#0A84FF]/50 focus:ring-1 focus:ring-[#0A84FF]/30 transition-all font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitClientId()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowClientIdInput(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/10 text-[#8E8E93] text-sm hover:text-white transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmitClientId}
                className="flex-1 px-5 py-3 rounded-xl bg-[#0A84FF] text-white text-sm font-semibold hover:bg-[#0A84FF]/90 active:scale-95 transition-all cursor-pointer"
              >
                Connect
              </button>
            </div>
            <p className="text-[10px] text-[#48484A] font-mono leading-relaxed text-left">
              Get one at{' '}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0A84FF] hover:underline"
              >
                developer.spotify.com/dashboard
              </a>
              . Create an app and add{' '}
              <code className="text-[#64D2FF]">http://127.0.0.1:3000</code>{' '}
              as a redirect URI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
