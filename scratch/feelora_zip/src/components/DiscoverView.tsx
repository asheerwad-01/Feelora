/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Play, Sparkles, BookOpen, Clock, Radio, ArrowRight } from 'lucide-react';
import { moodCollections } from '../data/musicData';
import { Track } from '../types';

interface DiscoverViewProps {
  onPlayTrack: (track: Track) => void;
  activeTrack: Track | null;
  isPlaying: boolean;
  onSelectMood: (moodId: string) => void;
}

export default function DiscoverView({
  onPlayTrack,
  activeTrack,
  isPlaying,
  onSelectMood,
}: DiscoverViewProps) {
  
  // Custom curated stories
  const stories = [
    {
      id: 'story-focus',
      tag: 'ACOUSTIC ARCHITECTURE',
      title: 'Obsidian & Solitude',
      subtitle: 'Building a stable container for raw cognition.',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      text: 'In writing Obsidian Code and Monolithic Flow, we set out to craft a digital room. Modern operating systems compete aggressively for your attention. Feelora does the exact opposite: it yields. Our Deep Focus soundscapes utilize repeating, slow minor-9th chord movements that settle your nervous systems. The low frequencies anchor your focus, allowing the high floating bell notes to stimulate creative leaps without ever interrupting your flow state.',
      quote: '"We don’t start by writing melodies. We start by tuning the room." — Aethelgard',
      track: moodCollections[0].tracks[0], // Obsidian Code
      moodId: 'deep-focus',
      bgTheme: 'bg-[#002C66]/10'
    },
    {
      id: 'story-drive',
      tag: 'HYPER-PERSPECTIVE',
      title: '120BPM Night Shadows',
      subtitle: 'Synthesizing the headlights on empty coastlines.',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      text: 'There is a precise emotional geometry that exists when driving a modern cabin down an empty highway at 2:00 AM. Cyber Highway compiles 80s outrun basslines alongside filter-swept modular synthesizer engines to capture this speed. By using high-resonance, detuned analog sawtooth waves, we created a sleek pulsing momentum that aligns your pulse with the sweeping sodium lights reflected across the windshield.',
      quote: '"Retro is not about copying the past. It’s about projecting an ideal future that never came." — Vektor Noir',
      track: moodCollections[1].tracks[0], // Cyber Highway
      moodId: 'night-drive',
      bgTheme: 'bg-[#580B1A]/10'
    },
    {
      id: 'story-morning',
      tag: 'ALABASTER GLARE',
      title: 'Acoustic Amber Steam',
      subtitle: 'Capturing sunlit dust motes and slow mornings.',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      text: 'Sunday Morning was engineered to feel light, spacious, and optimistic. We paired delicate acoustic guitars with wooden mallet tones cascading down a major pentatonic scale. It evokes filtered sunlight, warm coffee vapor, and linen sheets sliding across timber floors. There are no sudden rhythmic shocks—just a continuous ripple of major chord harmonics designed to start your sunday in absolute stillness.',
      quote: '"We designed it to feel exactly like early morning glare hitting a solid block of oak wood." — Linen',
      track: moodCollections[3].tracks[0], // Amber Steam
      moodId: 'sunday-morning',
      bgTheme: 'bg-[#4C3E00]/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="pb-32 text-white px-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="pt-12 pb-16">
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#AEAEB2]">MUSEUM EDITION</span>
        <h1 className="text-5xl md:text-[72px] tracking-tight font-medium leading-[0.95] mt-3 mb-6">
          Discover Feelora
        </h1>
        <p className="text-[#AEAEB2] text-[17px] md:text-xl font-light leading-relaxed max-w-2xl">
          Deep, magazine-style stories outlining the sonic philosophies and sensory designs built into Feelora's emotional suites.
        </p>
      </div>

      {/* Narrative Feed */}
      <div className="space-y-32">
        {stories.map((story, idx) => {
          const isSelected = activeTrack?.id === story.track.id && isPlaying;
          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-stretch"
            >
              {/* Image Column */}
              <div className={`col-span-1 lg:col-span-7 flex flex-col justify-between ${idx % 2 === 1 ? 'lg:order-last' : ''}`}>
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#111111] border border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 z-10" />
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover select-none filter brightness-90 hover:brightness-100 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Visualizer Floating Badge */}
                  {isSelected && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-[#0A84FF]">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Playing Live Soundscape</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-4 items-center">
                  <button
                    onClick={() => onPlayTrack(story.track)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 active:scale-95 transition-all duration-200"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>{isSelected ? 'Pause Track' : `Listen to ${story.track.title}`}</span>
                  </button>
                  
                  <button
                    onClick={() => onSelectMood(story.moodId)}
                    className="text-xs font-mono text-[#AEAEB2] hover:text-[#0A84FF] transition-colors flex items-center gap-1.5 pl-2"
                  >
                    <span>Go to {story.moodId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Column */}
              <div className="col-span-1 lg:col-span-5 flex flex-col justify-center space-y-6">
                <span className="text-xs font-mono tracking-[0.25em] text-[#0A84FF] font-medium">
                  {story.tag}
                </span>
                
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] text-white">
                  {story.title}
                </h2>

                <p className="text-lg text-gray-300 font-light leading-relaxed italic">
                  "{story.subtitle}"
                </p>

                <p className="text-[15px] font-light text-[#AEAEB2] leading-relaxed">
                  {story.text}
                </p>

                {/* Highly structured typography quote block */}
                <div className={`p-5 rounded-2xl border border-white/5 ${story.bgTheme} text-xs font-mono text-[#AEAEB2] leading-relaxed`}>
                  {story.quote}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Editor Note */}
      <div className="mt-40 border-t border-white/10 pt-16 flex flex-col sm:flex-row justify-between text-gray-500 font-mono text-xs items-start sm:items-center gap-4">
        <div>DESIGNED BY APPLE HUMAN INTERFACE SPECIALISTS</div>
        <div>FEELORA • ALL TRACKS SYNTHESIZED AND STREAMED LOCALLY</div>
      </div>
    </motion.div>
  );
}
