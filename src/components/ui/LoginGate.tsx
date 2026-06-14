'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Login Gate Dashboard
// Premium multi-service connection dashboard
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { spotifyAuth } from '@/services/spotify/spotifyAuth';
import { useAppStore } from '@/store/useAppStore';

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
  
  // Simulated Modal States
  const [activeModal, setActiveModal] = useState<'apple' | 'youtube' | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);

  // Sync Spotify OAuth state on mount / update
  useEffect(() => {
    const isSpotifyLoggedIn = spotifyAuth.isLoggedIn();
    if (isSpotifyLoggedIn && !connectedProviders.spotify) {
      setProviderConnected('spotify', true);
    } else if (!isSpotifyLoggedIn && connectedProviders.spotify) {
      setProviderConnected('spotify', false);
    }
  }, [connectedProviders.spotify, setProviderConnected]);

  // Check if we should automatically launch (e.g. if already launched in localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyLaunched = localStorage.getItem('feelora_has_launched') === 'true';
      const isAnyConnected = spotifyAuth.isLoggedIn() || connectedProviders.appleMusic || connectedProviders.youtubeMusic;
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

  // Simulated Login Submit Handlers
  const handleOpenModal = (provider: 'apple' | 'youtube') => {
    setLoginEmail('');
    setLoginPassword('');
    setIsSubmitting(false);
    setActiveModal(provider);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    setIsSubmitting(true);

    // Simulate standard secure authorization delay
    setTimeout(() => {
      if (activeModal === 'apple') {
        setProviderConnected('appleMusic', true);
      } else if (activeModal === 'youtube') {
        setProviderConnected('youtubeMusic', true);
      }
      setIsSubmitting(false);
      setActiveModal(null);
    }, 1500);
  };

  const handleDisconnectSimulated = (provider: 'appleMusic' | 'youtubeMusic') => {
    setProviderConnected(provider, false);
  };

  const handleEnterUniverse = () => {
    localStorage.setItem('feelora_has_launched', 'true');
    setHasLaunchedUniverse(true);
  };

  const isAnyConnected = connectedProviders.spotify || connectedProviders.appleMusic || connectedProviders.youtubeMusic;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-y-auto py-10"
    >
      {/* Animated background orbs */}
      <div ref={orbsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#0A84FF]/5 blur-[120px] animate-breathe" />
        <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-[#BF5AF2]/5 blur-[100px] animate-breathe" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FF2D55]/3 blur-[110px] animate-breathe" style={{ animationDelay: '6s' }} />
      </div>

      <div className="relative z-10 text-center max-w-4xl px-6 mx-auto w-full">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center animate-float">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" opacity="0.4"/>
              <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="12" cy="12" r="2" fill="white" opacity="0.8"/>
              <line x1="12" y1="2" x2="12" y2="6" stroke="white" strokeWidth="1" opacity="0.3"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="1" opacity="0.3"/>
              <line x1="2" y1="12" x2="6" y2="12" stroke="white" strokeWidth="1" opacity="0.3"/>
              <line x1="18" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1" opacity="0.3"/>
            </svg>
          </div>
        </div>

        <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#8E8E93] mb-3 select-none">
          SPATIAL MUSIC UNIVERSE
        </p>

        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-3 leading-[1.0] select-none"
        >
          Feelora
        </h1>

        <p
          ref={subtitleRef}
          className="text-sm md:text-base text-[#8E8E93] font-light mb-10 leading-relaxed max-w-md mx-auto"
        >
          Link your music libraries and display them side-by-side inside your 3D spatial galaxy.
        </p>

        {!showClientIdInput ? (
          <div ref={dashboardRef} className="space-y-8 max-w-3xl mx-auto">
            {/* Providers Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Spotify Card */}
              <div className={`relative rounded-3xl p-5 border backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between h-[210px] ${
                connectedProviders.spotify 
                  ? 'bg-gradient-to-br from-[#1DB954]/10 to-black/40 border-[#1DB954]/30 shadow-[0_0_20px_rgba(29,185,84,0.1)]' 
                  : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    {/* SVG Spotify Icon */}
                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-[#1DB954]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.4c-.18.27-.53.37-.8.18-2.22-1.36-5.02-1.67-8.31-.92-.3.07-.6-.12-.67-.42-.07-.3.12-.6.42-.67 3.61-.83 6.71-.48 9.18 1.03.27.18.36.53.18.8zm1.2-2.7c-.22.36-.7.48-1.06.26-2.54-1.56-6.42-2.01-9.42-1.1-.4.12-.82-.12-.94-.52-.12-.4.12-.82.52-.94 3.44-1.04 7.72-.53 10.64 1.26.36.22.48.7.26 1.06zm.12-2.82c-3.05-1.81-8.08-1.98-11-1.09-.47.14-.97-.13-1.11-.6-.14-.47.13-.97.6-1.11 3.36-1.02 8.91-.82 12.44 1.28.42.25.56.79.31 1.21-.25.42-.79.56-1.21.31z"/>
                      </svg>
                    </div>
                    {/* Status Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold tracking-wider ${
                      connectedProviders.spotify ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/5 text-[#8E8E93]'
                    }`}>
                      {connectedProviders.spotify ? 'LINKED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <h3 className="text-left text-lg font-semibold text-white mt-4">Spotify</h3>
                  <p className="text-left text-xs text-[#8E8E93] mt-1 font-light leading-relaxed">
                    Integrate your live Spotify account and Liked Songs.
                  </p>
                </div>

                <div className="mt-4">
                  {connectedProviders.spotify ? (
                    <button
                      onClick={handleDisconnectSpotify}
                      className="w-full py-2.5 rounded-xl border border-[#FF375F]/35 text-[#FF375F] hover:bg-[#FF375F]/15 font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectSpotify}
                      className="w-full py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] hover:scale-[1.02] text-white font-semibold text-[11px] tracking-wide transition-all shadow-[0_0_15px_rgba(29,185,84,0.2)] cursor-pointer"
                    >
                      Connect Library
                    </button>
                  )}
                </div>
              </div>

              {/* Apple Music Card */}
              <div className={`relative rounded-3xl p-5 border backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between h-[210px] ${
                connectedProviders.appleMusic 
                  ? 'bg-gradient-to-br from-[#FF2D55]/10 to-black/40 border-[#FF2D55]/30 shadow-[0_0_20px_rgba(255,45,85,0.1)]' 
                  : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    {/* SVG Apple Music Note */}
                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-[#FF2D55]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z"/>
                      </svg>
                    </div>
                    {/* Status Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold tracking-wider ${
                      connectedProviders.appleMusic ? 'bg-[#FF2D55]/20 text-[#FF2D55]' : 'bg-white/5 text-[#8E8E93]'
                    }`}>
                      {connectedProviders.appleMusic ? 'LINKED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <h3 className="text-left text-lg font-semibold text-white mt-4">Apple Music</h3>
                  <p className="text-left text-xs text-[#8E8E93] mt-1 font-light leading-relaxed">
                    Import premium library tracks themed in signature Rose.
                  </p>
                </div>

                <div className="mt-4">
                  {connectedProviders.appleMusic ? (
                    <button
                      onClick={() => handleDisconnectSimulated('appleMusic')}
                      className="w-full py-2.5 rounded-xl border border-[#FF375F]/35 text-[#FF375F] hover:bg-[#FF375F]/15 font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenModal('apple')}
                      className="w-full py-2.5 rounded-xl bg-[#FF2D55] hover:bg-[#ff3b61] hover:scale-[1.02] text-white font-semibold text-[11px] tracking-wide transition-all shadow-[0_0_15px_rgba(255,45,85,0.2)] cursor-pointer"
                    >
                      Connect Library
                    </button>
                  )}
                </div>
              </div>

              {/* YouTube Music Card */}
              <div className={`relative rounded-3xl p-5 border backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between h-[210px] ${
                connectedProviders.youtubeMusic 
                  ? 'bg-gradient-to-br from-[#FF0000]/10 to-black/40 border-[#FF0000]/30 shadow-[0_0_20px_rgba(255,0,0,0.15)]' 
                  : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    {/* SVG YouTube Music Icon */}
                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-[#FF0000]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                      </svg>
                    </div>
                    {/* Status Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold tracking-wider ${
                      connectedProviders.youtubeMusic ? 'bg-[#FF0000]/20 text-[#FF0000]' : 'bg-white/5 text-[#8E8E93]'
                    }`}>
                      {connectedProviders.youtubeMusic ? 'LINKED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <h3 className="text-left text-lg font-semibold text-white mt-4">YouTube Music</h3>
                  <p className="text-left text-xs text-[#8E8E93] mt-1 font-light leading-relaxed">
                    Import premium tracks styled in dark Synthwave Red.
                  </p>
                </div>

                <div className="mt-4">
                  {connectedProviders.youtubeMusic ? (
                    <button
                      onClick={() => handleDisconnectSimulated('youtubeMusic')}
                      className="w-full py-2.5 rounded-xl border border-[#FF375F]/35 text-[#FF375F] hover:bg-[#FF375F]/15 font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenModal('youtube')}
                      className="w-full py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#ff1a1a] hover:scale-[1.02] text-white font-semibold text-[11px] tracking-wide transition-all shadow-[0_0_15px_rgba(255,0,0,0.2)] cursor-pointer"
                    >
                      Connect Library
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Launch CTA */}
            <div className="flex flex-col items-center gap-4 mt-12">
              <button
                disabled={!isAnyConnected}
                onClick={handleEnterUniverse}
                className={`px-10 py-4.5 rounded-full font-bold text-[13px] tracking-[0.1em] uppercase transition-all duration-300 shadow-xl ${
                  isAnyConnected 
                    ? 'bg-white text-black hover:scale-105 active:scale-95 cursor-pointer hover:shadow-white/20' 
                    : 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
                }`}
              >
                Enter Music Universe
              </button>

              <button
                onClick={onEnterDemo}
                className="px-6 py-2.5 rounded-full text-white/40 hover:text-white font-medium text-[10px] tracking-widest uppercase transition-all duration-300 cursor-pointer"
              >
                Or Explore Demo Space
              </button>
            </div>
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

      {/* Simulated Login Modal - Apple Music */}
      {activeModal === 'apple' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form 
            onSubmit={handleModalSubmit}
            className="relative bg-[#1C1C1E] border border-white/10 rounded-3xl p-7 w-full max-w-sm text-center shadow-2xl animate-fade-in"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FF2D55] text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Apple Music</h2>
            <p className="text-xs text-[#8E8E93] mb-6 font-light leading-relaxed">
              Sign in with your Apple ID to authorize Feelora.
            </p>

            <div className="space-y-3 mb-6 text-left">
              <div>
                <label className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider block mb-1">Apple ID</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@icloud.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF2D55]"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider block mb-1">Password or Passkey</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF2D55]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-[#8E8E93] text-xs hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-[#FF2D55] text-white text-xs font-semibold hover:bg-[#ff3b61] transition-all cursor-pointer flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Simulated Login Modal - YouTube Music */}
      {activeModal === 'youtube' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form 
            onSubmit={handleModalSubmit}
            className="relative bg-[#1C1C1E] border border-white/10 rounded-3xl p-7 w-full max-w-sm text-center shadow-2xl animate-fade-in"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FF0000] text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Google Account</h2>
            <p className="text-xs text-[#8E8E93] mb-6 font-light leading-relaxed">
              Continue to YouTube Music on Feelora.
            </p>

            <div className="space-y-3 mb-6 text-left">
              <div>
                <label className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider block mb-1">Google Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="username@gmail.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF0000]"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider block mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF0000]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-[#8E8E93] text-xs hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-[#FF0000] text-white text-xs font-semibold hover:bg-[#ff1a1a] transition-all cursor-pointer flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
