/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ArrowUpRight, Play, Compass, Volume2, Sparkles } from 'lucide-react';
import { moodCollections } from '../data/musicData';
import { MoodCollection, Track } from '../types';

interface HomeViewProps {
  onSelectMood: (moodId: string) => void;
  onPlayTrack: (track: Track) => void;
  activeTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function HomeView({
  onSelectMood,
  onPlayTrack,
  activeTrack,
  isPlaying,
  onTogglePlay,
}: HomeViewProps) {
  // Find a beautiful featured track for the editorial headliner
  const featuredCollection = moodCollections[0]; // Deep Focus
  const featuredTrack = featuredCollection.tracks[0]; // Obsidian Code

  // Stagger variants for the editorial entries
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 85, damping: 15 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="pb-32 text-white"
    >
      {/* Editorial Keynote Hero Section */}
      <div id="home-hero-container" className="relative pt-12 md:pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-[0.25em] text-[#0A84FF]"
          >
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            <span>Feelora Operating System v1.0</span>
          </motion.div>

          {/* User Specific Apple Display Headline */}
          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl md:text-[96px] tracking-tighter font-medium leading-[0.95] text-white"
            >
              ASHEERWAD
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-5xl tracking-tight text-[#AEAEB2] font-normal leading-tight max-w-3xl"
            >
              What soundtrack does today deserve?
            </motion.h2>
          </div>

          {/* Featured Editorial Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 group relative w-full h-[320px] md:h-[450px] rounded-3xl overflow-hidden bg-[#111111]"
          >
            {/* Immersive featured artwork */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 z-10" />
            <img
              src={featuredCollection.artworkUrl}
              alt="Immersive Featured Art"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 select-none"
              referrerPolicy="no-referrer"
            />

            {/* Content overlay */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-12 text-left">
              <span className="text-xs font-mono uppercase tracking-widest text-[#AEAEB2] mb-2">CURATED FEATURE</span>
              <h3 className="text-4xl md:text-6xl tracking-tight font-medium text-white mb-3">
                {featuredTrack.title}
              </h3>
              <p className="text-[#AEAEB2] text-[15px] md:text-[17px] max-w-xl font-light mb-6 leading-relaxed">
                Experience synthetic deep gravity vectors designed to lock your cognitive attention. Crafted live with warm harmonic modular pulses.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onPlayTrack(featuredTrack)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium text-[15px] hover:bg-neutral-200 active:scale-95 transition-all duration-200"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>
                    {activeTrack?.id === featuredTrack.id && isPlaying ? 'Pause Experience' : 'Begin Deep Cognitive Flow'}
                  </span>
                </button>
                <button
                  onClick={() => onSelectMood(featuredCollection.id)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 font-medium text-[15px] transition-all duration-200"
                >
                  <span>Explore Collection</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mood Collections - Experiences */}
      <div id="mood-experiences-list" className="max-w-6xl mx-auto px-6 mt-16">
        <div className="flex justify-between items-baseline border-b border-white/10 pb-4 mb-8">
          <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-[#AEAEB2]">Mood Experiences</h3>
          <span className="text-xs font-mono text-gray-500">SELECT TO ENTER ARCHITECTURE</span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {moodCollections.map((mood, idx) => {
            return (
              <motion.div
                key={mood.id}
                variants={itemVariants}
                className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 rounded-2xl bg-[#111111] hover:bg-[#1C1C1E] transition-all duration-300 border border-white/5 cursor-pointer overflow-hidden"
                onClick={() => onSelectMood(mood.id)}
              >
                {/* Slit Ambient Background Overlay */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 opacity-50 group-hover:opacity-100"
                  style={{ backgroundColor: mood.accentColor }}
                />

                {/* Left block: index, title, description */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center max-w-3xl z-10">
                  <span className="text-sm font-mono text-gray-600 group-hover:text-white transition-colors">
                    0{idx + 1}
                  </span>
                  
                  {/* Miniature beautiful subtle cover art representation */}
                  <div className="w-14 h-14 overflow-hidden rounded-xl bg-black border border-white/10 shrink-0">
                    <img
                      src={mood.artworkUrl}
                      alt={mood.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-3">
                      <h4 className="text-2xl font-medium tracking-tight text-white group-hover:text-[#0A84FF] transition-colors">
                        {mood.name}
                      </h4>
                      <span className="text-[10px] font-mono tracking-[0.2em] text-[#AEAEB2] uppercase hidden sm:inline">
                        {mood.subtitle}
                      </span>
                    </div>
                    <p className="text-[15px] font-light text-[#AEAEB2] leading-relaxed max-w-xl">
                      {mood.tagline}
                    </p>
                  </div>
                </div>

                {/* Right block: Quote / Action */}
                <div className="mt-4 md:mt-0 flex items-center md:items-end flex-col gap-1.5 z-10">
                  <div className="hidden lg:block text-right pr-4 font-serif text-[13px] text-gray-400 italic max-w-xs leading-normal">
                    {mood.quote}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono group-hover:bg-white group-hover:text-black transition-all duration-300">
                    <span>Enter Sonic Vault</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Visual Quote / Minimal Footer Banner */}
      <div className="max-w-4xl mx-auto px-6 mt-28 mb-12 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <p className="text-2xl font-serif text-gray-400 leading-relaxed italic">
            "We wanted to design a device that dissolves when you use it, leaving only your music in the center."
          </p>
          <div className="text-xs font-mono text-gray-600 uppercase tracking-widest">
            Feelora Design Principles • Human Interface Team
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
