/**
 * Main full-game Canvas 2D renderer with pixel-perfect scaling
 */
export class Renderer {
  constructor(options = {}) {
    this.width = options.width || 256;
    this.height = options.height || 240;
    this.scale = options.scale || 3;
    this.pixelPerfect = options.pixelPerfect !== false;
    this.background = options.background || '#000000';
    this.parent = options.parent || document.body;

    this.canvas = options.canvas || document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.style.imageRendering = '-moz-crisp-edges';
    this.canvas.style.imageRendering = 'crisp-edges';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;

    // Display canvas for scaling
    this.display = document.createElement('canvas');
    this.display.style.imageRendering = 'pixelated';
    this.display.style.imageRendering = '-moz-crisp-edges';
    this.display.style.imageRendering = 'crisp-edges';
    this.display.style.display = 'block';
    this.display.style.margin = '0 auto';
    this.dctx = this.display.getContext('2d');
    this.dctx.imageSmoothingEnabled = false;

    if (!options.canvas) {
      this.parent.appendChild(this.display);
    }

    this.sprites = [];
    this.layers = new Map();
    this._camera = null;
    this.drawCalls = 0;

    this.resize();
  }

  resize() {
    const s = this.scale;
    this.display.width = this.width * s;
    this.display.height = this.height * s;
    this.dctx.imageSmoothingEnabled = false;
  }

  setScale(s) {
    this.scale = Math.max(1, Math.floor(s));
    this.resize();
  }

  begin(camera) {
    this._camera = camera;
    this.drawCalls = 0;
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.save();
    if (camera) {
      this.ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    }
  }

  end() {
    this.ctx.restore();
    // Blit internal buffer to display with nearest-neighbor
    this.dctx.imageSmoothingEnabled = false;
    this.dctx.clearRect(0, 0, this.display.width, this.display.height);
    this.dctx.drawImage(
      this.canvas,
      0, 0, this.width, this.height,
      0, 0, this.display.width, this.display.height
    );
  }

  drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!img) return;
    this.ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), dw || sw, dh || sh);
    this.drawCalls++;
  }

  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
    this.drawCalls++;
  }

  clear() {
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  destroy() {
    if (this.display && this.display.parentNode) {
      this.display.parentNode.removeChild(this.display);
    }
  }
}

export default Renderer;
