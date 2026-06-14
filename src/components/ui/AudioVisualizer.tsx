'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAudioStore } from '@/store/useAudioStore';

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentTrack = useAppStore((s) => s.currentTrack);
  const isPlaying = useAppStore((s) => s.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
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

    // Secondary coordinates for flowing ambient points (music stars)
    const particles: { x: number; y: number; size: number; speed: number; angle: number; drift: number }[] = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * 100, // percentage based
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.6,
        speed: Math.random() * 0.04 + 0.01,
        angle: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.15 - 0.075,
      });
    }

    // Helper to get active colors as RGBA
    const hexToRgba = (hex: string, alpha: number) => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) || 10;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 132;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Super clean, translucent canvas clearing to produce soft visual trailing echoes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
      ctx.fillRect(0, 0, width, height);

      const activeColor = currentTrack?.accentColor || '#0A84FF';
      const activeBgColor = currentTrack?.secondaryColor || '#002C66';

      // Draw subtle ambient radial glow behind waves
      const glowGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );

      const primaryGlow = hexToRgba(activeColor, isPlaying ? 0.07 : 0.035);
      const secondaryGlow = hexToRgba(activeBgColor, isPlaying ? 0.035 : 0.018);

      glowGrad.addColorStop(0, primaryGlow);
      glowGrad.addColorStop(0.5, secondaryGlow);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Pull real-time energy from useAudioStore (computed by the audio analyzer loop)
      const energy = useAudioStore.getState().energy;
      const intensityMultiplier = 0.25 + energy * 3.5;

      // Render the floating ambient stars/particles (orbiting drift)
      ctx.fillStyle = hexToRgba(activeColor, 0.25);
      particles.forEach((p) => {
        p.angle += p.speed * (isPlaying ? 1.4 : 0.45);
        p.x += Math.cos(p.angle) * p.speed * intensityMultiplier;
        p.y += Math.sin(p.angle) * p.speed * intensityMultiplier + p.drift;

        // Wrap around borders
        if (p.x < 0) p.x = 100;
        if (p.x > 100) p.x = 0;
        if (p.y < 0) p.y = 100;
        if (p.y > 100) p.y = 0;

        const pSize = p.size * (1 + intensityMultiplier * 0.25);
        ctx.beginPath();
        ctx.arc((p.x / 100) * width, (p.y / 100) * height, pSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render flowing wave curves
      phase += isPlaying ? 0.012 * intensityMultiplier : 0.003;

      for (let w = 0; w < wavesCount; w++) {
        ctx.beginPath();

        const opacity = (1 - w / wavesCount) * (isPlaying ? 0.45 : 0.15);
        ctx.strokeStyle = hexToRgba(activeColor, opacity);
        ctx.lineWidth = w === 0 ? 1.4 : 0.7;

        const waveHeight = (25 + w * 10) * intensityMultiplier;
        const waveOffset = (w * Math.PI) / wavesCount;

        for (let x = 0; x < width; x += 3) {
          // Combination of primary and secondary sine waves for a highly organic liquid look
          const rawAngle = (x / width) * Math.PI * 2 + phase + waveOffset;
          const secondaryAngle = (x / width) * Math.PI * 4 - phase * 0.5;
          const y =
            height / 2 +
            Math.sin(rawAngle) * waveHeight * 0.75 +
            Math.cos(secondaryAngle) * waveHeight * 0.25;

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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
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
  }, [currentTrack, isPlaying]);

  return (
    <div
      id="visualizer-container"
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-transparent pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <canvas
        id="audiocanvas"
        ref={canvasRef}
        className="block w-full h-full mix-blend-screen"
      />
    </div>
  );
}
