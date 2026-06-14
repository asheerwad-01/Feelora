import { useEffect, useRef, useState } from "react";
import { LyricLine, Track } from "../types";
import { Music, Sparkles } from "lucide-react";

interface LyricsPaneProps {
  track: Track;
  currentTime: number; // in seconds
  isPlaying: boolean;
  onSeek: (timeMs: number) => void;
}

export default function LyricsPane({
  track,
  currentTime,
  isPlaying,
  onSeek
}: LyricsPaneProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Fetch lyrics whenever the track changes
  useEffect(() => {
    let activeFetch = true;
    setIsLoading(true);
    setIsAiGenerated(false);
    setActiveIndex(-1);
    setLyrics([]);

    const fetchLyrics = async () => {
      try {
        const url = `/api/lyrics?trackId=${encodeURIComponent(track.id)}&title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not fetch lyrics");
        const data = await res.json();
        
        if (activeFetch) {
          setLyrics(data);
          // If the song is not part of the standard curated set, it is AI-generated
          if (!track.id.startsWith("curated_")) {
            setIsAiGenerated(true);
          }
        }
      } catch (err) {
        console.error("Failed to load lyrics:", err);
        // Fallback placeholder
        if (activeFetch) {
          setLyrics([
            { time: 0, text: "🎵 [Instrumental Beats] 🎵" },
            { time: 5000, text: `Listening to ${track.title}` },
            { time: 10000, text: "Lyrics synchronization continues..." },
            { time: 15000, text: "Enjoy this curated audio sphere!" }
          ]);
        }
      } finally {
        if (activeFetch) {
          setIsLoading(false);
        }
      }
    };

    fetchLyrics();

    return () => {
      activeFetch = false;
    };
  }, [track]);

  // Synchronize dynamic highlighted line index based on current playback time (in ms)
  useEffect(() => {
    if (lyrics.length === 0) return;

    const currentMs = currentTime * 1000;
    
    // Find the latest lyric line that has already started
    let foundIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentMs >= lyrics[i].time) {
        foundIndex = i;
      } else {
        break;
      }
    }

    if (foundIndex !== activeIndex) {
      setActiveIndex(foundIndex);
      
      // Apple-style smooth scroll aligning active lyric into vertical focus center
      if (foundIndex >= 0 && lineRefs.current[foundIndex]) {
        lineRefs.current[foundIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }
  }, [currentTime, lyrics, activeIndex]);

  return (
    <div className="h-full flex flex-col bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden shadow-xl p-6 md:p-8">
      {/* Lyric header indicator */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-emerald-400" />
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gray-300">
            Synchronized Transcript
          </span>
        </div>
        {isAiGenerated && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 rounded-full px-3 py-1 text-[10px] font-mono border border-emerald-500/25">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>AI SYNC ACTIVE</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span className="font-sans text-xs text-gray-400 animate-pulse uppercase tracking-widest">
            Transcribing & Syncing...
          </span>
        </div>
      ) : lyrics.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
          <p className="font-sans text-sm text-gray-400">No lyrics available for this track.</p>
        </div>
      ) : (
        // Lyrics flow sheet
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto no-scrollbar scroll-smooth space-y-6 md:space-y-8 py-[120px] px-2 h-full"
          id="lyrics-scroll-pane"
        >
          {lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const isPassed = index < activeIndex;

            return (
              <p
                key={index}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                onClick={() => onSeek(line.time)}
                className={`transition-all duration-500 cursor-pointer text-left select-none text-base md:text-xl lg:text-2xl font-bold rounded-xl py-2 px-3 hover:bg-white/5 active:scale-[0.98] ${
                  isActive
                    ? "text-white scale-100 opacity-100 filter drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] font-sans"
                    : isPassed
                    ? "text-gray-500 scale-95 opacity-55 font-sans"
                    : "text-gray-600 scale-95 opacity-30 font-sans"
                }`}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      )}

      {/* Footer Hint */}
      <div className="mt-4 pt-3 border-t border-white/5 text-center">
        <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
          💡 Click any lyric line to instantly seek play timestamp
        </p>
      </div>
    </div>
  );
}
