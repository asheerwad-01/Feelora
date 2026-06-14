/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, BookOpen, Library, Radio, Search, Play, Pause, X, ChevronLeft, Volume2, Sparkles, Command } from 'lucide-react';

import { Track, ViewState, MoodCollection } from './types';
import { moodCollections, allTracks } from './data/musicData';
import { synthEngine } from './lib/synth';

// Views
import HomeView from './components/HomeView';
import DiscoverView from './components/DiscoverView';
import LibraryView from './components/LibraryView';
import NowPlayingView from './components/NowPlayingView';
import SpotlightSearch from './components/SpotlightSearch';
import AudioVisualizer from './components/AudioVisualizer';

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  
  // Active states
  const [activeTrack, setActiveTrack] = useState<Track | null>(allTracks[0]); // pre-load lead track
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [audioSourceType, setAudioSourceType] = useState<'stream' | 'synthesizer'>('stream');
  
  // Dedicated Experience detailing overlay
  const [activeExperience, setActiveExperience] = useState<MoodCollection | null>(null);

  // Playback queue tracking
  const [playbackQueue, setPlaybackQueue] = useState<Track[]>(allTracks);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  // HTML5 Streaming Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Initialize unified audio streams
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    // Track progression ticks
    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const onEnded = () => {
      handleNextTrack();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    // Global Key Listener for Spotlight Search (⌘K / Ctrl+K / '/' )
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      window.removeEventListener('keydown', handleGlobalShortcuts);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      synthEngine.stop();
    };
  }, []);

  // Sync volumes across stream & synthesizer
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    synthEngine.setVolume(volume);
  }, [volume]);

  // Handle active playback tracks when source type switches
  const handleToggleAudioSource = (type: 'synthesizer' | 'stream') => {
    if (type === audioSourceType) return;
    
    // Stop the active thread first
    if (isPlaying && activeTrack) {
      if (audioSourceType === 'stream' && audioRef.current) {
        audioRef.current.pause();
      } else {
        synthEngine.stop();
      }

      // Boot up the complementary engine
      if (type === 'stream' && audioRef.current) {
        audioRef.current.src = activeTrack.audioUrl;
        audioRef.current.currentTime = progress;
        audioRef.current.play().catch(e => console.warn('Stream play interrupted', e));
      } else {
        synthEngine.start(activeTrack);
      }
    } else if (activeTrack && audioRef.current) {
      // Just swap configurations
      if (type === 'stream') {
        audioRef.current.src = activeTrack.audioUrl;
        audioRef.current.currentTime = progress;
      }
    }

    setAudioSourceType(type);
  };

  // Trigger audio playback for a particular target track
  const handlePlayTrack = (track: Track, customQueue?: Track[]) => {
    if (!audioRef.current) return;

    const needsSourceUpdate = !activeTrack || activeTrack.id !== track.id;
    setActiveTrack(track);
    setActiveExperience(null); // collapse detail overlays upon playback commands

    if (customQueue) {
      setPlaybackQueue(customQueue);
      const idx = customQueue.findIndex(t => t.id === track.id);
      setCurrentQueueIndex(idx >= 0 ? idx : 0);
    } else {
      // Find within default global list
      const idx = allTracks.findIndex(t => t.id === track.id);
      if (idx >= 0) {
        setCurrentQueueIndex(idx);
      }
    }

    if (needsSourceUpdate) {
      setProgress(0);
      audioRef.current.src = track.audioUrl;
      audioRef.current.currentTime = 0;
    }

    // Unleash the active playing thread
    if (audioSourceType === 'stream') {
      synthEngine.stop();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio play request failed due to user block interaction', e);
        // Fallback or let user click play again
      });
    } else {
      audioRef.current.pause();
      synthEngine.start(track);
      setIsPlaying(true);
    }
  };

  // Toggle Play / Pause states
  const handleTogglePlay = () => {
    if (!activeTrack || !audioRef.current) return;

    if (isPlaying) {
      if (audioSourceType === 'stream') {
        audioRef.current.pause();
      } else {
        synthEngine.stop();
      }
      setIsPlaying(false);
    } else {
      // System Audio Context Unlock (Safari/Chrome requirements)
      synthEngine.resumeContext();

      if (audioSourceType === 'stream') {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => console.warn(e));
      } else {
        synthEngine.start(activeTrack);
        setIsPlaying(true);
      }
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (currentQueueIndex + 1) % playbackQueue.length;
    setCurrentQueueIndex(nextIdx);
    handlePlayTrack(playbackQueue[nextIdx], playbackQueue);
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentQueueIndex - 1 + playbackQueue.length) % playbackQueue.length;
    setCurrentQueueIndex(prevIdx);
    handlePlayTrack(playbackQueue[prevIdx], playbackQueue);
  };

  const handleSeek = (seconds: number) => {
    setProgress(seconds);
    if (audioRef.current && audioSourceType === 'stream') {
      audioRef.current.currentTime = seconds;
    }
  };

  // Manage custom tracks selection inside secondary mood overlays
  const handleSelectMoodId = (moodId: string) => {
    const selected = moodCollections.find(m => m.id === moodId);
    if (selected) {
      setActiveExperience(selected);
    }
  };

  // Navigation changes
  const handleNavigate = (view: ViewState) => {
    setActiveView(view);
    setActiveExperience(null); // collapse overlays on primary nav changes
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-x-hidden select-none pb-24 font-sans">
      
      {/* Global Embedded Fluid Canvas Visualizer (Floats continuously behind all views!) */}
      <AudioVisualizer
        currentTrack={activeTrack}
        isPlaying={isPlaying}
        audioElement={audioRef.current}
      />

      {/* Primary Top Minimal Header Chrome */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('home')}>
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <Radio className="w-4 h-4 text-white hover:text-[#0A84FF] transition-colors" />
          </div>
          <span className="text-[15px] font-mono tracking-[0.2em] uppercase font-semibold text-white">
            FEELORA
          </span>
        </div>

        {/* Spotlight Navigation Shortcut Handler */}
        <button
          onClick={() => setIsSpotlightOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Spotlight</span>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[9px] text-gray-500 font-mono">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>
      </header>

      {/* Central Interactive Content Frame */}
      <main className="flex-1 w-full z-10 relative">
        <AnimatePresence mode="wait">
          
          {/* Dedicated Sub-View: Experiencing Immersion Detailing */}
          {activeExperience ? (
            <motion.div
              key={`experience-${activeExperience.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl mx-auto px-6 pt-8 pb-32 text-white"
            >
              {/* Back chrome */}
              <button
                onClick={() => setActiveExperience(null)}
                className="flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-white mb-8 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-4">
                {/* Immersive Giant Banner Artwork */}
                <div className="col-span-1 lg:col-span-5 flex flex-col space-y-6">
                  <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 group relative">
                    <img
                      src={activeExperience.artworkUrl}
                      alt={activeExperience.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>

                  {/* Curated Author Quote */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-[#111111]/40 text-xs font-mono text-[#AEAEB2] leading-relaxed relative">
                    <p className="italic font-serif text-[13px] text-gray-300 md:text-[14px] mb-2 leading-relaxed">
                      {activeExperience.quote}
                    </p>
                    <span className="text-[10px] text-gray-500 uppercase">
                      — {activeExperience.quoteAuthor}
                    </span>
                  </div>
                </div>

                {/* Narrative Description & Track Grouping */}
                <div className="col-span-1 lg:col-span-7 space-y-8">
                  <div className="space-y-2">
                    <span className="text-xs font-mono tracking-[0.25em] text-[#0A84FF] uppercase">
                      IMMERSIVE SOUNDSCAPE SUITE
                    </span>
                    <h2 className="text-4xl md:text-6xl font-medium tracking-tight leading-[0.95] text-white">
                      {activeExperience.name}
                    </h2>
                    <p className="text-xl text-gray-400 font-light leading-regular pt-1">
                      {activeExperience.tagline}
                    </p>
                  </div>

                  <p className="text-[15px] font-light text-[#AEAEB2] leading-relaxed max-w-2xl">
                    {activeExperience.description}
                  </p>

                  <div className="pt-4">
                    <button
                      onClick={() => handlePlayTrack(activeExperience.tracks[0], activeExperience.tracks)}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-95 transition-all shadow-xl"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Begin {activeExperience.name} Experience</span>
                    </button>
                  </div>

                  {/* Experience Soundtrack Indices */}
                  <div className="pt-6">
                    <div className="border-b border-white/10 pb-3 mb-4">
                      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">
                        Soundtrack Composition ({activeExperience.tracks.length})
                      </h3>
                    </div>

                    <div className="space-y-1.5">
                      {activeExperience.tracks.map((track, idx) => {
                        const isActive = activeTrack?.id === track.id;
                        const isCurrentPlaying = isActive && isPlaying;

                        return (
                          <div
                            key={track.id}
                            onClick={() => handlePlayTrack(track, activeExperience.tracks)}
                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border border-transparent transition-all ${
                              isActive ? 'bg-[#1C1C1E] border-white/5 shadow' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0 pr-4">
                              <span className="text-xs font-mono text-gray-600 w-4">
                                0{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className={`text-[15px] font-medium truncate sm:text-[16px] ${isActive ? 'text-[#0A84FF]' : 'text-white'}`}>
                                  {track.title}
                                </h4>
                                <p className="text-xs text-[#AEAEB2] font-light truncate">
                                  {track.artist}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {isCurrentPlaying ? (
                                <span className="text-[10px] font-mono text-[#0A84FF] flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none animate-pulse">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-ping" />
                                  <span>LIVE</span>
                                </span>
                              ) : (
                                <button className="p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white/10 rounded-full transition-opacity">
                                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                                </button>
                              )}
                              <span className="text-xs font-mono text-gray-500 select-none">
                                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          ) : (
            // Primary Nav-View rendering blocks
            <>
              {activeView === 'home' && (
                <HomeView
                  onSelectMood={handleSelectMoodId}
                  onPlayTrack={handlePlayTrack}
                  activeTrack={activeTrack}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                />
              )}
              {activeView === 'discover' && (
                <DiscoverView
                  onPlayTrack={handlePlayTrack}
                  activeTrack={activeTrack}
                  isPlaying={isPlaying}
                  onSelectMood={handleSelectMoodId}
                />
              )}
              {activeView === 'library' && (
                <LibraryView
                  onPlayTrack={handlePlayTrack}
                  activeTrack={activeTrack}
                  isPlaying={isPlaying}
                  onSelectMood={handleSelectMoodId}
                />
              )}
              {activeView === 'nowplaying' && (
                <NowPlayingView
                  currentTrack={activeTrack}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  onNextTrack={handleNextTrack}
                  onPrevTrack={handlePrevTrack}
                  progress={progress}
                  onSeek={handleSeek}
                  volume={volume}
                  onVolumeChange={setVolume}
                  audioSourceType={audioSourceType}
                  onToggleAudioSource={handleToggleAudioSource}
                />
              )}
            </>
          )}

        </AnimatePresence>
      </main>

      {/* Floating Translucent Mini Player overlay when browsing other pages */}
      <AnimatePresence>
        {activeTrack && activeView !== 'nowplaying' && !activeExperience && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="fixed bottom-26 right-6 z-30 w-72 h-16 rounded-2xl glass-panel p-2 flex items-center justify-between border border-white/10 shadow-lg cursor-pointer hover:border-white/20 transition-all duration-300"
            onClick={() => handleNavigate('nowplaying')}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <img
                  src={activeTrack.coverUrl}
                  alt={activeTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 select-none">
                <h4 className="text-xs font-semibold text-white truncate">{activeTrack.title}</h4>
                <p className="text-[10px] text-gray-400 truncate font-mono uppercase tracking-wider">{activeTrack.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-black fill-black" /> : <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />}
              </button>
              <button
                onClick={() => handleNavigate('nowplaying')}
                className="p-1 px-2 rounded-full hover:bg-white/10 text-xs font-mono text-gray-400 hover:text-white transition-colors"
              >
                Open
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VisionOS High-End Suspended Floating Dock */}
      <nav id="visionos-dock-container" className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4">
        <div id="visionos-dock" className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl saturate-150">
          
          <button
            onClick={() => handleNavigate('home')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
              activeView === 'home' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={() => handleNavigate('discover')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
              activeView === 'discover' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Discover</span>
          </button>

          <button
            onClick={() => handleNavigate('library')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
              activeView === 'library' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </button>

          <button
            onClick={() => handleNavigate('nowplaying')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
              activeView === 'nowplaying' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {isPlaying ? (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 mr-1" style={{ backgroundColor: activeTrack?.accentColor || '#0A84FF' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: activeTrack?.accentColor || '#0A84FF' }} />
                </span>
              ) : null}
              <Radio className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline">Now Playing</span>
          </button>

        </div>
      </nav>

      {/* Global Command Palette Overlay (Spotlight Search) */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onSelectTrack={(track) => handlePlayTrack(track)}
        onNavigateToCollection={handleSelectMoodId}
      />

    </div>
  );
}
