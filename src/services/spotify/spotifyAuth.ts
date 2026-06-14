// ─────────────────────────────────────────────────────────────
// Feelora 2 — Spotify OAuth (PKCE Flow)
// Ported and adapted for Next.js 15
// ─────────────────────────────────────────────────────────────

import CryptoJS from 'crypto-js';

const getClientId = (): string => {
  if (typeof window === 'undefined') return '';
  const customId = localStorage.getItem('feelora_spotify_custom_client_id');
  if (customId) return customId.trim();
  const envId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (
    envId && 
    envId !== 'placeholder_client_id' && 
    envId !== 'your_spotify_client_id_here'
  ) {
    return envId.trim();
  }
  return '';
};

const getRedirectUri = (): string => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};

const SCOPES =
  process.env.NEXT_PUBLIC_SPOTIFY_SCOPES ||
  'user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative user-read-recently-played streaming user-modify-playback-state user-read-playback-state';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'feelora_spotify_access_token',
  REFRESH_TOKEN: 'feelora_spotify_refresh_token',
  EXPIRES_AT: 'feelora_spotify_expires_at',
  CODE_VERIFIER: 'feelora_spotify_code_verifier',
};

function generateRandomString(length: number): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hash = CryptoJS.SHA256(codeVerifier);
  return CryptoJS.enc.Base64.stringify(hash)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const spotifyAuth = {
  async login(): Promise<void> {
    const clientId = getClientId();
    if (!clientId) {
      console.error('Spotify Client ID is missing.');
      return;
    }

    // Spotify prohibits 'localhost' redirect URIs — use 127.0.0.1 loopback
    if (window.location.hostname === 'localhost') {
      const protocol = window.location.protocol;
      const port = window.location.port || '3000';
      const loopback = `${protocol}//127.0.0.1:${port}${window.location.pathname}${window.location.search}`;
      window.location.replace(loopback);
      return;
    }

    const codeVerifier = generateRandomString(64);
    localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const redirectUri = getRedirectUri();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true',
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    window.location.reload();
  },

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

    if (refresh) return true;
    if (!token || !expiresAt) return false;
    return Number(expiresAt) > Date.now() + 60000;
  },

  async handleAuthCallback(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const codeVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);

    if (!code || !codeVerifier) return false;

    try {
      const redirectUri = getRedirectUri();
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: getClientId(),
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.saveTokens(data.access_token, data.refresh_token, data.expires_in);

      // Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
      return true;
    } catch (error) {
      console.error('Error exchanging auth code for token:', error);
      return false;
    }
  },

  saveTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
  },

  async getAccessToken(): Promise<string | null> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

    if (!token || !expiresAt) {
      if (refresh) return this.refreshToken(refresh);
      return null;
    }

    // Refresh if token expires within 3 minutes
    if (Date.now() + 180000 > Number(expiresAt)) {
      if (refresh) return this.refreshToken(refresh);
      return null;
    }

    return token;
  },

  async refreshToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: getClientId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Refresh request failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.saveTokens(
        data.access_token,
        data.refresh_token || refreshToken,
        data.expires_in
      );
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      this.logout();
      return null;
    }
  },

  getEffectiveClientId(): string {
    return getClientId();
  },

  setCustomClientId(clientId: string): void {
    localStorage.setItem(
      'feelora_spotify_custom_client_id',
      clientId.trim()
    );
  },
};
