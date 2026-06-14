/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoodCollection } from '../types';

export const moodCollections: MoodCollection[] = [
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    subtitle: 'NIGHT COGNITION',
    tagline: 'Quiet your surroundings. Enter the deep stream.',
    description: 'A quiet, obsidian-textured sonic architecture engineered for long coding sessions, architectural drafting, and quiet midnight thoughts. Continuous, slow, deep, and reflective.',
    quote: '"Simplicity is the ultimate sophistication."',
    quoteAuthor: 'Steve Jobs',
    accentColor: '#0A84FF', // Apple Bright Blue
    secondaryColor: '#002C66', // Midnight Blue
    artworkUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1400&q=90',
    tracks: [
      {
        id: 'df-1',
        title: 'Obsidian Code',
        artist: 'Aethelgard',
        album: 'Monomethyl Synth',
        duration: 240,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        accentColor: '#0A84FF',
        secondaryColor: '#002C66',
        synthSettings: {
          baseFreq: 110, // A2
          scale: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
          type: 'triangle',
          detune: 8,
          delayTime: 0.6,
          feedback: 0.7,
          filterFreq: 800,
        },
        description: 'Warm analog synthesizer sweeps nested inside wide stereo delay, forming a stable container for deep thought.',
        beatsPerMinute: 62,
      },
      {
        id: 'df-2',
        title: 'Monolithic Flow',
        artist: 'Solis Drone',
        album: 'Static Echoes',
        duration: 310,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
        accentColor: '#30D158', // Apple Green
        secondaryColor: '#0A3B12',
        synthSettings: {
          baseFreq: 73.42, // D2
          scale: [0, 2, 4, 7, 9], // Major Pentatonic
          type: 'sine',
          detune: 4,
          delayTime: 0.8,
          feedback: 0.6,
          filterFreq: 450,
        },
        description: 'An acoustic drone lulled by beautiful high-resonance sine filters, evolving under an expansive virtual dome.',
        beatsPerMinute: 55,
      },
      {
        id: 'df-3',
        title: 'Kuroshio Current',
        artist: 'Nakamura',
        album: 'Ocean Currents',
        duration: 185,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        accentColor: '#BF5AF2', // Apple Purple
        secondaryColor: '#3A104D',
        synthSettings: {
          baseFreq: 130.81, // C3
          scale: [0, 3, 5, 6, 7, 10], // Blues scale
          type: 'sine',
          detune: 12,
          delayTime: 0.4,
          feedback: 0.8,
          filterFreq: 600,
        },
        description: 'Gentle, warm bells that rise from deep sub-frequencies and dissolve slowly over a long, repeating spatial horizon.',
        beatsPerMinute: 48,
      }
    ],
  },
  {
    id: 'night-drive',
    name: 'Night Drive',
    subtitle: 'HYPER-PERSPECTIVE',
    tagline: 'Horizontal highways. Clear headlights. Midnight retro.',
    description: 'Designed for high-speed dark highways and sweeping neon views. Deep outrun basslines meet floating digital keys, carrying a smooth, synthetic nostalgic momentum.',
    quote: '"Design is not just what it looks like and feels like. Design is how it works."',
    quoteAuthor: 'Steve Jobs',
    accentColor: '#FF375F', // Apple Rose/Red-Pink
    secondaryColor: '#580B1A',
    artworkUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=90',
    tracks: [
      {
        id: 'nd-1',
        title: 'Cyber Highway',
        artist: 'Vektor Noir',
        album: 'Neon Grid EP',
        duration: 275,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        accentColor: '#FF375F',
        secondaryColor: '#580B1A',
        synthSettings: {
          baseFreq: 82.41, // E2
          scale: [0, 2, 3, 5, 7, 9, 10], // Dorian Mode
          type: 'sawtooth',
          detune: 18,
          delayTime: 0.35,
          feedback: 0.45,
          filterFreq: 1100,
        },
        description: 'Tight 80s detuned sawtooth arpeggios pulsing alongside filter-swept sub-basses for a nostalgic cruising momentum.',
        beatsPerMinute: 112,
      },
      {
        id: 'nd-2',
        title: 'Coastline Glow',
        artist: 'L\'Avenue',
        album: 'Aesthetic Sunset',
        duration: 215,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?auto=format&fit=crop&w=800&q=80',
        accentColor: '#FF9500', // Apple Orange
        secondaryColor: '#4C2700',
        synthSettings: {
          baseFreq: 98.00, // G2
          scale: [0, 2, 5, 7, 9], // Major Pentatonic
          type: 'sawtooth',
          detune: 10,
          delayTime: 0.4,
          feedback: 0.5,
          filterFreq: 1300,
        },
        description: 'Sleek synthesizer textures and high warm chime leads mimicking city streetlights flashing overhead.',
        beatsPerMinute: 92,
      },
      {
        id: 'nd-3',
        title: 'Subsurface Pulse',
        artist: 'Chroma Horizon',
        album: 'Prismatic Glow',
        duration: 290,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        accentColor: '#64D2FF', // Apple Teal/Light Blue
        secondaryColor: '#0E3E50',
        synthSettings: {
          baseFreq: 65.41, // C2
          scale: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
          type: 'sawtooth',
          detune: 25,
          delayTime: 0.25,
          feedback: 0.4,
          filterFreq: 950,
        },
        description: 'Deep modular synthesizer patterns locked in driving low frequency orbits. Visceral and continuous.',
        beatsPerMinute: 120,
      }
    ],
  },
  {
    id: 'creative-session',
    name: 'Creative Session',
    subtitle: 'FLUID THOUGHT',
    tagline: 'Unlock loose horizons. Ethereal sketchbooks.',
    description: 'An abstract, jazz-laced organic garden of audio textures designed to loosen the mind and let creative sketches pour directly onto the digital canvas. Organic, liquid, and warm.',
    quote: '"Stay hungry. Stay foolish."',
    quoteAuthor: 'Stewart Brand',
    accentColor: '#BF5AF2', // Apple Purple
    secondaryColor: '#3A104D',
    artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=90',
    tracks: [
      {
        id: 'cs-1',
        title: 'Liquid Velvet',
        artist: 'Plum & Clay',
        album: 'Elastic Canvas',
        duration: 250,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        accentColor: '#BF5AF2',
        secondaryColor: '#3A104D',
        synthSettings: {
          baseFreq: 110.00, // A2
          scale: [0, 2, 4, 7, 9, 11], // Lydian Pentatonic
          type: 'triangle',
          detune: 6,
          delayTime: 0.5,
          feedback: 0.65,
          filterFreq: 750,
        },
        description: 'Ethereal, floating electric piano chords with a heavy jazz-tinged modulation, breathing slowly like velvet waves.',
        beatsPerMinute: 78,
      },
      {
        id: 'cs-2',
        title: 'Clay Sculpture',
        artist: 'Soma Drift',
        album: 'Tactile Sound',
        duration: 200,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
        accentColor: '#FF6489', // Apple Pink
        secondaryColor: '#4A0D1D',
        synthSettings: {
          baseFreq: 146.83, // D3
          scale: [0, 3, 5, 7, 10], // Minor Pentatonic
          type: 'sine',
          detune: 10,
          delayTime: 0.3,
          feedback: 0.5,
          filterFreq: 900,
        },
        description: 'Wooden percussive resonance loops and abstract spatial noise cracks that establish an organic, physical workspace.',
        beatsPerMinute: 85,
      }
    ],
  },
  {
    id: 'sunday-morning',
    name: 'Sunday Morning',
    subtitle: 'ALABASTER GLARE',
    tagline: 'Filtered sunlight. Porcelain coffee. Gentle acoustic air.',
    description: 'An optimistic, light-filled suite of acoustic and organic sounds resembling warm morning sun hitting clean white walls. Perfectly relaxed, crisp, and bright.',
    quote: '"Details matter, it’s worth waiting to get it right."',
    quoteAuthor: 'Steve Jobs',
    accentColor: '#FFD60A', // Apple Gold/Yellow
    secondaryColor: '#4C3E00',
    artworkUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=90',
    tracks: [
      {
        id: 'sm-1',
        title: 'Amber Steam',
        artist: 'Morning Breeze',
        album: 'Coffee & Oak Wood',
        duration: 210,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
        accentColor: '#FFD60A',
        secondaryColor: '#4C3E00',
        synthSettings: {
          baseFreq: 110.00, // A2
          scale: [0, 2, 4, 7, 9], // Major Pentatonic
          type: 'sine',
          detune: 2,
          delayTime: 0.6,
          feedback: 0.5,
          filterFreq: 1200,
        },
        description: 'Soft wooden mallet tones cascading down a major chord map, reminiscent of early morning shadows evolving across timber floors.',
        beatsPerMinute: 70,
      },
      {
        id: 'sm-2',
        title: 'Oak Wood Shimmer',
        artist: 'Linen',
        album: 'Filtered Light',
        duration: 195,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        accentColor: '#30D158', // Apple Green
        secondaryColor: '#0A3B12',
        synthSettings: {
          baseFreq: 130.81, // C3
          scale: [0, 2, 4, 5, 7, 9, 11], // Major Scale
          type: 'triangle',
          detune: 4,
          delayTime: 0.5,
          feedback: 0.4,
          filterFreq: 1500,
        },
        description: 'Acoustic pluck echoes mimicking strings bathed in high sunlight reverb, carrying an uplifting and light atmosphere.',
        beatsPerMinute: 65,
      }
    ],
  },
  {
    id: 'workout-energy',
    name: 'Workout Energy',
    subtitle: 'MOLTEN PUSH',
    tagline: 'Kinetic physical effort. Charcoal concrete. Progressive push.',
    description: 'A structural, fast, highly focused electronic landscape designed to fuel heavy lifting, endurance running, or intense physical momentum. Mechanical, driving, and raw.',
    quote: '"The only way to do great work is to love what you do."',
    quoteAuthor: 'Steve Jobs',
    accentColor: '#FF453A', // Apple Crimson Red
    secondaryColor: '#4A0E0B',
    artworkUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1400&q=90',
    tracks: [
      {
        id: 'we-1',
        title: 'Molten Concrete',
        artist: 'Kinetic Storm',
        album: 'Industrial Push',
        duration: 280,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
        accentColor: '#FF453A',
        secondaryColor: '#4A0E0B',
        synthSettings: {
          baseFreq: 55.00, // A1 (Sub bass)
          scale: [0, 1, 3, 5, 7, 8, 10], // Phrygian Mode (aggressive)
          type: 'sawtooth',
          detune: 30,
          delayTime: 0.2,
          feedback: 0.35,
          filterFreq: 1800,
        },
        description: 'Pulsing industrial wave shapes overlaid with dense mechanical kicks, driving a high-intensity workout pace.',
        beatsPerMinute: 128,
      },
      {
        id: 'we-2',
        title: 'Velocity Vector',
        artist: 'Apex Pulse',
        album: 'Kinetic Energy',
        duration: 235,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
        accentColor: '#FF9500', // Apple Orange
        secondaryColor: '#4C2700',
        synthSettings: {
          baseFreq: 65.41, // C2
          scale: [0, 3, 5, 7, 10], // Minor Pentatonic
          type: 'sawtooth',
          detune: 20,
          delayTime: 0.22,
          feedback: 0.30,
          filterFreq: 1600,
        },
        description: 'High momentum FM synth stabs triggering relentless progressive patterns that unlock maximum athletic performance.',
        beatsPerMinute: 132,
      }
    ],
  }
];

// All tracks flattened for global search or play queues
export const allTracks = moodCollections.reduce<any[]>((acc, collection) => {
  const collectionTracks = collection.tracks.map(track => ({
    ...track,
    collectionId: collection.id,
    collectionName: collection.name
  }));
  return [...acc, ...collectionTracks];
}, []);
