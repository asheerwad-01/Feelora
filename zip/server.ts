import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with named parameter
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Structured lyric type
interface SyndicLyricLine {
  time: number; // millisecond timestamp
  text: string;
}

// 8 High-Fidelity Curated Default Tracks with stable preview assets and synced lyrics
const CURATED_TRACKS = [
  {
    id: "curated_blinding_lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    artwork: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#6b1d2f",
    lyrics: [
      { time: 0, text: "🎵 [Synthpop Instrumental Intro] 🎵" },
      { time: 4000, text: "Yeah..." },
      { time: 8000, text: "I've been tryna call" },
      { time: 11500, text: "I've been on my own for long enough" },
      { time: 16000, text: "Maybe you can show me how to love, maybe" },
      { time: 22000, text: "I'm going through withdrawals" },
      { time: 26000, text: "You don't even have to do too much" },
      { time: 30000, text: "You can turn me on with just a touch, baby" },
      { time: 35000, text: "I look around and Sin City's cold and empty" },
      { time: 41000, text: "No one's around to judge me" },
      { time: 45000, text: "I can't see clearly when you're gone" },
      { time: 51000, text: "I said, ooh, I'm blinded by the lights" },
      { time: 58000, text: "No, I can't sleep until I feel your touch" },
      { time: 65000, text: "I said, ooh, I'm drowning in the night" },
      { time: 72000, text: "Oh, when I'm like this, you're the one I trust" }
    ]
  },
  {
    id: "curated_cruel_summer",
    title: "Cruel Summer",
    artist: "Taylor Swift",
    album: "Lover",
    artwork: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#e88bb4",
    lyrics: [
      { time: 0, text: "🎵 [Dreamy Pop Synth Intro] 🎵" },
      { time: 3500, text: "Fever dream high in the quiet of the night" },
      { time: 7000, text: "You know that I caught it" },
      { time: 10500, text: "Bad, bad boy, shiny toy with a price" },
      { time: 14000, text: "You know that I bought it" },
      { time: 17500, text: "Killing me slow, out the window" },
      { time: 21000, text: "I'm always waiting for you to be waiting below" },
      { time: 24500, text: "Devils roll the dice, angels roll their eyes" },
      { time: 28000, text: "What doesn't kill me makes me want you more" },
      { time: 32000, text: "And it's new, the shape of your body" },
      { time: 36000, text: "It's blue, the feeling I've got" },
      { time: 39500, text: "And it's a cruel summer" },
      { time: 43000, text: "It's cool, that's what I tell 'em" },
      { time: 46500, text: "No rules in breakable heaven" },
      { time: 50000, text: "But, ooh, it's a cruel summer in the city!" }
    ]
  },
  {
    id: "curated_stay",
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    album: "F*CK LOVE 3: OVER YOU",
    artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "#2a3d66",
    lyrics: [
      { time: 0, text: "🎵 [Upbeat Keyboard Intro] 🎵" },
      { time: 2000, text: "I do the same thing I told you that I never would" },
      { time: 5500, text: "I told you I'd change, even when I knew I never could" },
      { time: 9000, text: "I know that I can't find nobody else as good as you" },
      { time: 12500, text: "I need you to stay, need you to stay, yeah" },
      { time: 16000, text: "I get drunk, wake up, I'm wasted still" },
      { time: 19500, text: "I realize the time that I wasted here" },
      { time: 23000, text: "I feel like you can't feel the way I feel" },
      { time: 26500, text: "Oh, I'll be fucked up if you're cannot be right here" },
      { time: 30000, text: "Oh, oh, oh, staying wide awake" },
      { time: 33500, text: "I'll be fucked up if you're not here" }
    ]
  },
  {
    id: "curated_as_it_was",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    artwork: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    color: "#2b5c43",
    lyrics: [
      { time: 0, text: "🎵 [Retro Tubular Synth Intro] 🎵" },
      { time: 2000, text: "Come on, Harry, we wanna say goodnight to you!" },
      { time: 5000, text: "Holdin' me back" },
      { time: 7500, text: "Gravity's holdin' me back" },
      { time: 10000, text: "We wanna see the light of your face" },
      { time: 13000, text: "You know the game is too fast for this place" },
      { time: 16000, text: "Ringin' the bell" },
      { time: 18500, text: "Nobody's comin' to help" },
      { time: 21000, text: "Your phone is ringin' again" },
      { time: 24000, text: "You've been so lost for centuries, friend" },
      { time: 27000, text: "In this world, it's just us" },
      { time: 31000, text: "You know it's not the same as it was" },
      { time: 35000, text: "As it was, as it was..." },
      { time: 39000, text: "You know it's not the same!" }
    ]
  },
  {
    id: "curated_flowers",
    title: "Flowers",
    artist: "Miley Cyrus",
    album: "Endless Summer Vacation",
    artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    color: "#c6a052",
    lyrics: [
      { time: 0, text: "🎵 [Groovy Bassline & Drums Intro] 🎵" },
      { time: 3000, text: "We were good, we were gold" },
      { time: 7000, text: "Kinda dream that can't be sold" },
      { time: 11000, text: "We were right 'til we weren't" },
      { time: 14500, text: "Built a home and watched it burn" },
      { time: 18000, text: "Mmm, I didn't wanna leave you, I didn't wanna lie" },
      { time: 22000, text: "Started to cry, but then remembered I..." },
      { time: 26000, text: "I can buy myself flowers!" },
      { time: 30000, text: "Write my name in the sand" },
      { time: 34000, text: "Talk to myself for hours" },
      { time: 38000, text: "Say things you don't understand" },
      { time: 42000, text: "I can take myself dancing, yeah" },
      { time: 46000, text: "And I can hold my own hand" }
    ]
  },
  {
    id: "curated_shape_of_you",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    color: "#184a6b",
    lyrics: [
      { time: 0, text: "🎵 [Marimba Rhythm Intro] 🎵" },
      { time: 2000, text: "The club isn't the best place to find a lover" },
      { time: 5000, text: "So the bar is where I go" },
      { time: 8000, text: "Me and my friends at the table doing shots" },
      { time: 11000, text: "Drinking fast and then we talk slow" },
      { time: 14000, text: "Come over and start up a conversation with just me" },
      { time: 17000, text: "And trust me I'll give it a chance now" },
      { time: 20000, text: "Take my hand, stop, put Van the Man on the jukebox" },
      { time: 23000, text: "And then we start to dance" },
      { time: 25500, text: "I'm in love with the shape of you" },
      { time: 29000, text: "We push and pull like a magnet do" },
      { time: 32500, text: "Although my heart is falling too" },
      { time: 36000, text: "I'm in love with your body!" }
    ]
  },
  {
    id: "curated_levitating",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    artwork: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    color: "#7e2a8a",
    lyrics: [
      { time: 0, text: "🎵 [Funky Nu-Disco Guitar Intro] 🎵" },
      { time: 2500, text: "If you wanna run away with me, I know a galaxy" },
      { time: 6000, text: "And I can take you for a ride" },
      { time: 9000, text: "I had a premonition that we fell into a rhythm" },
      { time: 12500, text: "Where the music don't stop for life" },
      { time: 16000, text: "Glitter in the sky, glitter in my eyes" },
      { time: 19500, text: "Shining just the way I like" },
      { time: 23000, text: "If you're feeling like you need a little bit of company" },
      { time: 26500, text: "You met me at the perfect time" },
      { time: 30000, text: "You, want me, I want you, baby" },
      { time: 33500, text: "My sugarboo, I'm levitating!" }
    ]
  },
  {
    id: "curated_starboy",
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    artwork: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    color: "#0a0a14",
    lyrics: [
      { time: 0, text: "🎵 [Atmospheric Electronic Drums Intro] 🎵" },
      { time: 3000, text: "I'm tryna put you in the worst mood, ah" },
      { time: 7000, text: "P1 cleaner than your church shoes, ah" },
      { time: 11000, text: "Milli point two just to hurt you, ah" },
      { time: 14500, text: "House so empty, need a centerpiece" },
      { time: 18000, text: "Twenty racks a table cut from ebony" },
      { time: 21500, text: "Cut that trophy, girls are on their knees" },
      { time: 25000, text: "Main bitch out your league too, ah" },
      { time: 28500, text: "Side bitch out of league too, ah" },
      { time: 32000, text: "Look what you've done..." },
      { time: 35000, text: "I'm a motherfuckin' starboy!" }
    ]
  }
];

// Helper to fetch Spotify token
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("Spotify token fetch failed:", text);
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error("Error fetching Spotify token:", err);
    return null;
  }
}

// REST Endpoint: Core Curator Tracks
app.get("/api/tracks", (req, res) => {
  res.json(CURATED_TRACKS);
});

// REST Endpoint: Spotify Search Proxy / Fallback
app.get("/api/spotify/search", async (req, res) => {
  const query = req.query.q ? String(req.query.q).trim() : "";
  if (!query) {
    return res.json([]);
  }

  const token = await getSpotifyToken();

  if (token) {
    // Spotify credentials are configured, execute actual search
    try {
      const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`;
      const searchRes = await fetch(spotifyUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!searchRes.ok) {
        throw new Error(`Spotify Search response not OK: ${searchRes.status}`);
      }

      const searchData = await searchRes.json();
      const tracks = searchData.tracks?.items || [];

      // Map Spotify response to standard app schema
      const mappedTracks = tracks.map((track: any) => {
        // Find highest resolution image
        const artworkUrl = track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800";
        // Spotify occasionally hides preview_url behind subscription but frequently returns it.
        // If empty, we can supply one of our reliable high-fidelity mp3 files based on query hash to guarantee playback!
        let preview = track.preview_url;
        if (!preview) {
          // Generate an index based on the track name hash to pick a beautifully fitting pop track
          let hash = 0;
          for (let i = 0; i < track.name.length; i++) {
            hash = track.name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const index = Math.abs(hash) % CURATED_TRACKS.length;
          preview = CURATED_TRACKS[index].audioUrl;
        }

        return {
          id: track.id,
          title: track.name,
          artist: track.artists.map((a: any) => a.name).join(", "),
          album: track.album.name,
          artwork: artworkUrl,
          audioUrl: preview,
          color: "#184a6b", // default hue, client can dynamically calculate or assign
          isSpotifyOriginal: true
        };
      });

      return res.json(mappedTracks);
    } catch (err) {
      console.error("Spotify API Search error, falling back to local simulation:", err);
    }
  }

  // Fallback / Standby Logic when Spotify Secret values are undefined or errored
  // We filter curated tracks, and if no curated track matches, we use Gemini to synthesize search entries
  const matched = CURATED_TRACKS.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.artist.toLowerCase().includes(query.toLowerCase()) ||
    t.album.toLowerCase().includes(query.toLowerCase())
  );

  if (matched.length > 0) {
    return res.json(matched);
  }

  // Use Gemini to synthesize real-looking songs if we have Gemini Key
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a list of exactly 6 real matching music tracks for search query: "${query}".
Return a JSON array of objects. Do not write any markdown wrappers, code blocks, or explanations.
Follow this schema precisely:
[
  {
    "id": "synthetic_some_id",
    "title": "Real Song Title",
    "artist": "Real Artist Name",
    "album": "Real Album Name",
    "artwork": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800", // select a suitable decorative unsplash imagery URL for music, concerts, instruments, or sound waves or artistic abstract art matching the song vibe
    "audioUrl": "one of our SoundHelix links: e.g. https://www.soundhelix.com/examples/mp3/SoundHelix-Song-x.mp3 where x is 1 to 8"
  }
]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                artwork: { type: Type.STRING },
                audioUrl: { type: Type.STRING }
              },
              required: ["id", "title", "artist", "album", "artwork", "audioUrl"]
            }
          }
        }
      });

      const text = response.text ? response.text.trim() : "";
      if (text) {
        const generated = JSON.parse(text);
        const songsWithColors = generated.map((song: any, i: number) => ({
          ...song,
          color: ["#442b5c", "#1d445c", "#5c2b1d", "#5c5c1d", "#1d5c44", "#5c1d5c"][i % 6]
        }));
        return res.json(songsWithColors);
      }
    } catch (gErr) {
      console.error("Gemini song generator failed:", gErr);
    }
  }

  // Ultimate bare fallback
  const basicAlternatives = CURATED_TRACKS.slice(0, 6).map((t, idx) => ({
    ...t,
    id: `fb_${t.id}_${idx}`,
    title: `${t.title} (Match Alternative)`,
  }));
  res.json(basicAlternatives);
});

// REST Endpoint: Fetch synchronized line-by-line lyrics dynamically using Gemini
app.get("/api/lyrics", async (req, res) => {
  const trackId = req.query.trackId ? String(req.query.trackId) : "";
  const artist = req.query.artist ? String(req.query.artist) : "";
  const title = req.query.title ? String(req.query.title) : "";

  if (!trackId || !artist || !title) {
    return res.json([]);
  }

  // 1. Check if the song is part of our static curated collection with high fidelity analytics
  const curated = CURATED_TRACKS.find(t => t.id === trackId);
  if (curated) {
    return res.json(curated.lyrics);
  }

  // 2. Dynamic generation using Gemini 3.5 Flash!
  // Gemini can construct exquisite synchronized timestamped lines matching a typical 30-second audio track perfectly.
  if (ai) {
    try {
      const prompt = `Generate a set of synchronized lyrics for the first 30 seconds of the song "${title}" by "${artist}".
The audio track plays instantly, so generate the timestamps in milliseconds starting from 0 (instrumental intro) up to 30000ms.
Generate about 5 to 10 lines of lyrics that fits the track timing. Include the timestamp where each line starts.
Ensure you return a valid JSON array matching this schema:
[
  { "time": 0, "text": "🎵 [Atmospheric Opening Synth] 🎵" },
  { "time": 4000, "text": "First line of lyric..." },
  { "time": 9500, "text": "Second line of lyric..." }
]
Only output the exact JSON array.`;

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.INTEGER, description: "Miliseconds from start" },
                text: { type: Type.STRING, description: "Lyric text line" }
              },
              required: ["time", "text"]
            }
          }
        }
      });

      const text = geminiResponse.text ? geminiResponse.text.trim() : "";
      if (text) {
        const customLyrics = JSON.parse(text);
        return res.json(customLyrics);
      }
    } catch (err) {
      console.error("Gemini Lyric synthesis error:", err);
    }
  }

  // Fail-over generic lyrics if everything is offline
  res.json([
    { time: 0, text: `🎵 Playing ${title} by ${artist} 🎵` },
    { time: 3000, text: "Lyrics generator is preparing..." },
    { time: 6000, text: "🎶 Listening to the gorgeous groove 🎶" },
    { time: 11000, text: "Yeah, feeling the rhythm flow inside the sphere" },
    { time: 16000, text: "Looking at the 3D gallery revolving around you" },
    { time: 21000, text: "Unlocking custom experiences of sound and vision" },
    { time: 26000, text: "🎵 [Instrumental Solo Outro] 🎵" }
  ]);
});

// Configure Vite middleware in development or static serving of bundled standard UI assets in production
async function run() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Music sphere server booting successfully at http://0.0.0.0:${PORT}`);
  });
}

run().catch((err) => {
  console.error("Express startup failed:", err);
});
