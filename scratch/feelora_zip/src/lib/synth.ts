/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Track } from '../types';

class GenerativeSynth {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  public analyserNode: AnalyserNode | null = null;

  private activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private chordIntervalId: number | null = null;
  private isSynthesizing: boolean = false;
  private currentTrack: Track | null = null;

  constructor() {
    // Lazy loaded synthesizer to respect the framework limits and browser security policies
  }

  private init() {
    if (this.audioCtx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    this.audioCtx = new AudioContextClass();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime); // Gentle start volume

    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;

    // Filters for beautiful warm analog texture
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(600, this.audioCtx.currentTime);

    // Warm stereo spatial delay
    this.delayNode = this.audioCtx.createDelay(2.0);
    this.feedbackGain = this.audioCtx.createGain();
    this.delayNode.delayTime.setValueAtTime(0.5, this.audioCtx.currentTime);
    this.feedbackGain.gain.setValueAtTime(0.6, this.audioCtx.currentTime);

    // Wire up: Synth Voices -> Filter -> Master Gain & Delay loop -> Analyser -> Destination
    this.masterGain.connect(this.filter);
    
    // Connect Delay loop
    this.filter.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode); // feedback loop
    this.feedbackGain.connect(this.masterGain); // delay taps back into volume

    // Analyser in front of speaker
    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.audioCtx.destination);
  }

  // Audio Context unlock for mobile / Safari security restrictions
  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setVolume(volume: number) {
    if (!this.audioCtx) this.init();
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(volume * 0.25, this.audioCtx.currentTime);
    }
  }

  public start(track: Track) {
    this.init();
    this.resumeContext();

    if (!this.audioCtx) return;

    // Stop current synthesis if any
    this.stop();

    this.currentTrack = track;
    this.isSynthesizing = true;

    // Update hardware values for this specific track's settings
    const settings = track.synthSettings;
    if (this.delayNode && this.feedbackGain && this.filter) {
      this.delayNode.delayTime.setValueAtTime(settings.delayTime, this.audioCtx.currentTime);
      this.feedbackGain.gain.setValueAtTime(settings.feedback, this.audioCtx.currentTime);
      this.filter.frequency.setValueAtTime(settings.filterFreq, this.audioCtx.currentTime);
    }

    // Start chord progression immediately
    this.playNextChord();

    // Schedule a gorgeous evolving chord progression every 4.5 seconds
    this.chordIntervalId = window.setInterval(() => {
      this.playNextChord();
    }, 4500);
  }

  public stop() {
    this.isSynthesizing = false;
    if (this.chordIntervalId) {
      clearInterval(this.chordIntervalId);
      this.chordIntervalId = null;
    }

    // Gently release active voices
    const now = this.audioCtx ? this.audioCtx.currentTime : 0;
    this.activeNodes.forEach(voice => {
      try {
        if (this.audioCtx) {
          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
          voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // 1.2 second fade out
          voice.osc.stop(now + 1.5);
        } else {
          voice.osc.stop();
        }
      } catch (err) {
        // Safe check
      }
    });

    this.activeNodes = [];
    this.currentTrack = null;
  }

  private playNextChord() {
    if (!this.audioCtx || !this.isSynthesizing || !this.currentTrack || !this.masterGain) return;

    const now = this.audioCtx.currentTime;
    const settings = this.currentTrack.synthSettings;

    // Release older voices
    const oldNodes = this.activeNodes;
    this.activeNodes = [];
    
    oldNodes.forEach(voice => {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8); // Smooth crossfade
        voice.osc.stop(now + 2.0);
      } catch (err) {}
    });

    // Randomly select a chord structure (I, IV, V, vi, or ii) from our custom scale
    // scale is array of semitones from base frequency
    const scale = settings.scale;
    const baseFreq = settings.baseFreq;

    // Build chords from scale steps (Triads, 7ths, 9ths)
    const chordRoots = [0, 3, 5, 7, 8, 10]; // index of root steps
    const rootStepOffset = chordRoots[Math.floor(Math.random() * chordRoots.length)];
    
    // Choose 3 notes for pad harmony + 1 optional high ambient bell note
    const notesToPlay = [
      rootStepOffset, // Root note
      rootStepOffset + (scale[2] || 4), // 3rd interval
      rootStepOffset + (scale[4] || 7), // 5th interval
      rootStepOffset + (scale[6] || 11) + 12, // Stable high extensions (9th / Octave)
    ];

    // Filter frequency sweet sweeps
    if (this.filter) {
      const sweepTarget = settings.filterFreq + (Math.sin(now * 0.1) * 200);
      this.filter.frequency.cancelScheduledValues(now);
      this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
      this.filter.frequency.exponentialRampToValueAtTime(Math.max(100, sweepTarget), now + 4.2);
    }

    notesToPlay.forEach((midiOffset, index) => {
      if (!this.audioCtx) return;

      // Convert MIDI offset to Frequency
      const freq = baseFreq * Math.pow(2, midiOffset / 12);
      
      const osc = this.audioCtx.createOscillator();
      const voiceGain = this.audioCtx.createGain();

      osc.type = settings.type;
      osc.frequency.setValueAtTime(freq, now);
      // Slight detune for analog warmth lush chorus feel
      osc.detune.setValueAtTime(settings.detune * (index % 2 === 0 ? 1 : -1), now);

      // Volume envelope for luxury pads: slow sweeping attack, long sustain, slow release
      voiceGain.gain.setValueAtTime(0.0001, now);
      
      // Soft staggered attack times for organic timing
      const attackTime = 1.0 + (index * 0.3);
      voiceGain.gain.linearRampToValueAtTime(0.12 - (index * 0.02), now + attackTime);

      // Connect to filter directly
      osc.connect(voiceGain);
      voiceGain.connect(this.filter!);

      osc.start(now);
      this.activeNodes.push({ osc, gain: voiceGain });
    });

    // Occasional micro-bell accent note (high frequency random star)
    if (Math.random() > 0.4) {
      setTimeout(() => {
        if (!this.audioCtx || !this.isSynthesizing || !this.filter) return;
        const bellNow = this.audioCtx.currentTime;
        const bellOffset = scale[Math.floor(Math.random() * scale.length)];
        const bellFreq = baseFreq * Math.pow(2, (bellOffset + 24) / 12); // Two octaves up

        const bellOsc = this.audioCtx.createOscillator();
        const bellGain = this.audioCtx.createGain();

        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(bellFreq, bellNow);

        bellGain.gain.setValueAtTime(0.0001, bellNow);
        bellGain.gain.linearRampToValueAtTime(0.03, bellNow + 0.15); // Fast chime attack
        bellGain.gain.exponentialRampToValueAtTime(0.0001, bellNow + 3.0); // Slow ring decay

        bellOsc.connect(bellGain);
        bellGain.connect(this.filter);
        bellOsc.start(bellNow);
        bellOsc.stop(bellNow + 3.2);
      }, Math.random() * 1500);
    }
  }
}

// Singleton pattern so there is always exactly one synth engine running matching browser state
export const synthEngine = new GenerativeSynth();
