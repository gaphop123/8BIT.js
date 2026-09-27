/**
 * Lightweight Sprite-Only renderer
 */
export class SpriteRenderer {
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

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.ctx.imageSmoothingEnabled = false;

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

    /** @type {import('../sprite/Sprite.js').Sprite[]} */
    this.sprites = [];
    this.drawCalls = 0;
    this._updateCb = null;
    this.running = false;
    this._raf = null;

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

  add(sprite) {
    if (sprite && !this.sprites.includes(sprite)) {
      this.sprites.push(sprite);
      this._sort();
    }
    return this;
  }

  remove(sprite) {
    const i = this.sprites.indexOf(sprite);
    if (i >= 0) this.sprites.splice(i, 1);
    return this;
  }

  clear() {
    this.sprites.length = 0;
  }

  _sort() {
    this.sprites.sort((a, b) => {
      const la = a.layer || 0;
      const lb = b.layer || 0;
      if (la !== lb) return la - lb;
      return (a.zIndex || a.index || 0) - (b.zIndex || b.index || 0);
    });
  }

  update(dt) {
    for (const s of this.sprites) {
      if (s.update) s.update(dt);
    }
    if (this._updateCb) this._updateCb(dt);
  }

  onUpdate(fn) {
    this._updateCb = fn;
    return this;
  }

  render() {
    this.drawCalls = 0;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this._sort();
    for (const s of this.sprites) {
      if (s.visible !== false) {
        s.render(this.ctx);
        this.drawCalls++;
      }
    }

    this.dctx.imageSmoothingEnabled = false;
    this.dctx.clearRect(0, 0, this.display.width, this.display.height);
    this.dctx.drawImage(
      this.canvas,
      0, 0, this.width, this.height,
      0, 0, this.display.width, this.display.height
    );
  }

  start() {
    if (this.running) return this;
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      this._raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      this.update(dt);
      this.render();
    };
    this._raf = requestAnimationFrame(loop);
    return this;
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    return this;
  }

  destroy() {
    this.stop();
    if (this.display && this.display.parentNode) {
      this.display.parentNode.removeChild(this.display);
    }
  }
}

export default SpriteRenderer;
