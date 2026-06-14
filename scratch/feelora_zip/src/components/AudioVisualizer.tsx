/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { synthEngine } from '../lib/synth';
import { Track } from '../types';

interface AudioVisualizerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
}

export default function AudioVisualizer({ currentTrack, isPlaying, audioElement }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let analyser: AnalyserNode | null = null;
    let audioContextUsed = false;

    // We can extract an analyzer node from either our custom Web Audio synthesizer
    // or from a MediaElementAudioSourceNode created on the HTML5 Audio element!
    // However, to keep it extremely stable and avoid CORS exceptions when streaming public URLs,
    // we fallback to pure mathematical procedurally-synchronized wave calculations
    // if the browser blocks CORS audio node injection, while using the synth analyser perfectly!
    
    if (synthEngine.analyserNode) {
      analyser = synthEngine.analyserNode;
      audioContextUsed = true;
    }

    const frequencyData = new Uint8Array(analyser ? analyser.frequencyBinCount : 128);

    // Track visualizer parameters
    let phase = 0;
    const wavesCount = 4;
    
    // Resize observer for responsive bounds
    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Secondary coordinates for flowing ambient points
    const particles: { x: number; y: number; size: number; speed: number; angle: number; drift: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * 100, // percentage based
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.05 + 0.01,
        angle: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.2 - 0.1,
      });
    }

    // Helper to get active colors
    const activeColor = currentTrack?.accentColor || '#0A84FF';
    const activeBgColor = currentTrack?.secondaryColor || '#002C66';

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Super clean, translucent canvas clearing to produce soft visual trailing echoes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle ambient radial glow behind waves
      const glowGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      
      // Convert colors to rgba for glowing gradients
      const hexToRgba = (hex: string, alpha: number) => {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) || 10;
        const g = parseInt(cleanHex.substring(2, 4), 16) || 132;
        const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const primaryGlow = hexToRgba(activeColor, isPlaying ? 0.06 : 0.03);
      const secondaryGlow = hexToRgba(activeBgColor, isPlaying ? 0.03 : 0.015);

      glowGrad.addColorStop(0, primaryGlow);
      glowGrad.addColorStop(0.5, secondaryGlow);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Pull frequency weights
      let freqSum = 0;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(frequencyData);
        for (let i = 0; i < frequencyData.length; i++) {
          freqSum += frequencyData[i];
        }
        freqSum /= frequencyData.length;
      } else {
        // Mock a natural breathing pulse if paused/not connected
        freqSum = isPlaying ? 25 + Math.sin(Date.now() * 0.003) * 12 : 12 + Math.sin(Date.now() * 0.001) * 3;
      }

      const intensityMultiplier = Math.max(0.2, freqSum / 40);

      // Render the floating ambient stars/particles
      ctx.fillStyle = hexToRgba(activeColor, 0.25);
      particles.forEach(p => {
        p.angle += p.speed * (isPlaying ? 1.5 : 0.5);
        p.x += Math.cos(p.angle) * p.speed * intensityMultiplier;
        p.y += Math.sin(p.angle) * p.speed * intensityMultiplier + p.drift;

        // Wrap around borders
        if (p.x < 0) p.x = 100;
        if (p.x > 100) p.x = 0;
        if (p.y < 0) p.y = 100;
        if (p.y > 100) p.y = 0;

        const pSize = p.size * (1 + intensityMultiplier * 0.3);
        ctx.beginPath();
        ctx.arc((p.x / 100) * width, (p.y / 100) * height, pSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render flowing wave curves
      phase += isPlaying ? 0.015 * intensityMultiplier : 0.004;

      for (let w = 0; w < wavesCount; w++) {
        ctx.beginPath();
        
        const opacity = (1 - (w / wavesCount)) * (isPlaying ? 0.5 : 0.2);
        ctx.strokeStyle = hexToRgba(activeColor, opacity);
        ctx.lineWidth = w === 0 ? 1.5 : 0.8;

        const waveHeight = (30 + w * 12) * intensityMultiplier;
        const waveOffset = (w * Math.PI) / wavesCount;

        for (let x = 0; x < width; x += 3) {
          // Combination of primary and secondary sine waves for a highly organic liquid look
          const rawAngle = (x / width) * Math.PI * 2 + phase + waveOffset;
          const secondaryAngle = (x / width) * Math.PI * 4 - phase * 0.5;
          const y = height / 2 + 
                    Math.sin(rawAngle) * waveHeight * 0.7 + 
                    Math.cos(secondaryAngle) * waveHeight * 0.3;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      // Add a high-concept ultra-thin horizontal line through the center (VisionOS horizon line)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentTrack, isPlaying, audioElement]);

  return (
    <div id="visualizer-container" ref={containerRef} className="absolute inset-0 w-full h-full bg-black overflow-hidden -z-10">
      <canvas id="audiocanvas" ref={canvasRef} className="block w-full h-full mix-blend-screen" />
    </div>
  );
}
