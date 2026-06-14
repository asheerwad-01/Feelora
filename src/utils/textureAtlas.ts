import * as THREE from 'three';
import type { SpatialTrack } from '@/types';

export class DynamicTextureAtlas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  canvasSize: number;
  gridSize: number;
  cellSize: number;
  numSongs: number;
  loadedCount: number;
  onUpdate?: () => void;

  constructor(numSongs: number, onUpdate?: () => void) {
    this.numSongs = Math.max(numSongs, 1);
    this.onUpdate = onUpdate;
    this.canvasSize = 4096; // High resolution 4K texture atlas

    // Dynamically calculate grid dimensions to fit all songs
    this.gridSize = Math.ceil(Math.sqrt(this.numSongs));
    this.cellSize = Math.floor(this.canvasSize / this.gridSize);
    this.loadedCount = 0;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasSize;
    this.canvas.height = this.canvasSize;
    this.ctx = this.canvas.getContext('2d')!;

    // Initial canvas paint: ultra dark background
    this.ctx.fillStyle = '#060608';
    this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // Create CanvasTexture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  // Pre-draw premium fallback gradient placeholders
  drawPlaceholders(songs: SpatialTrack[]) {
    songs.forEach((song, i) => {
      const col = i % this.gridSize;
      const row = Math.floor(i / this.gridSize);
      const x = col * this.cellSize;
      const y = row * this.cellSize;

      // Draw premium gradient slot
      const grad = this.ctx.createLinearGradient(x, y, x + this.cellSize, y + this.cellSize);
      grad.addColorStop(0, '#1c1c1e');
      grad.addColorStop(1, song.accentColor || '#0A84FF');

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

      // Draw a subtle musical note glyph in the middle of each card
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      this.ctx.font = `bold ${Math.floor(this.cellSize * 0.35)}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('♫', x + this.cellSize / 2, y + this.cellSize / 2);
    });

    this.texture.needsUpdate = true;
    if (this.onUpdate) this.onUpdate();
  }

  // Load image and paint it over the slot
  loadCover(song: SpatialTrack, index: number) {
    if (!song.coverUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const col = index % this.gridSize;
      const row = Math.floor(index / this.gridSize);
      const x = col * this.cellSize;
      const y = row * this.cellSize;

      // Draw loaded image over placeholder
      this.ctx.drawImage(img, x, y, this.cellSize, this.cellSize);

      // Trigger GPU texture update
      this.texture.needsUpdate = true;
      this.loadedCount++;
      if (this.onUpdate) {
        this.onUpdate();
      }
    };
    img.src = song.coverUrl;
  }

  // Get UV bounds for instanced vertex shader mapping
  getUvBounds(index: number) {
    const col = index % this.gridSize;
    const row = Math.floor(index / this.gridSize);

    // Normalize coordinates mapping [0.0, 1.0]
    const uOffset = col / this.gridSize;
    // Y-coordinate is flipped in WebGL (0 is bottom)
    const vOffset = 1.0 - (row + 1) / this.gridSize;
    const uScale = 1.0 / this.gridSize;
    const vScale = 1.0 / this.gridSize;

    return { uOffset, vOffset, uScale, vScale };
  }
}
