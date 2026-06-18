'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Category Bar Component
// Frosted glass horizontal scrollbar for filtering universes by mood/style
// ─────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

const CATEGORIES = [
  { id: 'soothing', label: 'Soothing', emoji: '🍃' },
  { id: 'pop', label: 'Pop', emoji: '🎤' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'fast', label: 'Fast', emoji: '⚡' },
  { id: 'moody', label: 'Moody', emoji: '🌌' },
  { id: 'orchestral', label: 'Orchestral', emoji: '🎻' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🕊️' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
  { id: 'chill', label: 'Chill', emoji: '❄️' },
  { id: 'romantic', label: 'Romantic', emoji: '💖' },
  { id: 'nostalgia', label: 'Nostalgia', emoji: '⏳' },
  { id: 'anime', label: 'Anime', emoji: '🌸' },
  { id: 'relaxing', label: 'Relaxing', emoji: '🌊' },
  { id: 'slow', label: 'Slow', emoji: '🕯️' },
  { id: 'quiet', label: 'Quiet', emoji: '🤫' },
];

export function CategoryBar() {
  const { activeCategory, setActiveCategory, isFocusMode } = useAppStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isFocusMode) return null;

  const handleCategoryClick = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(catId);
    }
    setIsMobileMenuOpen(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = 220;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const activeCatObj = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <>
      {/* Desktop Version: Horizontal Scroll */}
      <div className="w-full hidden md:flex justify-center px-6 pointer-events-auto relative group">
        {/* Left scroll chevron */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl text-white/60 hover:text-white hover:border-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto py-2 px-8 max-w-[70vw] scrollbar-none mask-fade-edges"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center gap-1.5 px-4.5 py-2 rounded-full border text-[11px] font-mono tracking-wider uppercase whitespace-nowrap transition-all duration-350 cursor-pointer select-none ${
                  isActive
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] font-semibold scale-105'
                    : 'bg-black/40 text-[#8E8E93] border-white/5 backdrop-blur-xl hover:text-white hover:bg-white/10 hover:border-white/15'
                }`}
              >
                <span className="text-sm">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right scroll chevron */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl text-white/60 hover:text-white hover:border-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Mobile Version: Upward Dropdown */}
      <div className="md:hidden absolute bottom-0 right-0 pointer-events-auto z-50">
        <div className="relative flex flex-col items-end">
          {/* Dropdown Menu */}
          <div className={`absolute bottom-full right-0 mb-3 flex flex-col gap-1.5 p-2 rounded-3xl bg-black/80 backdrop-blur-3xl border border-white/10 scrollbar-none origin-bottom transition-all duration-300 w-[140px] max-h-[320px] overflow-y-auto ${isMobileMenuOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}`}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer select-none ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs">{cat.emoji}</span>
                  <span className="flex-1 text-left">{cat.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`w-[44px] h-[44px] rounded-full border border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-300 ${activeCatObj ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black/60 text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            {activeCatObj ? (
              <span className="text-xl">{activeCatObj.emoji}</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
