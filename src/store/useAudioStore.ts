// ─────────────────────────────────────────────────────────────
// Feelora 2 — Audio Analysis Store (Zustand)
// High-frequency updates isolated from main app store
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';

interface AudioState {
  bass: number;
  mid: number;
  treble: number;
  energy: number;
  beat: boolean;
  frequencyData: Uint8Array | null;
  waveformData: Uint8Array | null;

  setBass: (val: number) => void;
  setMid: (val: number) => void;
  setTreble: (val: number) => void;
  setEnergy: (val: number) => void;
  setBeat: (val: boolean) => void;
  setFrequencyData: (data: Uint8Array | null) => void;
  setWaveformData: (data: Uint8Array | null) => void;
  updateAll: (data: {
    bass: number;
    mid: number;
    treble: number;
    energy: number;
    beat: boolean;
  }) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  bass: 0,
  mid: 0,
  treble: 0,
  energy: 0,
  beat: false,
  frequencyData: null,
  waveformData: null,

  setBass: (val) => set({ bass: val }),
  setMid: (val) => set({ mid: val }),
  setTreble: (val) => set({ treble: val }),
  setEnergy: (val) => set({ energy: val }),
  setBeat: (val) => set({ beat: val }),
  setFrequencyData: (data) => set({ frequencyData: data }),
  setWaveformData: (data) => set({ waveformData: data }),
  updateAll: (data) => set(data),
}));
