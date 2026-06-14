/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Search, Command, ArrowRight, CornerDownLeft, Play, Eye } from 'lucide-react';
import { Track } from '../types';
import { allTracks, moodCollections } from '../data/musicData';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  onNavigateToCollection: (collectionId: string) => void;
}

export default function SpotlightSearch({
  isOpen,
  onClose,
  onSelectTrack,
  onNavigateToCollection,
}: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Filter criteria: find matching tracks or mood experiences
  const filteredTracks = query
    ? allTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.artist.toLowerCase().includes(query.toLowerCase()) ||
          t.album.toLowerCase().includes(query.toLowerCase())
      )
    : allTracks.slice(0, 4);

  const filteredMoods = query
    ? moodCollections.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.tagline.toLowerCase().includes(query.toLowerCase())
      )
    : moodCollections;

  const totalItemsCount = filteredMoods.length + filteredTracks.length;

  // Handle keyboard shortcuts
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard indexing (up/down/enter/escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItemsCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItemsCount) % totalItemsCount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredTracks, filteredMoods, totalItemsCount]);

  const triggerSelection = () => {
    if (selectedIndex < filteredMoods.length) {
      // Selected a mood collection
      const selectedMood = filteredMoods[selectedIndex];
      onNavigateToCollection(selectedMood.id);
      onClose();
    } else {
      // Selected a track
      const trackIndex = selectedIndex - filteredMoods.length;
      const selectedTrack = filteredTracks[trackIndex];
      onSelectTrack(selectedTrack);
      onClose();
    }
    // Clean states
    setQuery('');
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div id="spotlight-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div id="spotlight-container"
        className="w-full max-w-2xl overflow-hidden bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-4 border-b border-white/5 gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            id="spotlight-input"
            ref={inputRef}
            type="text"
            className="w-full text-[17px] text-white bg-transparent outline-none placeholder-gray-500"
            placeholder="Type a mood, artist, or song... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-gray-400 font-mono">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Results Stream */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
          {totalItemsCount === 0 ? (
            <div className="py-12 text-center text-[15px] text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mood Experiences */}
              {filteredMoods.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-medium tracking-widest text-[#AEAEB2] uppercase">
                    Mood Experiences
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {filteredMoods.map((mood, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={mood.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                            isSelected ? 'bg-[#0A84FF]' : 'hover:bg-white/5'
                          }`}
                          onClick={() => {
                            onNavigateToCollection(mood.id);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 overflow-hidden rounded bg-black/40">
                              <img
                                src={mood.artworkUrl}
                                alt={mood.name}
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <div className={`text-[15px] font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                {mood.name} Experience
                              </div>
                              <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                {mood.tagline}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="text-[11px] text-white/90 font-mono flex items-center gap-1">
                                Open <CornerDownLeft className="w-3 h-3" />
                              </span>
                            )}
                            <Eye className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tracks */}
              {filteredTracks.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-medium tracking-widest text-[#AEAEB2] uppercase">
                    Soundtracks
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {filteredTracks.map((track, idx) => {
                      const absoluteIndex = filteredMoods.length + idx;
                      const isSelected = absoluteIndex === selectedIndex;
                      return (
                        <div
                          key={track.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                            isSelected ? 'bg-[#0A84FF]' : 'hover:bg-white/5'
                          }`}
                          onClick={() => {
                            onSelectTrack(track);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 overflow-hidden rounded bg-black/40 relative">
                              <img
                                src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80'}
                                alt={track.title}
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <div className={`text-[15px] font-medium ${isSelected ? 'text-white' : 'text-gray-100'}`}>
                                {track.title}
                              </div>
                              <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-[#AEAEB2]'}`}>
                                {track.artist} • <span className="opacity-80">{track.album}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="text-[11px] text-white/90 font-mono flex items-center gap-1">
                                Play <Play className="w-2.5 h-2.5 fill-current" />
                              </span>
                            )}
                            <span className={`text-xs font-mono mr-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spotlight Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-t border-white/5 text-[11px] text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/5">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/5">Enter</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/5">Esc</kbd> Close</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="font-semibold text-gray-300">Feelora Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
