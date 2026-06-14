'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Navigation Bar
// Floating VisionOS-style glassmorphism tab bar
// ─────────────────────────────────────────────────────────────

import { useAppStore } from '@/store/useAppStore';

export function NavigationBar() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-2xl shadow-lg">
      <button
        onClick={() => setActiveTab('universe')}
        className={`px-4.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all duration-350 cursor-pointer select-none ${
          activeTab === 'universe'
            ? 'bg-white text-black font-semibold shadow-md scale-100'
            : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
        }`}
      >
        Universe
      </button>
      <button
        onClick={() => setActiveTab('discover')}
        className={`px-4.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all duration-350 cursor-pointer select-none ${
          activeTab === 'discover'
            ? 'bg-white text-black font-semibold shadow-md scale-100'
            : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
        }`}
      >
        Discover
      </button>
      <button
        onClick={() => setActiveTab('library')}
        className={`px-4.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all duration-350 cursor-pointer select-none ${
          activeTab === 'library'
            ? 'bg-white text-black font-semibold shadow-md scale-100'
            : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
        }`}
      >
        Library
      </button>
    </div>
  );
}
