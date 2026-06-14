/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Sparkles, Sliders, Music, Zap, Layers } from 'lucide-react';
import { Track, PlaybackState } from '../types';

interface NowPlayingViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  progress: number;
  onSeek: (seconds: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  audioSourceType: 'synthesizer' | 'stream';
  onToggleAudioSource: (type: 'synthesizer' | 'stream') => void;
}

export default function NowPlayingView({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  progress,
  onSeek,
  volume,
  onVolumeChange,
  audioSourceType,
  onToggleAudioSource,
}: NowPlayingViewProps) {
  const [showSynthPanel, setShowSynthPanel] = useState(false);
  const [synthKnobs, setSynthKnobs] = useState({
    detune: currentTrack?.synthSettings.detune || 8,
    filterFreq: currentTrack?.synthSettings.filterFreq || 800,
    feedback: currentTrack?.synthSettings.feedback || 0.6,
  });

  if (!currentTrack) {
    return (
      <div id="no-playing-placeholder" className="h-[60vh] flex flex-col items-center justify-center text-center text-white px-6">
        <Music className="w-12 h-12 text-gray-600 mb-4 animate-bounce" />
        <h2 className="text-2xl font-medium tracking-tight">Nothing Playing</h2>
        <p className="text-gray-500 font-light text-sm max-w-sm mt-1">
          Summon the Spotlight search using <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-gray-400 font-mono">⌘K</kbd> to load a soundtrack.
        </p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert track colors to elegant ambient CSS styles
  const activeColor = currentTrack.accentColor;
  const secondaryColor = currentTrack.secondaryColor;

  const handleKnobChange = (knob: 'detune' | 'filterFreq' | 'feedback', val: number) => {
    setSynthKnobs((prev) => ({ ...prev, [knob]: val }));
    // Update live synthesizer object bindings if playing
    if (currentTrack?.synthSettings) {
      currentTrack.synthSettings[knob] = val;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="pb-32 text-white relative"
    >
      {/* Dynamic Background Glow Layer */}
      <div
        className="absolute inset-x-0 top-0 h-[600px] -z-10 bg-radial transition-all duration-1000 ease-out pointer-events-none opacity-30 select-none"
        style={{
          background: `radial-gradient(circle at 50% 10%, ${activeColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Column 1: Artwork Dominates (Left/Center) */}
          <div className="col-span-1 md:col-span-6 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', blur: 10, stiffness: 60, damping: 20 }}
              className="relative aspect-square w-full max-w-[340px] md:max-w-none rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 group"
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover select-none transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {/* Subtle spinning soft halo overlay when playing */}
              {isPlaying && (
                <div
                  className="absolute inset-0 mix-blend-screen opacity-20 pointer-events-none select-none duration-[15s] animate-spin ease-linear"
                  style={{
                    background: `conic-gradient(from 0deg, ${activeColor}, ${secondaryColor}, transparent, ${activeColor})`,
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* Column 2: Minimal Typography + Curated Controls */}
          <div className="col-span-1 md:col-span-6 flex flex-col justify-center space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono tracking-[0.25em] text-[#AEAEB2] uppercase">
                Active Architectural Node
              </span>
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white leading-tight">
                {currentTrack.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-md text-[#AEAEB2] font-light">
                  {currentTrack.artist}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                <span className="text-xs font-mono text-gray-500 uppercase">
                  {currentTrack.album}
                </span>
              </div>
            </div>

            <p className="text-[13px] md:text-sm font-light text-[#AEAEB2] leading-relaxed">
              {currentTrack.description}
            </p>

            {/* VisionOS High-End Engine Selector Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#111111] border border-white/5 shadow-inner">
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Engine
              </span>
              
              <div className="flex rounded-lg bg-black p-0.5 border border-white/5">
                <button
                  onClick={() => onToggleAudioSource('stream')}
                  className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    audioSourceType === 'stream' ? 'bg-[#1C1C1E] text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Direct Stream
                </button>
                <button
                  onClick={() => onToggleAudioSource('synthesizer')}
                  className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                    audioSourceType === 'synthesizer' ? 'bg-[#1C1C1E] text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Synthesizer</span>
                </button>
              </div>
            </div>

            {/* Main Timelines tracker */}
            <div className="space-y-2">
              <div className="relative">
                {/* Custom Seek Bar Slider */}
                <input
                  id="timeline-slider"
                  type="range"
                  min="0"
                  max={currentTrack.duration}
                  value={progress}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-[3px] bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0A84FF] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-gray-500">
                <span>{formatTime(progress)}</span>
                <span className="flex items-center gap-1.5">
                  <span>{currentTrack.beatsPerMinute} BPM</span>
                </span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Core Playback Dials */}
            <div className="flex items-center justify-between pt-2">
              {/* Secondary Volume Slider */}
              <div className="flex items-center gap-2 max-w-[120px] w-full group">
                <Volume2 className="w-4 h-4 text-gray-500 shrink-0 group-hover:text-white transition-colors" />
                <input
                  id="volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-[2px] bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#AEAEB2] focus:outline-none"
                />
              </div>

              {/* Transport */}
              <div className="flex items-center gap-5 pr-2">
                <button
                  onClick={onPrevTrack}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={onTogglePlay}
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-black text-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onNextTrack}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all"
                  title="Next Track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Synthesizer warp utility panel toggler */}
              <button
                onClick={() => setShowSynthPanel(!showSynthPanel)}
                className={`p-2.5 rounded-full border border-white/5 hover:border-white/10 flex items-center justify-center transition-all ${
                  showSynthPanel ? 'bg-white text-black font-semibold shadow' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
                title="Warp Sound Wave parameters"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Generative Customizer Sliders Panel (Slide down drawers) */}
        <AnimatePresence>
          {showSynthPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mt-12 bg-[#111111] border border-white/5 rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
                <Sliders className="w-4.5 h-4.5 text-[#0A84FF]" />
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white">
                  Procedural Signal Warper (Web Audio Module)
                </h3>
              </div>

              {audioSourceType !== 'synthesizer' && (
                <div className="mb-4 text-xs font-mono text-gray-500 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  Note: Values will apply and synthesize when you switch Engine to "Synthesizer".
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Knob 1: detune width */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-mono text-gray-400">CHORUS WIDTH (DETUNE)</label>
                    <span className="text-xs font-mono text-white">{synthKnobs.detune} cents</span>
                  </div>
                  <input
                    id="synth-detune"
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={synthKnobs.detune}
                    onChange={(e) => handleKnobChange('detune', parseInt(e.target.value))}
                    className="w-full h-[2px] bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0A84FF]"
                  />
                  <p className="text-[10px] text-gray-500 font-light leading-normal">
                    Drifts oscillator phases for wider analog ensemble texture.
                  </p>
                </div>

                {/* Knob 2: Analog biquad Filter frequency */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-mono text-gray-400">FILTER CUTOFF (FREQ)</label>
                    <span className="text-xs font-mono text-white">{synthKnobs.filterFreq} Hz</span>
                  </div>
                  <input
                    id="synth-filter"
                    type="range"
                    min="100"
                    max="2200"
                    step="10"
                    value={synthKnobs.filterFreq}
                    onChange={(e) => handleKnobChange('filterFreq', parseInt(e.target.value))}
                    className="w-full h-[2px] bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF375F]"
                  />
                  <p className="text-[10px] text-gray-500 font-light leading-normal">
                    Analog style Biquad frequency. Sweeps from sub-water warmth to high chimes.
                  </p>
                </div>

                {/* Knob 3: Feedback Delay decay */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-mono text-gray-400">ECHO DECAY (FEEDBACK)</label>
                    <span className="text-xs font-mono text-white">{(synthKnobs.feedback * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    id="synth-feedback"
                    type="range"
                    min="0.1"
                    max="0.85"
                    step="0.05"
                    value={synthKnobs.feedback}
                    onChange={(e) => handleKnobChange('feedback', parseFloat(e.target.value))}
                    className="w-full h-[2px] bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#30D158]"
                  />
                  <p className="text-[10px] text-gray-500 font-light leading-normal">
                    Controlsdelay feedback loops to shape continuous cavernous echoes.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
