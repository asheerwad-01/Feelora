import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Track } from "../types";
import LyricsPane from "./LyricsPane";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Disc,
  Info
} from "lucide-react";

interface MusicPlayerProps {
  track: Track;
  onBack: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export default function MusicPlayer({
  track,
  onBack,
  onNextTrack,
  onPrevTrack
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // fallback to 30 second Spotify preview standard
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isCoverError, setIsCoverError] = useState(false);

  // Initialize and handle Audio instance updates
  useEffect(() => {
    // Stop and clear previous audio instance
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(track.audioUrl);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;
    audio.loop = isLooping;

    // Track state binding events
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 30);
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log("Play failed on loop:", err));
      } else {
        onNextTrack(); // go to next card automatically when a preview concludes
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    // Auto-play the newly loaded track
    audio.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn("Auto-play blocked by browsers or failed:", err);
        setIsPlaying(false);
      });

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [track]);

  // Handle loop toggle changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Handle volume controls change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log("Manual play triggered fail:", err));
    }
  };

  const handleSliderSeek = (e: ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekValue = parseFloat(e.target.value);
    audioRef.current.currentTime = seekValue;
    setCurrentTime(seekValue);
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
  };

  const handleSeekFromLyrics = (timeMs: number) => {
    if (!audioRef.current) return;
    const seekSecNode = timeMs / 1000;
    audioRef.current.currentTime = Math.min(duration, seekSecNode);
    setCurrentTime(seekSecNode);
  };

  // Double check formatting calculations for rendering timeline timestamps cleanly
  const formatTime = (secondsOfTrack: number) => {
    if (isNaN(secondsOfTrack)) return "0:00";
    const mins = Math.floor(secondsOfTrack / 60);
    const secs = Math.floor(secondsOfTrack % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#06050b]/98 backdrop-blur-2xl flex flex-col p-4 md:p-8 animate-fade-in text-white overflow-y-auto">
      {/* Dynamic ambient color blurs spread out across the background */}
      <div
        className="absolute top-[10%] left-[5%] w-[450px] h-[450px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: track.color || "#10b981" }}
      />
      <div
        className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full blur-[120px] opacity-15 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: track.color || "#3b82f6" }}
      />

      {/* Top action header panel */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto mb-6 md:mb-10 relative z-10">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 hover:bg-white/15 hover:border-white/20 active:scale-95 px-5 py-2.5 rounded-full border border-white/10 transition-all font-sans text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 text-gray-300 transition-transform group-hover:-translate-x-1" />
          <span>Return To Sphere</span>
        </button>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-[9px] uppercase font-bold text-emerald-400 tracking-widest leading-none">
            30S REAL-PREVIEW DECK
          </span>
        </div>
      </div>

      {/* Main split grid column workspace */}
      <div className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pb-8 items-stretch relative z-10">
        
        {/* LEFT COLUMN: GORGEOUS GLASS ALBUM AND MUSIC PLAYER DIALS */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center bg-zinc-950/45 border border-white/10 rounded-[32px] p-6 md:p-10 relative overflow-hidden backdrop-blur-md shadow-2xl self-center w-full">
          
          {/* Internal card glass gloss glow highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative w-52 h-52 md:w-72 md:h-72 mb-8 group">
            {/* Spinning vinyl placeholder frame or premium cover shadow */}
            <div 
              className="absolute inset-x-0 inset-y-0 rounded-[24px] bg-gradient-to-tr from-black via-zinc-900 to-zinc-800 flex items-center justify-center border border-white/10 transition-transform duration-700 group-hover:scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              style={{
                boxShadow: isPlaying 
                  ? `0 25px 60px -15px ${track.color}45, 0 10px 30px -10px rgba(0,0,0,0.5)`
                  : '0 20px 50px rgba(0,0,0,0.8)'
              }}
            >
              {isCoverError ? (
                <Disc className="w-20 h-20 text-zinc-600 animate-spin" />
              ) : (
                <img
                  src={track.artwork}
                  alt={track.title}
                  onError={() => setIsCoverError(true)}
                  className={`w-full h-full object-cover rounded-[24px] transition-transform duration-[12000ms] ease-linear ${
                    isPlaying ? "rotate-[360deg]" : ""
                  }`}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            
            {/* Minimal focal vinyl record center pin widget */}
            {isPlaying && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/85 shadow-2xl border border-white/15 flex items-center justify-center">
                <div 
                  className="w-3.5 h-3.5 rounded-full animate-pulse" 
                  style={{ backgroundColor: track.color || "#10b981" }}
                />
              </div>
            )}
          </div>

          {/* Core metadata label card */}
          <div className="text-center w-full mb-8 relative z-10">
            <h1 className="font-sans text-2xl md:text-3xl font-extrabold tracking-tight line-clamp-1 bg-gradient-to-b from-white to-gray-200 bg-clip-text text-transparent">
              {track.title}
            </h1>
            <p className="font-mono text-xs text-gray-400 mt-2 uppercase tracking-wider font-semibold line-clamp-1">
              {track.artist}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="font-mono text-[9px] text-gray-300 uppercase tracking-widest border border-white/10 px-2.5 py-1 rounded bg-white/5 font-semibold">
                {track.album || "SINGLE"}
              </span>
            </div>
          </div>

          {/* Control Dials Panel */}
          <div className="w-full relative z-10 space-y-6">
            
            {/* Play track progress timeline slider bar */}
            <div>
              <div className="relative group/timeline">
                <input
                  type="range"
                  min={0}
                  max={duration || 30}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSliderSeek}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400 group-hover/timeline:h-1.5 transition-all"
                />
                <div 
                  className="absolute bottom-1/2 -ml-1 h-3 w-3 rounded-full pointer-events-none transition-all scale-0 group-hover/timeline:scale-100 opacity-60"
                  style={{ 
                    backgroundColor: track.color || "#10b981", 
                    left: `${(currentTime / (duration || 30)) * 100}%` 
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="font-mono text-[10px] text-zinc-400 font-bold tracking-tight">
                  {formatTime(currentTime)}
                </span>
                <span className="font-mono text-[10px] text-zinc-400 font-bold tracking-tight">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Micro functional buttons row */}
            <div className="flex justify-between items-center px-4">
              <button
                onClick={() => setIsShuffling(!isShuffling)}
                className={`transition-all p-2 rounded-full hover:bg-white/5 active:scale-90 ${isShuffling ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-gray-400 hover:text-white"}`}
                title="Shuffle Tracks"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={onPrevTrack}
                className="p-2 text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-90"
                title="Prev Track"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white text-black hover:scale-105 active:scale-95 rounded-full flex items-center justify-center shadow-2xl transition-all relative group"
                style={{
                  boxShadow: isPlaying 
                    ? `0 0 35px -5px ${track.color || "#10b981"}aa`
                    : 'none'
                }}
                title={isPlaying ? "Pause" : "Play"}
              >
                <span className="absolute inset-0 rounded-full border border-white opacity-0 group-hover:scale-110 group-hover:opacity-40 transition-all duration-300" />
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current text-black" />
                ) : (
                  <Play className="w-5 h-5 fill-current text-black translate-x-0.5" />
                )}
              </button>

              <button
                onClick={onNextTrack}
                className="p-2 text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-90"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`transition-all p-2 rounded-full hover:bg-white/5 active:scale-90 ${isLooping ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-gray-400 hover:text-white"}`}
                title="Loop Mode"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Volume sliders control panel */}
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white transition-all active:scale-90"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:bg-white/15 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 justify-center opacity-40 font-mono text-[8px] uppercase tracking-widest text-center">
              <Info className="w-3 h-3 text-emerald-400" />
              <span>Damping & Inertia dynamic controllers online</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE STREAMING LYRICS DISPLAY PANEL */}
        <div className="lg:col-span-7 flex flex-col h-[450px] md:h-auto min-h-[450px] lg:min-h-[500px] w-full">
          <LyricsPane
            track={track}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onSeek={handleSeekFromLyrics}
          />
        </div>
      </div>
    </div>
  );
}
