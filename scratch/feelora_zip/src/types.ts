/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  audioUrl: string; // fallback or streaming link
  coverUrl: string; // Unsplash high-resolution coordinate
  accentColor: string; // Tailwind hex color (e.g. #0A84FF)
  secondaryColor: string; // Gradient partner (e.g. #0056B3)
  synthSettings: {
    baseFreq: number;
    scale: number[];
    type: OscillatorType;
    detune: number;
    delayTime: number;
    feedback: number;
    filterFreq: number;
  };
  description: string;
  beatsPerMinute: number;
}

export interface MoodCollection {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  description: string;
  quote: string;
  quoteAuthor: string;
  accentColor: string;
  secondaryColor: string;
  artworkUrl: string;
  tracks: Track[];
}

export type ViewState = 'home' | 'discover' | 'library' | 'nowplaying';

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  queue: Track[];
  currentQueueIndex: number;
  audioSourceType: 'synthesizer' | 'stream';
}
