// ─────────────────────────────────────────────────────────────
// Feelora 2 — Spotify Web Playback SDK Controller
// ─────────────────────────────────────────────────────────────

import { spotifyAuth } from './spotifyAuth';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

let sdkLoaded = false;
let playerInstance: any = null;

const listeners = {
  onStateChanged: [] as ((state: any) => void)[],
  onReady: [] as ((deviceId: string) => void)[],
  onNotReady: [] as (() => void)[],
  onError: [] as ((error: string) => void)[],
};

export const spotifyPlayer = {
  deviceId: null as string | null,
  player: null as any,
  isPremium: true,

  async init(accessToken: string): Promise<void> {
    if (playerInstance) return;

    return new Promise((resolve) => {
      const setupPlayer = () => {
        const player = new window.Spotify.Player({
          name: 'Feelora Universe',
          getOAuthToken: (cb: (token: string) => void) => {
            spotifyAuth
              .getAccessToken()
              .then((token) => cb(token || accessToken));
          },
          volume: 0.4,
        });

        this.player = player;
        playerInstance = player;

        player.addListener(
          'ready',
          ({ device_id }: { device_id: string }) => {
            console.log('[Feelora] Spotify SDK ready, device:', device_id);
            this.deviceId = device_id;
            listeners.onReady.forEach((cb) => cb(device_id));
            this.transferPlayback(device_id);
          }
        );

        player.addListener(
          'not_ready',
          ({ device_id }: { device_id: string }) => {
            console.log('[Feelora] Spotify device offline:', device_id);
            this.deviceId = null;
            listeners.onNotReady.forEach((cb) => cb());
          }
        );

        player.addListener('player_state_changed', (state: any) => {
          listeners.onStateChanged.forEach((cb) => cb(state));
        });

        player.addListener(
          'initialization_error',
          ({ message }: { message: string }) => {
            listeners.onError.forEach(
              (cb) => cb(`Initialization Error: ${message}`)
            );
          }
        );

        player.addListener(
          'authentication_error',
          ({ message }: { message: string }) => {
            listeners.onError.forEach(
              (cb) => cb(`Authentication Error: ${message}`)
            );
          }
        );

        player.addListener(
          'account_error',
          ({ message }: { message: string }) => {
            this.isPremium = false;
            listeners.onError.forEach(
              (cb) => cb(`Requires Premium: ${message}`)
            );
          }
        );

        player.addListener(
          'playback_error',
          ({ message }: { message: string }) => {
            listeners.onError.forEach(
              (cb) => cb(`Playback Error: ${message}`)
            );
          }
        );

        player.connect().then((success: boolean) => {
          if (success) console.log('[Feelora] Spotify SDK connected.');
          resolve();
        });
      };

      if (window.Spotify && window.Spotify.Player) {
        setupPlayer();
      } else {
        window.onSpotifyWebPlaybackSDKReady = () => {
          setupPlayer();
        };

        if (!sdkLoaded) {
          const script = document.createElement('script');
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          document.body.appendChild(script);
          sdkLoaded = true;
        }
      }
    });
  },

  async transferPlayback(deviceId: string): Promise<void> {
    const token = await spotifyAuth.getAccessToken();
    if (!token) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      });
    } catch (error) {
      console.warn('[Feelora] Failed to transfer playback:', error);
    }
  },

  async play(spotifyUri: string): Promise<void> {
    const token = await spotifyAuth.getAccessToken();
    if (!token) return;

    const deviceQuery = this.deviceId
      ? `?device_id=${this.deviceId}`
      : '';
    const body: any = {};

    if (spotifyUri.includes(':track:')) {
      body.uris = [spotifyUri];
    } else {
      body.context_uri = spotifyUri;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play${deviceQuery}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        throw new Error(`Play request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[Feelora] Playback error:', error);
    }
  },

  async pause(): Promise<void> {
    if (this.player) await this.player.pause();
  },

  async resume(): Promise<void> {
    if (this.player) await this.player.resume();
  },

  async next(): Promise<void> {
    if (this.player) await this.player.nextTrack();
  },

  async prev(): Promise<void> {
    if (this.player) await this.player.previousTrack();
  },

  async seek(positionMs: number): Promise<void> {
    if (this.player) await this.player.seek(positionMs);
  },

  async setVolume(volumeDecimal: number): Promise<void> {
    if (this.player) await this.player.setVolume(volumeDecimal);
  },

  /* ── Subscription helpers ── */

  subscribeStateChanged(cb: (state: any) => void): () => void {
    listeners.onStateChanged.push(cb);
    return () => {
      listeners.onStateChanged = listeners.onStateChanged.filter(
        (fn) => fn !== cb
      );
    };
  },

  subscribeReady(cb: (deviceId: string) => void): () => void {
    listeners.onReady.push(cb);
    return () => {
      listeners.onReady = listeners.onReady.filter((fn) => fn !== cb);
    };
  },

  subscribeNotReady(cb: () => void): () => void {
    listeners.onNotReady.push(cb);
    return () => {
      listeners.onNotReady = listeners.onNotReady.filter((fn) => fn !== cb);
    };
  },

  subscribeError(cb: (error: string) => void): () => void {
    listeners.onError.push(cb);
    return () => {
      listeners.onError = listeners.onError.filter((fn) => fn !== cb);
    };
  },
};
