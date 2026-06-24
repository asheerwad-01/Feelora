'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Navigation Bar
// Floating VisionOS-style glassmorphism tab bar
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function NavigationBar() {
  const { activeTab, setActiveTab, triggerResetView } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { id: 'universe', label: 'Universe' },
    { id: 'discover', label: 'Discover' },
    { id: 'library', label: 'Library' },
  ];

  return (
    <div className="relative z-50">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden flex items-center justify-center w-[34px] h-[34px] rounded-full bg-black/40 border border-white/10 backdrop-blur-2xl text-white/70 hover:text-white transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Desktop Bar & Mobile Dropdown */}
      <div className={`
        absolute top-[calc(100%+8px)] left-0 md:static
        flex flex-col md:flex-row items-stretch md:items-center gap-1 p-1 
        rounded-2xl md:rounded-full bg-black/80 md:bg-black/40 border border-white/10 md:border-white/5 
        backdrop-blur-3xl shadow-lg transition-all origin-top
        ${isMenuOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none md:scale-100 md:opacity-100 md:pointer-events-auto'}
      `}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setIsMenuOpen(false);
            }}
            className={`px-4.5 py-3 md:py-1.5 rounded-xl md:rounded-full text-[10px] font-mono tracking-widest uppercase transition-all duration-350 cursor-pointer select-none text-left md:text-center min-w-[120px] md:min-w-0 ${
              activeTab === tab.id
                ? 'bg-white text-black font-semibold shadow-md scale-100'
                : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="hidden md:block w-px h-4 bg-white/10 mx-1" />

        <button
          onClick={() => {
            triggerResetView();
            setIsMenuOpen(false);
          }}
          className="px-4.5 py-3 md:py-1.5 rounded-xl md:rounded-full text-[10px] font-mono tracking-widest uppercase transition-all duration-350 cursor-pointer select-none text-left md:text-center min-w-[120px] md:min-w-0 text-[#8E8E93] hover:text-white hover:bg-white/5 flex items-center gap-2"
          title="Reset View"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="md:hidden">Reset View</span>
        </button>
      </div>
    </div>
  );
}
