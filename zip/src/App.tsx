import { useEffect, useState, FormEvent } from "react";
import { Track } from "./types";
import SphericalGallery from "./components/SphericalGallery";
import MusicPlayer from "./components/MusicPlayer";
import {
  Search,
  Grid,
  Globe,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  X,
  MessageSquare,
  Info
} from "lucide-react";

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"sphere" | "grid">("sphere");
  const [filterMode, setFilterMode] = useState<"all" | "spotify" | "curated">("all");
  
  // Dynamic 3D bloom control parameters
  const [bloomStrength, setBloomStrength] = useState(1.5);
  const [bloomThreshold, setBloomThreshold] = useState(0.12);
  
  // Real-time ticking world clock states matching screenshot overlays
  const [londonTime, setLondonTime] = useState("");
  const [aucklandTime, setAucklandTime] = useState("");
  const [tokyoTime, setTokyoTime] = useState("");

  // Contact modal state triggered by "Let's Talk" button
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", msg: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load curated hits from endpoint on startup
  useEffect(() => {
    const fetchDefaultTracks = async () => {
      try {
        const res = await fetch("/api/tracks");
        if (!res.ok) throw new Error("Could not load curated tracks");
        const data = await res.json();
        setTracks(data);
      } catch (err) {
        console.error("Failed to load initial tracks:", err);
      }
    };
    fetchDefaultTracks();
  }, []);

  // Update ticking world clocks in true London/Auckland format
  useEffect(() => {
    const updateClocks = () => {
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      };

      setLondonTime(
        new Date().toLocaleTimeString("en-GB", { ...options, timeZone: "Europe/London" })
      );
      setAucklandTime(
        new Date().toLocaleTimeString("en-GB", { ...options, timeZone: "Pacific/Auckland" })
      );
      setTokyoTime(
        new Date().toLocaleTimeString("en-GB", { ...options, timeZone: "Asia/Tokyo" })
      );
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  // Spotify Search Engine integration
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // If empty query, restore default curated tracks
      setIsSearching(true);
      try {
        const res = await fetch("/api/tracks");
        const data = await res.json();
        setTracks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();
      setTracks(data);
    } catch (err) {
      console.error("Search error encountered:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Skip handlers passed directly into custom music deck
  const handleNextTrack = () => {
    if (!selectedTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === selectedTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setSelectedTrack(tracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (!selectedTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === selectedTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setSelectedTrack(tracks[prevIndex]);
  };

  // Filter songs locally by origin or tag
  const filteredTracks = tracks.filter((t) => {
    if (filterMode === "spotify") return t.isSpotifyOriginal === true;
    if (filterMode === "curated") return !t.isSpotifyOriginal;
    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#030205] text-white flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* 1. TOP HERO HEADER PANEL (Matches layout in screenshot) */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#030205]/80 backdrop-blur-md z-30 flex items-center justify-between">
        
        {/* Left corner Brand Icon: Modern vector Phantom Mascot SVG */}
        <div className="flex items-center gap-3">
          <svg
            className="w-10 h-10 text-white fill-current transition-transform duration-500 hover:rotate-12 cursor-pointer"
            viewBox="0 0 100 100"
            id="brand-phantom-mascot"
          >
            <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm15.4 69.4c0 3-2.5 5.5-5.5 5.5s-5.5-2.5-5.5-5.5l.5-12.7c-3.1.9-6.4.9-9.5 0l.5 12.7c0 3-2.5 5.5-5.5 5.5s-5.5-2.5-5.5-5.5c0-4.6 1.8-19.1 1.8-21.8 0-11 5-18.7 13.3-21 2.3-.6 4.7-.6 7 0 8.3 2.3 13.3 10 13.3 21 0 2.7 1.8 17.2 1.8 21.8zm-22-26.4c-2.3 0-4.1-1.8-4.1-4.1s1.8-4.1 4.1-4.1 4.1 1.8 4.1 4.1-1.8 4.1-4.1 4.1zm13.2 0c-2.3 0-4.1-1.8-4.1-4.1s1.8-4.1 4.1-4.1 4.1 1.8 4.1 4.1-1.8 4.1-4.1 4.1z" />
          </svg>
          <div>
            <span className="font-sans font-extrabold text-sm uppercase tracking-widest text-[#ffffff] block">
              PHANTOM
            </span>
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block font-medium -mt-1">
              Acoustic Dimension
            </span>
          </div>
        </div>

        {/* Center Top: Scrolling Ticker Marquee with agency summary */}
        <div className="hidden lg:flex flex-1 max-w-lg mx-10 overflow-hidden relative font-sans text-[11px] font-bold text-gray-400 tracking-wide border-l border-r border-white/10 px-4">
          <div className="whitespace-nowrap animate-marquee block py-1">
            ⚡ PHANTOM IS A TECHNOLOGY-LED CREATIVE AGENCY CRAFTING EXPERIENCES FOR GLOBAL BRANDS • ACOUSTIC SPHERE EXPERIENCE INTEGRATES THE SPOTIFY WEB ENGINE ⚡
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            .animate-marquee {
              animation: marquee 25s linear infinite;
              display: inline-block;
            }
          `}</style>
        </div>

        {/* Right Corner Buttons: Clocks, Interactive sound toggle & Let's Talk call-to-action */}
        <div className="flex items-center gap-6">
          
          {/* Real-time clocks */}
          <div className="hidden md:flex items-center gap-4 text-right font-mono text-[10px] tracking-widest text-gray-400 border-r border-white/10 pr-6 mr-2">
            <div>
              <span className="block text-gray-500 font-semibold uppercase">LONDON, UK</span>
              <span className="block text-white font-bold mt-0.5">{londonTime || "08:10 GMT"}</span>
            </div>
            <div>
              <span className="block text-gray-500 font-semibold uppercase">AUCKLAND, NZ</span>
              <span className="block text-white font-bold mt-0.5">{aucklandTime || "19:10 GMT"}</span>
            </div>
          </div>

          {/* Sound Toggle widget */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="flex items-center gap-2 hover:bg-white/10 active:scale-95 transition-all px-3 py-1.5 rounded-full border border-white/10 font-mono text-[10px] font-bold uppercase tracking-wider"
          >
            {soundOn ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SOUND [ON]</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>SOUND [OFF]</span>
              </>
            )}
          </button>

          {/* Call-to-action Let's Talk button block */}
          <button
            onClick={() => setIsContactOpen(true)}
            className="bg-white hover:bg-emerald-400 hover:text-black hover:scale-105 active:scale-95 text-black font-sans font-bold text-xs px-5 py-2 rounded-full transition-all border border-white"
          >
            Let's Talk
          </button>
        </div>
      </header>

      {/* 2. DYNAMIC SPOTIFY SEARCH BAR HUB CONTAINER */}
      <section className="px-6 py-4 bg-[#030205] z-20">
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search Spotify Songs, Artists, Albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 hover:bg-white/8 transition-all border border-white/10 focus:border-emerald-400/50 rounded-full py-2.5 pl-12 pr-28 text-sm placeholder-gray-500 text-white outline-none font-sans"
            />
            <Search className="absolute left-4 w-4 h-4 text-gray-400" />
            <div className="absolute right-2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    // Restore original
                    fetch("/api/tracks")
                      .then((res) => res.json())
                      .then((data) => setTracks(data));
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching}
                className="bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 text-black text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 transition-all"
              >
                {isSearching ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. CORE VIEWPORT ZONE: WEBGL SPHERICAL CANVAS OR HIGH CONTRAST GRID BLOCK */}
      <main className="flex-1 relative bg-[#030205]">
        {layoutMode === "sphere" ? (
          <SphericalGallery
            tracks={filteredTracks}
            onSelectTrack={setSelectedTrack}
            selectedTrack={selectedTrack}
            bloomStrength={bloomStrength}
            bloomThreshold={bloomThreshold}
          />
        ) : (
          /* High-Contrast Grid View Backup Mode */
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => setSelectedTrack(track)}
                className="group relative cursor-pointer bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all transform hover:-translate-y-1 shadow-md hover:shadow-2xl"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden mb-4 relative">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold">
                      ▶
                    </div>
                  </div>
                </div>
                <h3 className="font-sans font-extrabold text-sm text-white line-clamp-1">{track.title}</h3>
                <p className="font-mono text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{track.artist}</p>
                <div className="absolute bottom-4 right-4 bg-emerald-500/20 text-emerald-400 text-[8px] font-mono px-1.5 rounded uppercase font-bold tracking-widest border border-emerald-500/35 opacity-0 group-hover:opacity-100 transition-opacity">
                  PLAY
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. ACTIVE PLAYBACK FLOATING DECK OVERLAY */}
        {selectedTrack && (
          <MusicPlayer
            track={selectedTrack}
            onBack={() => setSelectedTrack(null)}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
          />
        )}
      </main>

      {/* 5. FOOTER CONTROL NAVIGATION BAR (Sourced from screenshot) */}
      <footer className="px-6 py-4 border-t border-white/5 bg-[#030205] z-25 flex flex-col xl:flex-row items-center justify-between gap-4 flex-wrap">
        
        {/* Layout Switch Option on bottom left */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-full">
          <button
            onClick={() => setLayoutMode("sphere")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              layoutMode === "sphere" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3D Spherical</span>
          </button>
          <button
            onClick={() => setLayoutMode("grid")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              layoutMode === "grid" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Classic Index</span>
          </button>
        </div>

        {/* Navigation links center menu matching layout */}
        <div className="flex items-center bg-white/5 border border-white/10 px-6 py-1.5 rounded-full gap-8 text-xs font-semibold font-sans">
          <button
            onClick={() => {
              alert("Acoustic Sphere 1.0 represents a modern real-time WebGL space. Search is directly bound to Spotify API token networks.");
            }}
            className="text-white hover:text-emerald-400 transition-colors uppercase tracking-widest text-[10px]"
          >
            Library Overview
          </button>
          <button
            onClick={() => {
              alert("System is operating in real-time. Sound playback is delivered using native 44.1Khz floating node filters.");
            }}
            className="text-white hover:text-emerald-400 transition-colors uppercase tracking-widest text-[10px]"
          >
            Acoustics
          </button>
          <button
            onClick={() => {
              setIsContactOpen(true);
            }}
            className="text-white hover:text-emerald-400 transition-colors uppercase tracking-widest text-[10px]"
          >
            Connect
          </button>
        </div>

        {/* Dynamic Bloom Intensity & Threshold Control Hub */}
        {layoutMode === "sphere" ? (
          <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 px-5 py-2 rounded-full text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Glow:</span>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.05"
                value={bloomStrength}
                onChange={(e) => setBloomStrength(parseFloat(e.target.value))}
                className="w-20 sm:w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-emerald-400 font-bold w-7 text-left">{bloomStrength.toFixed(2)}</span>
            </div>

            <div className="w-px h-3 bg-white/10 hidden md:block" />

            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Filter Gate:</span>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={bloomThreshold}
                onChange={(e) => setBloomThreshold(parseFloat(e.target.value))}
                className="w-20 sm:w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-emerald-400 font-bold w-7 text-left">{bloomThreshold.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="hidden xl:block font-mono text-[9px] text-gray-500 uppercase tracking-widest">
            (Bloom only online in 3D)
          </div>
        )}

        {/* Local Filter Button on bottom right */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest font-semibold mr-1">
            Display Filter:
          </span>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-xs font-bold font-sans rounded-full px-4 py-1.5 text-white outline-none cursor-pointer"
          >
            <option value="all" className="bg-zinc-900 text-white">Show All Tracks</option>
            <option value="curated" className="bg-zinc-900 text-white">Curated Originals</option>
            <option value="spotify" className="bg-zinc-900 text-white">Spotify Results Only</option>
          </select>
        </div>
      </footer>

      {/* 6. IMMERSIVE CONTACT INTERACTION DIALOG (Let's Talk Modal) */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0a0e] border border-white/10 rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-fade-in text-white">
            <button
              onClick={() => {
                setIsContactOpen(false);
                setIsSubmitted(false);
                setContactForm({ name: "", email: "", msg: "" });
              }}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {isSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-sans text-xl font-bold text-white">Message Dispatched!</h3>
                <p className="font-sans text-xs text-gray-400">
                  Our agency team will get back to you regarding your Acoustic Sphere feedback.
                </p>
                <button
                  onClick={() => setIsContactOpen(false)}
                  className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-6 py-2 rounded-full transition-all mt-4"
                >
                  Return to Sphere
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-sans text-lg font-bold">Pitch a Vision</h3>
                </div>
                <p className="font-sans text-xs text-gray-400 mb-6 leading-relaxed">
                  Let us build something remarkable together. Leave a message regarding custom audios, synced lyrics, or WebGL representations.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (contactForm.name && contactForm.email && contactForm.msg) {
                      setIsSubmitted(true);
                    } else {
                      alert("Please complete all sections.");
                    }
                  }}
                  className="space-y-4 font-sans text-xs"
                >
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">Your Name</label>
                    <input
                      required
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/5 border border-white/15 focus:border-emerald-400/50 outline-none rounded-xl px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">Your Email Address</label>
                    <input
                      required
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="e.g. john@example.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-emerald-400/50 outline-none rounded-xl px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">Concept Brief</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.msg}
                      onChange={(e) => setContactForm({ ...contactForm, msg: e.target.value })}
                      placeholder="e.g. Can you arrange visualizers mapping audio waveform directly on card rotations?"
                      className="w-full bg-white/5 border border-white/15 focus:border-emerald-400/50 outline-none rounded-xl px-4 py-2 text-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-emerald-400 hover:text-black font-bold py-2.5 rounded-full text-black text-xs transition-all uppercase tracking-wider mt-2 border border-white"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
