'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Spatial Controls Component
// Floating controls including a 3D D-pad and a Zoom-in/Zoom-out bar
// ─────────────────────────────────────────────────────────────

import { useAppStore } from '@/store/useAppStore';

export function SpatialControls() {
  const {
    navigationControls,
    setNavigationControl,
    cameraZoom,
    setCameraZoom,
    isFocusMode,
    hasLaunchedUniverse,
    isLyricsOpen,
  } = useAppStore();

  if (!hasLaunchedUniverse || isFocusMode) return null;

  // Bind mouse and touch events for holding directional arrows
  const bindDirection = (control: 'up' | 'down' | 'left' | 'right') => {
    return {
      onMouseDown: () => setNavigationControl(control, true),
      onMouseUp: () => setNavigationControl(control, false),
      onMouseLeave: () => setNavigationControl(control, false),
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        setNavigationControl(control, true);
      },
      onTouchEnd: () => setNavigationControl(control, false),
    };
  };

  // Zoom button increments
  const handleZoomIncrement = (amount: number) => {
    setCameraZoom(Math.max(5, Math.min(130, cameraZoom + amount)));
  };

  return (
    <div className={`fixed z-40 pointer-events-auto select-none flex flex-col md:flex-row items-center gap-4 md:gap-6 top-1/2 -translate-y-1/2 left-2 md:top-auto md:translate-y-0 md:bottom-8 md:left-auto md:right-8 scale-[0.8] md:scale-100 origin-left md:origin-bottom-right transition-opacity duration-300 ${isLyricsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* 1. D-Pad Directional Controller */}
      <div 
        className="w-[105px] h-[105px] rounded-full relative bg-black/45 backdrop-blur-[50px] backdrop-saturate-150 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-center"
      >
        {/* Up Arrow */}
        <button
          {...bindDirection('up')}
          className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer ${
            navigationControls.up ? 'scale-90 text-[#BF5AF2]' : 'hover:scale-105'
          }`}
          title="Rotate Up"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>

        {/* Down Arrow */}
        <button
          {...bindDirection('down')}
          className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer ${
            navigationControls.down ? 'scale-90 text-[#BF5AF2]' : 'hover:scale-105'
          }`}
          title="Rotate Down"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Left Arrow */}
        <button
          {...bindDirection('left')}
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer ${
            navigationControls.left ? 'scale-90 text-[#BF5AF2]' : 'hover:scale-105'
          }`}
          title="Rotate Left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          {...bindDirection('right')}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer ${
            navigationControls.right ? 'scale-90 text-[#BF5AF2]' : 'hover:scale-105'
          }`}
          title="Rotate Right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Center Indicator dot */}
        <div 
          className={`w-3.5 h-3.5 rounded-full border border-white/20 transition-all duration-300 ${
            Object.values(navigationControls).some(Boolean)
              ? 'bg-[#BF5AF2] scale-110 shadow-[0_0_12px_#BF5AF2]'
              : 'bg-white/10 scale-100'
          }`}
        />
      </div>

      {/* 2. Zoom-in Zoom-out Slider Bar */}
      <div 
        className="flex flex-col items-center gap-2.5 p-3 rounded-full bg-black/45 backdrop-blur-[50px] backdrop-saturate-150 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.6)] w-10.5"
      >
        {/* Zoom In Button */}
        <button
          onClick={() => handleZoomIncrement(-6)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90 font-bold"
          title="Zoom In"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Vertical range track simulator (slider) */}
        <div className="relative h-28 w-4 flex items-center justify-center">
          <input
            type="range"
            min="5"
            max="130"
            step="1"
            value={cameraZoom}
            onChange={(e) => setCameraZoom(parseInt(e.target.value))}
            className="cursor-pointer accent-white absolute origin-center"
            style={{
              transform: 'rotate(270deg)',
              width: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '9999px',
              outline: 'none',
              WebkitAppearance: 'none',
              height: '4px',
            }}
          />
        </div>

        {/* Zoom Out Button */}
        <button
          onClick={() => handleZoomIncrement(6)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90 font-bold"
          title="Zoom Out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

    </div>
  );
}
