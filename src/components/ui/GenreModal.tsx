'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — Genre Universe Modal (3D Canvas Edition)
// Fullscreen overlay displaying rotating 3D spheres that open new universes
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { spotifyApi } from '@/services/spotify/spotifyApi';
import { distributeTracks } from '@/utils/sphereDistribution';
import type { Track } from '@/types';

const GENRES = [
  {
    id: 'hip-hop',
    label: 'Hip-hop/Rap',
    searchKey: 'Hip-hop/rap',
    emoji: '🎤',
    glow: '#9333ea',
    lightColor: '#c084fc',
    baseColor: '#7e22ce',
    darkColor: '#1e1b4b',
  },
  {
    id: 'pop',
    label: 'Pop',
    searchKey: 'pop',
    emoji: '🍭',
    glow: '#ec4899',
    lightColor: '#f472b6',
    baseColor: '#be185d',
    darkColor: '#50072b',
  },
  {
    id: 'rock',
    label: 'Rock',
    searchKey: 'rock',
    emoji: '🎸',
    glow: '#ef4444',
    lightColor: '#f87171',
    baseColor: '#b91c1c',
    darkColor: '#450a0a',
  },
  {
    id: 'latin',
    label: 'Latin',
    searchKey: 'latin',
    emoji: '💃',
    glow: '#f97316',
    lightColor: '#fb923c',
    baseColor: '#c2410c',
    darkColor: '#431407',
  },
  {
    id: 'rnb-soul',
    label: 'R&B/Soul',
    searchKey: 'R&B/Soul',
    emoji: '🎷',
    glow: '#6366f1',
    lightColor: '#818cf8',
    baseColor: '#4338ca',
    darkColor: '#1e1b4b',
  },
  {
    id: 'edm-dance',
    label: 'EDM/Dance',
    searchKey: 'EDM/Dance',
    emoji: '⚡',
    glow: '#10b981',
    lightColor: '#34d399',
    baseColor: '#047857',
    darkColor: '#022c22',
  },
  {
    id: 'country',
    label: 'Country',
    searchKey: 'Country',
    emoji: '🤠',
    glow: '#eab308',
    lightColor: '#facc15',
    baseColor: '#a16207',
    darkColor: '#422006',
  },
  {
    id: 'k-pop',
    label: 'K-pop',
    searchKey: 'K-pop',
    emoji: '🌟',
    glow: '#f43f5e',
    lightColor: '#fb7185',
    baseColor: '#be123c',
    darkColor: '#4c0519',
  },
  {
    id: 'j-pop',
    label: 'J-pop',
    searchKey: 'J-pop',
    emoji: '🌸',
    glow: '#06b6d4',
    lightColor: '#22d3ee',
    baseColor: '#0e7490',
    darkColor: '#083344',
  },
];

const DEMO_ARTWORK_URLS = [
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=150&auto=format&fit=crop&q=60',
];

function generateMockGenreTracks(genreName: string): Track[] {
  const query = genreName.toLowerCase();
  let artists: string[] = [];
  let titles: string[] = [];
  let baseColor = '#9333ea';
  let secondaryColor = '#1e1b4b';
  
  if (query.includes('hip-hop') || query.includes('rap')) {
    artists = ['Metro Boomin', 'Travis Scott', 'Kendrick Lamar', 'Drake', 'Lil Baby', 'Post Malone', 'Kid Cudi', '21 Savage'];
    titles = ['Moonlight Echoes', 'Skyline Horizon', 'Diamond Street', 'Night Rider', 'Neon Boulevard', 'Subzero Bass', 'Vibe Check', 'Lost in Tokyo', 'After Hours', 'Savage Mode'];
    baseColor = '#9333ea';
    secondaryColor = '#1e1b4b';
  } else if (query.includes('pop')) {
    artists = ['Taylor Swift', 'The Weeknd', 'Dua Lipa', 'Harry Styles', 'Billie Eilish', 'Olivia Rodrigo', 'Sabrina Carpenter'];
    titles = ['Starlight Sweetheart', 'Cruel Summer', 'Midnight Kiss', 'Dancing in Red', 'Ocean Eyes', 'Bad Habit', 'Espresso Dream', 'Featherweight', 'Vampire Hearts', 'Golden Hour'];
    baseColor = '#ec4899';
    secondaryColor = '#50072b';
  } else if (query.includes('rock')) {
    artists = ['Nirvana', 'Queen', 'Arctic Monkeys', 'Foo Fighters', 'The Killers', 'Radiohead', 'Linkin Park', 'Metallica'];
    titles = ['Smells Like Freedom', 'Bohemian Dream', 'Do I Wanna Know?', 'Everlonging', 'Mr. Brightside', 'Creep In', 'In The End', 'Master of Stars', 'Thunderstruck', 'Black Dog'];
    baseColor = '#ef4444';
    secondaryColor = '#450a0a';
  } else if (query.includes('latin')) {
    artists = ['Bad Bunny', 'Rosalía', 'J Balvin', 'Karol G', 'Rauw Alejandro', 'Daddy Yankee', 'Shakira', 'Luis Fonsi'];
    titles = ['Dakiti Sunrise', 'Motomami Pulse', 'Mi Gente Beat', 'Tusa Vibe', 'Todo De Ti', 'Gasolina Heat', 'Hips Dont Lie', 'Despacito Breeze', 'La Bachata', 'Monotonia'];
    baseColor = '#f97316';
    secondaryColor = '#431407';
  } else if (query.includes('r&b') || query.includes('soul')) {
    artists = ['Frank Ocean', 'SZA', 'Daniel Caesar', 'Giveon', 'H.E.R.', 'Khalid', 'Steve Lacy', 'Leon Bridges'];
    titles = ['Pink + White Skies', 'Kill Bill Rhythm', 'Best Part', 'Heartbreak Anniversary', 'Focus On Me', 'Location Found', 'Bad Habit', 'River Flow', 'Redbone Groove', 'Ctrl Z'];
    baseColor = '#6366f1';
    secondaryColor = '#1e1b4b';
  } else if (query.includes('edm') || query.includes('dance')) {
    artists = ['Daft Punk', 'Skrillex', 'Avicii', 'Fred again..', 'Martin Garrix', 'Odesza', 'Flume', 'Marshmello'];
    titles = ['One More Time', 'Bangarang Bounce', 'Levels High', 'Rumble In Space', 'Animals Beat', 'Say My Name', 'Never Be Like You', 'Silence Orbit', 'Clarity', 'Strobe Glow'];
    baseColor = '#10b981';
    secondaryColor = '#022c22';
  } else if (query.includes('country')) {
    artists = ['Luke Combs', 'Morgan Wallen', 'Kacey Musgraves', 'Zach Bryan', 'Chris Stapleton', 'Dolly Parton', 'Taylor Swift'];
    titles = ['Fast Car Roads', 'Whiskey Glasses', 'Golden Hour', 'Something in the Orange', 'Tennessee Whiskey', 'Jolene Jolene', 'Love Story', 'Country Roads', 'Dirt Cheap', 'Bluebird'];
    baseColor = '#eab308';
    secondaryColor = '#422006';
  } else if (query.includes('k-pop')) {
    artists = ['BTS', 'BLACKPINK', 'NewJeans', 'TWICE', 'Stray Kids', 'FIFTY FIFTY', 'IVE', 'LE SSERAFIM'];
    titles = ['Dynamite Dance', 'How You Like That', 'Hype Boy', 'Fancy You', 'Thunderous Beat', 'Cupid Love', 'Love Dive', 'Antifragile', 'OMG Cosmic', 'Super Shy'];
    baseColor = '#f43f5e';
    secondaryColor = '#4c0519';
  } else if (query.includes('j-pop')) {
    artists = ['Yoasobi', 'Kenshi Yonezu', 'Fujii Kaze', 'Ado', 'Utada Hikaru', 'Official HIGE DANdism', 'Radwimps', 'Lisa'];
    titles = ['Racing into the Night', 'Lemon Scent', 'Shinunoga E-Wa', 'Usseewa Scream', 'First Love Echo', 'Pretender Dreams', 'Zenzenzense', 'Gurenge Blade', 'Idol Universe', 'Stay With Me'];
    baseColor = '#06b6d4';
    secondaryColor = '#083344';
  } else {
    artists = ['Cosmic Nomad', 'Nebula Symphony', 'Solar Wanderer'];
    titles = ['Stardust Trail', 'Atmospheric Drift', 'Galaxy Core', 'Light Speed Voyage'];
    baseColor = '#0084ff';
    secondaryColor = '#002c66';
  }

  const tracks: Track[] = [];
  for (let i = 0; i < 150; i++) {
    const artist = artists[i % artists.length];
    const template = titles[(i * 3 + 1) % titles.length];
    const title = `${template} (Mix ${Math.floor(i / titles.length) + 1})`;
    
    const soundHelixIndex = (i % 16) + 1;
    const audioUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${soundHelixIndex}.mp3`;
    const coverUrl = DEMO_ARTWORK_URLS[(i + 5) % DEMO_ARTWORK_URLS.length];
    
    tracks.push({
      id: `mock-genre-${query}-${i}`,
      title,
      artist,
      album: `${genreName} Universe Collection, Vol. ${Math.floor(i / 15) + 1}`,
      duration: 180 + (i % 120),
      audioUrl,
      coverUrl,
      accentColor: baseColor,
      secondaryColor: secondaryColor,
      isSpotifyTrack: false,
    });
  }
  return tracks;
}

function GenreSphereItem({
  genre,
  isActive,
  isWarping,
  onClick,
}: {
  genre: typeof GENRES[0];
  isActive: boolean;
  isWarping: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    // Rotation of inner planet
    if (innerRef.current) {
      innerRef.current.rotation.y += 0.45 * delta;
      innerRef.current.rotation.x += 0.22 * delta;
    }
    // Rotation of outer wireframe atmosphere shell
    if (outerRef.current) {
      outerRef.current.rotation.y -= 0.65 * delta;
      outerRef.current.rotation.z += 0.3 * delta;
    }
    // Rotation of active indicator ring
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.4 * delta;
    }

    // Smooth hover/active scale lerping
    if (groupRef.current) {
      const targetScale = isWarping ? 0.75 : isActive ? 1.15 : hovered ? 1.25 : 1.0;
      const currentScale = groupRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.12);
      groupRef.current.scale.set(nextScale, nextScale, nextScale);
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const handleMeshClick = (e: any) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group 
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleMeshClick}
    >
      {/* Torus active outer glowing halo ring */}
      {isActive && (
        <mesh ref={ringRef} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[0.95, 0.02, 8, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>
      )}

      {/* Inner solid sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshPhongMaterial
          color={genre.baseColor}
          emissive={genre.baseColor}
          emissiveIntensity={hovered ? 0.8 : isActive ? 0.6 : 0.25}
          shininess={50}
          specular={new THREE.Color(genre.lightColor)}
        />
      </mesh>

      {/* Outer wireframe atmosphere shell */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.74, 16, 16]} />
        <meshBasicMaterial 
          color={genre.lightColor} 
          wireframe 
          transparent 
          opacity={hovered ? 0.45 : 0.22} 
        />
      </mesh>

      {/* HTML Label overlay */}
      <Html position={[0, -1.05, 0]} center distanceFactor={10}>
        <div 
          className={`flex flex-col items-center gap-1 font-mono tracking-widest uppercase transition-all duration-300 pointer-events-none select-none ${
            isWarping 
              ? 'text-white scale-95 font-bold'
              : isActive 
                ? 'text-white font-bold scale-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]'
                : hovered 
                  ? 'text-white scale-105' 
                  : 'text-[#8E8E93]'
          }`}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif'
          }}
        >
          {isWarping ? (
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin inline-block" />
              <span>Warping...</span>
            </div>
          ) : (
            <div className="text-[10px] md:text-[11px] whitespace-nowrap text-center">
              <span className="mr-1">{genre.emoji}</span>
              <span>{genre.label}</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export function GenreModal() {
  const {
    isGenreModalOpen,
    setIsGenreModalOpen,
    activeGenre,
    setActiveGenre,
    setAllSongs,
    librarySongs,
    connectedProviders,
    setIsLoading,
    setLoadingMessage,
    setSphereSource,
    setFocusedSong,
    setCameraTarget,
  } = useAppStore();

  const [loadingGenre, setLoadingGenre] = useState<string | null>(null);

  if (!isGenreModalOpen) return null;

  const handleSelectGenre = async (genre: typeof GENRES[0]) => {
    setLoadingGenre(genre.label);
    setIsLoading(true);
    setLoadingMessage(`Warping spacetime to build ${genre.label} Universe...`);

    try {
      let tracks: Track[] = [];
      const isDemo = localStorage.getItem('feelora_demo_mode') === 'true' || !connectedProviders.spotify;

      if (isDemo) {
        // Generate high quality mock tracks for selected genre
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Cinematic delay
        tracks = generateMockGenreTracks(genre.searchKey);
      } else {
        // Fetch real tracks from Spotify
        tracks = await spotifyApi.getGenreTracks(genre.searchKey, 150);
      }

        // Convert to SpatialTrack format and distribute in 3D
        const spatialTracks = distributeTracks(tracks, 7.5, genre.label);

      setAllSongs(spatialTracks);
      setActiveGenre(genre.label);
      setSphereSource('all'); // Reset source selector
      setFocusedSong(null);
      setCameraTarget(null);

      // Close modal
      setIsGenreModalOpen(false);
    } catch (err) {
      console.error('[GenreModal] Failed to load genre universe:', err);
    } finally {
      setLoadingGenre(null);
      setIsLoading(false);
    }
  };

  const handleReturnToMyUniverse = () => {
    if (librarySongs.length > 0) {
      setAllSongs(librarySongs);
      setActiveGenre(null);
      setSphereSource('all');
      setFocusedSong(null);
      setCameraTarget(null);
      setIsGenreModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 md:p-12 glass-panel backdrop-blur-[40px] bg-black/60 transition-all duration-500 ease-out animate-fade-in pointer-events-auto">
      
      {/* Background radial cosmic glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header section */}
        <div className="text-center mb-6 select-none">
          <h2 
            className="text-2xl md:text-3xl font-light tracking-[0.25em] text-white uppercase mb-2 drop-shadow-sm"
            style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Explore Genre Universes
          </h2>
          <p className="text-[#8E8E93] text-xs font-mono tracking-widest uppercase">
            {activeGenre ? `Active: ${activeGenre} Universe` : 'Tap a cosmic seed to transition into its spherical dimension'}
          </p>
        </div>

        {/* 3D Canvas hosting the genre spheres */}
        <div className="w-full h-[52vh] md:h-[58vh] relative pointer-events-auto">
          <Canvas
            camera={{ position: [0, 0, 8.5], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            
            {/* Grid distribution */}
            {GENRES.map((genre, index) => {
              const cols = 3;
              const xSpacing = 3.3;
              const ySpacing = 2.3;
              
              const row = Math.floor(index / cols);
              const col = index % cols;
              
              const x = (col - 1) * xSpacing;
              const y = -(row - 1) * ySpacing;
              
              const isActive = activeGenre === genre.label;
              const isWarping = loadingGenre === genre.label;

              return (
                <group key={genre.id} position={[x, y, 0]}>
                  <GenreSphereItem
                    genre={genre}
                    isActive={isActive}
                    isWarping={isWarping}
                    onClick={() => !loadingGenre && handleSelectGenre(genre)}
                  />
                </group>
              );
            })}
          </Canvas>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 mt-6">
          {activeGenre && (
            <button
              onClick={handleReturnToMyUniverse}
              className="px-6 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-[10px] md:text-[11px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-md"
              style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              Back to My Universe
            </button>
          )}
          <button
            onClick={() => setIsGenreModalOpen(false)}
            className="px-6 py-2.5 rounded-full border border-white/10 bg-black/40 hover:bg-white/5 text-[#8E8E93] hover:text-white text-[10px] md:text-[11px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer"
            style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
