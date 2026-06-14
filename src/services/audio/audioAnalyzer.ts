// ─────────────────────────────────────────────────────────────
// Feelora 2 — Web Audio API Analyzer
// Real-time audio analysis with simulated fallback for SDK streams
// ─────────────────────────────────────────────────────────────

import { useAudioStore } from '@/store/useAudioStore';

const FFT_SIZE = 256;
const SMOOTHING = 0.8;

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let animationFrameId: number | null = null;
let isRunning = false;
let connectedElement: HTMLAudioElement | null = null;

// Beat detection state
let beatThreshold = 1.2;
let lastBeatTime = 0;
const BEAT_COOLDOWN = 200; // ms

// Exponential moving average state
let prevBass = 0;
let prevMid = 0;
let prevTreble = 0;
const EMA_ALPHA = 0.3;

// Simulated analysis variables
let lastSimulatedBeat = 0;
let simulatedBpm = 120;

function ema(current: number, previous: number): number {
  return EMA_ALPHA * current + (1 - EMA_ALPHA) * previous;
}

function analyze() {
  if (!analyser || !isRunning) return;

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  const waveformData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData);
  analyser.getByteTimeDomainData(waveformData);

  const binCount = frequencyData.length;
  // Bass: bins 0-2, Mid: bins 3-10, Treble: bins 11+
  const bassEnd = Math.floor(binCount * 0.08);  
  const midEnd = Math.floor(binCount * 0.35);    

  let bassSum = 0;
  let midSum = 0;
  let trebleSum = 0;

  for (let i = 0; i < binCount; i++) {
    const val = frequencyData[i] / 255;
    if (i < bassEnd) bassSum += val;
    else if (i < midEnd) midSum += val;
    else trebleSum += val;
  }

  const rawBass = bassSum / Math.max(1, bassEnd);
  const rawMid = midSum / Math.max(1, midEnd - bassEnd);
  const rawTreble = trebleSum / Math.max(1, binCount - midEnd);

  // Smooth with EMA
  const bass = ema(rawBass, prevBass);
  const mid = ema(rawMid, prevMid);
  const treble = ema(rawTreble, prevTreble);
  prevBass = bass;
  prevMid = mid;
  prevTreble = treble;

  const energy = bass * 0.5 + mid * 0.3 + treble * 0.2;

  // Beat detection: spike in bass energy
  const now = performance.now();
  const beat =
    rawBass > beatThreshold * prevBass &&
    now - lastBeatTime > BEAT_COOLDOWN;
  if (beat) lastBeatTime = now;

  // Update store
  const store = useAudioStore.getState();
  store.updateAll({ bass, mid, treble, energy, beat });
  store.setFrequencyData(frequencyData);
  store.setWaveformData(waveformData);

  animationFrameId = requestAnimationFrame(analyze);
}

function simulateAnalysis(time: number) {
  if (!isRunning) return;

  const beatInterval = 60000 / simulatedBpm;
  const elapsedSinceBeat = performance.now() - lastSimulatedBeat;

  let beat = false;
  if (elapsedSinceBeat >= beatInterval) {
    beat = true;
    lastSimulatedBeat = performance.now();
  }

  // Beat pulse decay
  const beatDecay = Math.max(0, 1 - (elapsedSinceBeat / (beatInterval * 0.45)));

  // Generate procedural values
  const bass = ema(beatDecay * 0.75 + Math.sin(time * 6) * 0.05 + 0.1, prevBass);
  const mid = ema(0.25 + Math.sin(time * 2.5) * 0.12 + Math.cos(time * 1.2) * 0.04, prevMid);
  const treble = ema(0.2 + Math.cos(time * 4.5) * 0.08 + Math.sin(time * 1.8) * 0.03, prevTreble);
  
  prevBass = bass;
  prevMid = mid;
  prevTreble = treble;

  const energy = bass * 0.5 + mid * 0.3 + treble * 0.2;

  // Fill raw arrays
  const frequencyData = new Uint8Array(FFT_SIZE / 2);
  const waveformData = new Uint8Array(FFT_SIZE / 2);

  for (let i = 0; i < frequencyData.length; i++) {
    if (i < 4) {
      frequencyData[i] = Math.floor(bass * 255 * (1 - i * 0.2));
    } else if (i < 16) {
      frequencyData[i] = Math.floor(mid * 255 * (1 - (i - 4) * 0.05));
    } else {
      frequencyData[i] = Math.floor(treble * 255 * (1 - (i - 16) * 0.02) * (Math.random() * 0.15 + 0.85));
    }
    waveformData[i] = Math.floor(128 + Math.sin(time * 12 + i * 0.15) * 40 * energy);
  }

  const store = useAudioStore.getState();
  store.updateAll({ bass, mid, treble, energy, beat });
  store.setFrequencyData(frequencyData);
  store.setWaveformData(waveformData);

  animationFrameId = requestAnimationFrame(() => simulateAnalysis(performance.now() * 0.001));
}

export const audioAnalyzer = {
  connectToElement(audioElement: HTMLAudioElement): void {
    if (connectedElement === audioElement && isRunning) return;

    this.disconnect();

    try {
      audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;

      sourceNode = audioContext.createMediaElementSource(audioElement);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      connectedElement = audioElement;
    } catch (err) {
      console.warn('[Feelora Audio] Failed to connect analyzer:', err);
    }
  },

  start(): void {
    if (isRunning) return;
    if (audioContext?.state === 'suspended') {
      audioContext.resume();
    }
    isRunning = true;
    prevBass = 0;
    prevMid = 0;
    prevTreble = 0;
    lastSimulatedBeat = performance.now();

    if (connectedElement) {
      animationFrameId = requestAnimationFrame(analyze);
    } else {
      animationFrameId = requestAnimationFrame(() => simulateAnalysis(performance.now() * 0.001));
    }
  },

  stop(): void {
    isRunning = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    useAudioStore.getState().updateAll({
      bass: 0,
      mid: 0,
      treble: 0,
      energy: 0,
      beat: false,
    });
  },

  disconnect(): void {
    this.stop();
    if (sourceNode) {
      try {
        sourceNode.disconnect();
      } catch {}
      sourceNode = null;
    }
    if (analyser) {
      try {
        analyser.disconnect();
      } catch {}
      analyser = null;
    }
    connectedElement = null;
  },

  setBpmFromTrack(title: string): void {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Pseudo-random but stable BPM between 100 and 140 based on name
    simulatedBpm = 100 + (Math.abs(hash) % 41);
  },

  getAudioContext(): AudioContext | null {
    return audioContext;
  },
};
