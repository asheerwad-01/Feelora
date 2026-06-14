/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Music, Library, ListMusic, Layers, Radio } from 'lucide-react';
import { moodCollections, allTracks } from '../data/musicData';
import { Track } from '../types';

interface LibraryViewProps {
  onPlayTrack: (track: Track) => void;
  activeTrack: Track | null;
  isPlaying: boolean;
  onSelectMood: (moodId: string) => void;
}

type LibraryTab = 'experiences' | 'tracks';

export default function LibraryView({
  onPlayTrack,
  activeTrack,
  isPlaying,
  onSelectMood,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('experiences');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="pb-32 text-white px-6 max-w-6xl mx-auto"
    >
      {/* Header with Visual Tabs */}
      <div className="pt-12 pb-12 flex flex-col md:flex-row justify-between items-start md:items-baseline gap-4 border-b border-white/10">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#AEAEB2]">STORED ARCHIVES</span>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mt-1">
            Your Library
          </h1>
        </div>

        {/* VisionOS Pill Tab Switcher */}
        <div className="flex bg-[#111111] border border-white/10 p-1.5 rounded-full ring-1 ring-black">
          <button
            onClick={() => setActiveTab('experiences')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'experiences' ? 'bg-[#1C1C1E] text-white shadow-lg' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Experiences</span>
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'tracks' ? 'bg-[#1C1C1E] text-white shadow-lg' : 'text-gray-500 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>All Soundtracks</span>
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="mt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'experiences' ? (
            <motion.div
              key="experiences-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {moodCollections.map((collection) => {
                return (
                  <div
                    key={collection.id}
                    className="group relative cursor-pointer"
                    onClick={() => onSelectMood(collection.id)}
                  >
                    {/* Oversized Cinematic Cover Square */}
                    <div className="aspect-square bg-[#111111] rounded-2xl overflow-hidden border border-white/5 relative shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 transition-opacity group-hover:opacity-90" />
                      <img
                        src={collection.artworkUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Interactive hovering overlay visual */}
                      <div className="absolute inset-0 z-20 flex flex-col justify-end p-6">
                        <span className="text-[10px] font-mono tracking-[0.2em] text-[#AEAEB2] uppercase mb-1">
                          {collection.subtitle}
                        </span>
                        <h3 className="text-2xl font-medium tracking-tight text-white group-hover:text-[#0A84FF] transition-colors leading-tight">
                          {collection.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-light mt-1 max-w-xs line-clamp-2 leading-relaxed">
                          {collection.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[#AEAEB2] px-1">
                      <span className="text-xs font-mono uppercase tracking-wider">
                        {collection.tracks.length} soundscapes
                      </span>
                      <span className="text-xs font-mono border border-white/10 px-2 py-0.5 rounded-full group-hover:text-white transition-colors">
                        Explore
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="tracks-list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-1.5"
            >
              {/* Table Column Labels */}
              <div className="grid grid-cols-12 goods-center px-4 py-2.5 text-xs font-mono tracking-widest text-gray-500 uppercase border-b border-white/5 mb-4">
                <div className="col-span-6 md:col-span-5 flex items-center gap-2">TITLE / ARTIST</div>
                <div className="col-span-3 md:col-span-4 hidden sm:block">SUITE</div>
                <div className="col-span-2 hidden md:block">TEMPO</div>
                <div className="col-span-3 md:col-span-1 text-right">LENGTH</div>
              </div>

              {/* Soundtracks mapping */}
              {allTracks.map((track, idx) => {
                const isActive = activeTrack?.id === track.id;
                const isCurrentPlaying = isActive && isPlaying;

                return (
                  <div
                    key={track.id}
                    className={`grid grid-cols-12 items-center px-4 py-3.5 rounded-xl cursor-pointer transition-colors duration-150 border border-transparent ${
                      isActive ? 'bg-[#1C1C1E] border-white/5 shadow-md' : 'hover:bg-white/5'
                    }`}
                    onClick={() => onPlayTrack(track)}
                  >
                    <div className="col-span-12 sm:col-span-6 md:col-span-5 flex items-center gap-4">
                      {/* Track Image */}
                      <div className="w-10 h-10 overflow-hidden rounded bg-[#111111] border border-white/5 shrink-0 relative">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover select-none"
                          referrerPolicy="no-referrer"
                        />
                        {isCurrentPlaying && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Radio className="w-4 h-4 text-[#0A84FF] animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 pr-2">
                        <h4 className={`text-[15px] font-medium truncate ${isActive ? 'text-[#0A84FF]' : 'text-gray-100'}`}>
                          {track.title}
                        </h4>
                        <p className="text-xs text-[#AEAEB2] truncate font-light">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Suite Category */}
                    <div className="col-span-3 md:col-span-4 hidden sm:block text-xs font-mono text-[#AEAEB2] truncate">
                      {track.collectionName}
                    </div>

                    {/* Tempo */}
                    <div className="col-span-2 hidden md:block text-xs font-mono text-gray-500">
                      {track.beatsPerMinute} BPM
                    </div>

                    {/* Time Duration */}
                    <div className="col-span-12 sm:col-span-3 md:col-span-1 text-right text-xs font-mono text-gray-400">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
