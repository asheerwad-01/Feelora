export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  audioUrl: string;
  color: string;
  isSpotifyOriginal?: boolean;
}

export interface LyricLine {
  time: number; // millisecond timestamp
  text: string;
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
}
