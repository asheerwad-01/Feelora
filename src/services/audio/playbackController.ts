// ─────────────────────────────────────────────────────────────
// Feelora 2 — Unified Playback Controller
// Manages Spotify SDK, HTML5 Audio, and YouTube Iframe Player streams
// ─────────────────────────────────────────────────────────────

import { spotifyPlayer } from '../spotify/spotifyPlayer';
import { audioAnalyzer } from './audioAnalyzer';
import { useAppStore } from '@/store/useAppStore';

let fallbackAudio: HTMLAudioElement | null = null;
// Track which playback engine is actively running
let activePlayer: 'spotify' | 'fallback' | 'procedural' = 'procedural';

if (typeof window !== 'undefined') {
  fallbackAudio = new Audio();
}



export const playbackController = {
  setActivePlayer(player: 'spotify' | 'fallback' | 'procedural') {
    activePlayer = player;
    console.log('[PlaybackController] Active player engine switched to:', player);
  },

  async play(
    song: any,
    spotifyDeviceId: string | null,
    isPremium: boolean,
    volume: number
  ): Promise<void> {
    const store = useAppStore.getState();

    // 1. Reset standard fallback audio and clear YouTube intervals
    if (fallbackAudio) {
      fallbackAudio.pause();
      fallbackAudio.src = '';
      fallbackAudio.removeAttribute('crossOrigin');
      fallbackAudio.onerror = null;
      audioAnalyzer.disconnect();
    }


    const isSpotifyActive =
      song.isSpotifyTrack && song.spotifyUri && spotifyDeviceId && isPremium;
    if (isSpotifyActive) {
      // 2. Play on Spotify Web Player SDK
      try {
        await spotifyPlayer.play(song.spotifyUri!);
        activePlayer = 'spotify';
        store.setIsPlaying(true);
      } catch (err) {
        console.error('[PlaybackController] Spotify SDK Play error:', err);
      }
    } else {
      // 4. Fallback to HTML5 audio element preview (Spotify Free)
      if (spotifyDeviceId) {
        spotifyPlayer.pause().catch(() => {});
      }

      if (song.audioUrl) {
        if (fallbackAudio) {
          fallbackAudio.crossOrigin = 'anonymous';
          fallbackAudio.src = song.audioUrl;
          fallbackAudio.volume = volume;

          fallbackAudio.onended = () => {
            store.setIsPlaying(false);
            store.setProgress(0);
            audioAnalyzer.stop();
          };

          fallbackAudio.ontimeupdate = () => {
            store.setProgress(fallbackAudio!.currentTime);
          };

          fallbackAudio.onerror = () => {
            if (fallbackAudio && fallbackAudio.crossOrigin === 'anonymous') {
              console.warn('[PlaybackController] CORS media load failed. Falling back to non-CORS direct playback.');
              fallbackAudio.removeAttribute('crossOrigin');
              fallbackAudio.src = song.audioUrl;
              fallbackAudio.load();
              fallbackAudio.play().then(() => {
                activePlayer = 'fallback';
                store.setIsPlaying(true);
                audioAnalyzer.disconnect();
                audioAnalyzer.setBpmFromTrack(song.title);
                audioAnalyzer.start();
              }).catch((err) => {
                console.error('[PlaybackController] Fallback audio playback failed completely:', err);
                store.setIsPlaying(false);
              });
            }
          };

          try {
            await fallbackAudio.play();
            activePlayer = 'fallback';
            store.setIsPlaying(true);

            // Connect analyzer for real-time visualization
            audioAnalyzer.connectToElement(fallbackAudio);
            audioAnalyzer.start();
          } catch (err) {
            console.warn('[PlaybackController] Fallback Audio play error:', err);
            store.setIsPlaying(false);
          }
        }
      } else {
        // Procedural fallback (e.g. for tracks without preview URLs)
        activePlayer = 'procedural';
        store.setIsPlaying(true);
        if (song.title) {
          audioAnalyzer.setBpmFromTrack(song.title);
        }
        audioAnalyzer.start();
      }
    }
  },

  async pause(isSpotify: boolean): Promise<void> {
    const store = useAppStore.getState();

    if (activePlayer === 'spotify') {
      await spotifyPlayer.pause();
    } else if (activePlayer === 'fallback') {
      if (fallbackAudio) {
        fallbackAudio.pause();
      }
      audioAnalyzer.stop();
    } else {
      audioAnalyzer.stop();
    }
    store.setIsPlaying(false);
  },

  async resume(isSpotify: boolean, currentTrackTitle?: string): Promise<void> {
    const store = useAppStore.getState();

    if (activePlayer === 'spotify') {
      await spotifyPlayer.resume();
    } else if (activePlayer === 'fallback') {
      if (fallbackAudio && fallbackAudio.src) {
        try {
          await fallbackAudio.play();
          audioAnalyzer.start();
        } catch (err) {
          console.warn('[PlaybackController] Fallback Audio resume error:', err);
        }
      }
    } else {
      if (currentTrackTitle) {
        audioAnalyzer.setBpmFromTrack(currentTrackTitle);
      }
      audioAnalyzer.start();
    }
    store.setIsPlaying(true);
  },

  async seek(seconds: number, isSpotify: boolean): Promise<void> {
    const store = useAppStore.getState();

    if (activePlayer === 'spotify') {
      await spotifyPlayer.seek(seconds * 1000);
    } else if (activePlayer === 'fallback') {
      if (fallbackAudio && fallbackAudio.src) {
        fallbackAudio.currentTime = seconds;
      }
    }
    store.setProgress(seconds);
  },

  async setVolume(volume: number, isSpotify: boolean): Promise<void> {
    if (activePlayer === 'spotify') {
      await spotifyPlayer.setVolume(volume).catch(() => {});
    } else if (activePlayer === 'fallback') {
      if (fallbackAudio) {
        fallbackAudio.volume = volume;
      }
    }
  },
};
