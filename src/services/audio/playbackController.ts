// ─────────────────────────────────────────────────────────────
// Feelora 2 — Unified Playback Controller
// Manages Spotify SDK, HTML5 Audio, and YouTube Iframe Player streams
// ─────────────────────────────────────────────────────────────

import { spotifyPlayer } from '../spotify/spotifyPlayer';
import { audioAnalyzer } from './audioAnalyzer';
import { useAppStore } from '@/store/useAppStore';

let fallbackAudio: HTMLAudioElement | null = null;
let ytPlayer: any = null;
let ytPlayerReady = false;
let ytProgressInterval: ReturnType<typeof setInterval> | null = null;

// Track which playback engine is actively running
let activePlayer: 'spotify' | 'youtube' | 'fallback' | 'procedural' = 'procedural';

// YouTube candidate list playback state
let ytCandidates: string[] = [];
let ytCandidateIndex = 0;
let activeSong: any = null;

if (typeof window !== 'undefined') {
  fallbackAudio = new Audio();
}

/**
 * Handles YouTube playback failures by falling back to the HTML5 audio preview
 */
function handleYouTubePlaybackFailure(song: any) {
  const store = useAppStore.getState();
  store.setIsLoading(false);

  // Hide YouTube player container
  const container = document.getElementById('feelora-yt-player-container');
  if (container) {
    container.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    container.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
  }
  if (ytPlayer && ytPlayerReady) {
    try {
      ytPlayer.pauseVideo();
    } catch {}
  }

  if (song && song.audioUrl) {
    console.log(`[PlaybackController] YouTube playback failed. Falling back to HTML5 audio preview: ${song.audioUrl}`);
    store.setLoadingMessage('YouTube unavailable. Playing audio preview...');
    
    if (fallbackAudio) {
      fallbackAudio.crossOrigin = 'anonymous';
      fallbackAudio.src = song.audioUrl;
      fallbackAudio.volume = store.volume;

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
          console.warn('[PlaybackController] CORS fallback media load failed. Falling back to non-CORS direct playback.');
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
        } else {
          console.error('[PlaybackController] Fallback audio playback failed completely.');
          store.setIsPlaying(false);
        }
      };

      fallbackAudio.play()
        .then(() => {
          activePlayer = 'fallback';
          store.setIsPlaying(true);
          // Connect analyzer for real-time visualization
          audioAnalyzer.connectToElement(fallbackAudio!);
          audioAnalyzer.start();
        })
        .catch((err) => {
          console.error('[PlaybackController] Fallback audio play start failed:', err);
          store.setIsPlaying(false);
        });
    }
  } else {
    console.warn('[PlaybackController] YouTube playback failed and no audio fallback URL available.');
    store.setIsPlaying(false);
    audioAnalyzer.stop();
  }
}

/**
 * Attempts to play the current candidate video ID. Falls back to next candidate if failure occurs.
 */
function playActiveYoutubeCandidate() {
  const store = useAppStore.getState();

  if (!activeSong) {
    console.warn('[PlaybackController] No active song context.');
    store.setIsLoading(false);
    return;
  }

  if (ytCandidateIndex >= ytCandidates.length) {
    console.error('[PlaybackController] All YouTube search candidates failed or were blocked.');
    handleYouTubePlaybackFailure(activeSong);
    return;
  }

  const videoId = ytCandidates[ytCandidateIndex];
  console.log(`[PlaybackController] Attempting to play YouTube candidate ${ytCandidateIndex + 1}/${ytCandidates.length}: ${videoId}`);

  store.setIsLoading(true);
  store.setLoadingMessage(`Connecting to YouTube stream (${ytCandidateIndex + 1}/${ytCandidates.length})...`);

  if (ytPlayer && ytPlayerReady) {
    try {
      ytPlayer.loadVideoById(videoId);
      ytPlayer.setVolume(store.volume * 100);
      ytPlayer.playVideo();
      activePlayer = 'youtube';
      store.setIsPlaying(true);

      // Make the floating player feed container visible
      const container = document.getElementById('feelora-yt-player-container');
      if (container) {
        container.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        container.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
      }

      if (ytProgressInterval) {
        clearInterval(ytProgressInterval);
      }

      // Progress tick & dynamic duration alignment
      ytProgressInterval = setInterval(() => {
        if (ytPlayer && ytPlayerReady) {
          try {
            const time = ytPlayer.getCurrentTime();
            store.setProgress(time);

            // Update duration dynamically once video metadata loads
            const duration = ytPlayer.getDuration();
            const current = useAppStore.getState().currentTrack;
            if (duration > 0 && current && current.id === activeSong.id && current.duration !== duration) {
              useAppStore.getState().setCurrentTrack({ ...current, duration });
            }
          } catch {}
        }
      }, 250);

      // Connect analyzer and start visual beat sync
      audioAnalyzer.disconnect();
      audioAnalyzer.setBpmFromTrack(activeSong.title);
      audioAnalyzer.start();

    } catch (err) {
      console.error('[PlaybackController] Failed to play video candidate:', err);
      ytCandidateIndex++;
      playActiveYoutubeCandidate();
    }
  } else {
    console.warn('[PlaybackController] YouTube Player API is still buffering or not ready. Retrying in 500ms...');
    setTimeout(playActiveYoutubeCandidate, 500);
  }
}

/**
 * Lazy initializes the YouTube Iframe Player API inside a floating live feed panel
 */
function initYoutubePlayer() {
  if (typeof window === 'undefined') return;
  if ((window as any).YT) return; // Already loaded

  // Append YouTube Iframe API script
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }

  // Create floating live video feed container in bottom-right corner
  const playerDiv = document.createElement('div');
  playerDiv.id = 'feelora-yt-player-container';
  playerDiv.className = 'fixed bottom-[130px] right-6 w-[200px] h-[125px] rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl z-40 transition-all duration-300 pointer-events-none opacity-0 scale-95 flex flex-col';
  
  // Header bar for feed
  const header = document.createElement('div');
  header.className = 'px-3 py-1 flex items-center justify-between border-b border-white/5 bg-black/20 text-[8px] font-mono text-white/40 tracking-wider uppercase shrink-0 select-none';
  header.innerHTML = `
    <span class="flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-pulse"></span>
      YT Live Feed
    </span>
  `;
  playerDiv.appendChild(header);

  // Player inner iframe target
  const ytTarget = document.createElement('div');
  ytTarget.id = 'feelora-yt-player';
  ytTarget.className = 'flex-1 w-full bg-black';
  playerDiv.appendChild(ytTarget);
  
  document.body.appendChild(playerDiv);

  // Bind callback
  (window as any).onYouTubeIframeAPIReady = () => {
    ytPlayer = new (window as any).YT.Player('feelora-yt-player', {
      height: '100%',
      width: '100%',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 1, // Enable controls so user can skip ads/mute/unmute if required
        disablekb: 1,
        fs: 0,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: () => {
          ytPlayerReady = true;
          console.log('[YouTubePlayer] API Initialized and Ready');
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.ENDED = 0
          if (event.data === 0) {
            const store = useAppStore.getState();
            store.setIsPlaying(false);
            store.setProgress(0);
            audioAnalyzer.stop();
            
            // Hide player on end
            const container = document.getElementById('feelora-yt-player-container');
            if (container) {
              container.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
              container.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            }
          }
        },
        onError: (event: any) => {
          console.warn(`[YouTubePlayer] Error playing video ID ${ytCandidates[ytCandidateIndex]}: Code ${event.data}. Trying next candidate...`);
          ytCandidateIndex++;
          playActiveYoutubeCandidate();
        },
      },
    });
  };
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initYoutubePlayer();
  } else {
    window.addEventListener('load', initYoutubePlayer);
  }
}

export const playbackController = {
  setActivePlayer(player: 'spotify' | 'youtube' | 'fallback' | 'procedural') {
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

    if (ytProgressInterval) {
      clearInterval(ytProgressInterval);
      ytProgressInterval = null;
    }

    // Hide live video feed container initially
    const container = document.getElementById('feelora-yt-player-container');
    if (container) {
      container.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
      container.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
    }

    if (ytPlayer && ytPlayerReady) {
      try {
        ytPlayer.pauseVideo();
      } catch {}
    }

    const isSpotifyActive =
      song.isSpotifyTrack && song.spotifyUri && spotifyDeviceId && isPremium;
    const isYouTube = song.provider === 'youtube-music';

    if (isSpotifyActive) {
      // 2. Play on Spotify Web Player SDK
      try {
        await spotifyPlayer.play(song.spotifyUri!);
        activePlayer = 'spotify';
        store.setIsPlaying(true);
      } catch (err) {
        console.error('[PlaybackController] Spotify SDK Play error:', err);
      }
    } else if (isYouTube) {
      // 3. Play YouTube track in full
      activeSong = song;
      store.setIsLoading(true);
      store.setLoadingMessage(`Resolving ad-free stream for "${song.title}"...`);

      try {
        // Search for embeddable lyrics or audio video (Topic tracks block external embedding)
        const query = `${song.artist} ${song.title} lyrics`;
        const searchRes = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
        if (!searchRes.ok) throw new Error('Search API failed');
        
        const data = await searchRes.json();
        
        if (data.videoIds && data.videoIds.length > 0) {
          ytCandidates = data.videoIds;
          ytCandidateIndex = 0;
          playActiveYoutubeCandidate();
        } else if (data.videoId) {
          ytCandidates = [data.videoId];
          ytCandidateIndex = 0;
          playActiveYoutubeCandidate();
        } else {
          throw new Error('No video ID resolved');
        }
      } catch (err) {
        console.error('[PlaybackController] YouTube Playback failed:', err);
        handleYouTubePlaybackFailure(song);
      } finally {
        store.setIsLoading(false);
      }
    } else {
      // 4. Fallback to HTML5 audio element preview (Spotify Free / Apple Music)
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
    } else if (activePlayer === 'youtube' && ytPlayer && ytPlayerReady) {
      try {
        ytPlayer.pauseVideo();
      } catch {}
      audioAnalyzer.stop();
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
    } else if (activePlayer === 'youtube' && ytPlayer && ytPlayerReady) {
      try {
        ytPlayer.playVideo();
      } catch {}
      audioAnalyzer.start();
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
    } else if (activePlayer === 'youtube' && ytPlayer && ytPlayerReady) {
      try {
        ytPlayer.seekTo(seconds, true);
      } catch {}
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
    } else if (activePlayer === 'youtube' && ytPlayer && ytPlayerReady) {
      try {
        ytPlayer.setVolume(volume * 100);
      } catch {}
    } else if (activePlayer === 'fallback') {
      if (fallbackAudio) {
        fallbackAudio.volume = volume;
      }
    }
  },
};
