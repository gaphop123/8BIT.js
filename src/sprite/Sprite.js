/**
 * Core Sprite class for 8-bit / 16-bit pixel art
 */
import { AnimationController } from '../animation/AnimationController.js';

export class Sprite {
  /**
   * @param {Object} opts
   */
  constructor(opts = {}) {
    this.id = opts.id || `sprite_${Sprite._uid++}`;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.width = opts.width || 16;
    this.height = opts.height || 16;
    this.scaleX = opts.scaleX != null ? opts.scaleX : 1;
    this.scaleY = opts.scaleY != null ? opts.scaleY : 1;
    this.rotation = opts.rotation || 0; // radians
    this.visible = opts.visible !== false;
    this.opacity = opts.opacity != null ? opts.opacity : 1;
    this.flipX = !!opts.flipX;
    this.flipY = !!opts.flipY;
    this.index = opts.index || 0;
    this.zIndex = opts.zIndex != null ? opts.zIndex : opts.index || 0;
    this.layer = opts.layer || 0;
    this.anchorX = opts.anchorX != null ? opts.anchorX : 0;
    this.anchorY = opts.anchorY != null ? opts.anchorY : 0;
    this.originX = opts.originX != null ? opts.originX : 0;
    this.originY = opts.originY != null ? opts.originY : 0;

    // Pixel data or image source
    this.image = opts.image || null; // HTMLImageElement or Canvas
    this.frameX = opts.frameX || 0;
    this.frameY = opts.frameY || 0;
    this.frameWidth = opts.frameWidth || this.width;
    this.frameHeight = opts.frameHeight || this.height;

    // Pixel buffer for procedural sprites
    this.pixels = opts.pixels || null; // Uint8ClampedArray or 2D color array
    this._canvas = null;
    this._ctx = null;

    // Animation
    this.animations = new AnimationController(this);
    if (opts.animations) {
      for (const [name, data] of Object.entries(opts.animations)) {
        this.animations.add(name, data);
      }
    }

    // Collision
    this.collider = opts.collider || false;
    this.solid = opts.solid || false;
    this.trigger = opts.trigger || false;
    this.collisionBox = opts.collisionBox || null; // {x,y,w,h} relative

    // Tags & metadata
    this.tags = opts.tags || [];
    this.data = opts.data || {};
  }

  static _uid = 0;

  // --- Transform helpers ---
  move(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  translate(dx, dy) {
    this.x += dx;
    this.y += dy;
    return this;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  show() {
    this.visible = true;
    return this;
  }

  hide() {
    this.visible = false;
    return this;
  }

  flip(fx, fy) {
    if (fx != null) this.flipX = !!fx;
    if (fy != null) this.flipY = !!fy;
    return this;
  }

  setIndex(i) {
    this.index = i;
    this.zIndex = i;
    return this;
  }

  setLayer(layer) {
    this.layer = typeof layer === 'string' ? layer : (layer || 0);
    return this;
  }

  setScale(sx, sy) {
    this.scaleX = sx;
    this.scaleY = sy != null ? sy : sx;
    return this;
  }

  // --- Pixel / Image ---
  setImage(img, frameX = 0, frameY = 0, fw, fh) {
    this.image = img;
    this.frameX = frameX;
    this.frameY = frameY;
    if (fw) this.frameWidth = fw;
    if (fh) this.frameHeight = fh;
    return this;
  }

  /**
   * Create or update from pixel color array (2D array of hex/rgb strings)
   * @param {string[][]} colors - rows of color strings
   */
  setPixels(colors) {
    this.pixels = colors;
    const h = colors.length;
    const w = colors[0] ? colors[0].length : 0;
    this.width = w;
    this.height = h;
    this.frameWidth = w;
    this.frameHeight = h;
    this._ensureCanvas();
    const ctx = this._ctx;
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = colors[y][x];
        if (c && c !== 'transparent' && c !== '') {
          ctx.fillStyle = c;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    this.image = this._canvas;
    return this;
  }

  _ensureCanvas() {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._ctx = this._canvas.getContext('2d');
      this._ctx.imageSmoothingEnabled = false;
    }
    this._canvas.width = this.width;
    this._canvas.height = this.height;
  }

  // --- Animation shortcuts ---
  addAnimation(name, frames, options = {}) {
    this.animations.add(name, { frames, ...options });
    return this;
  }

  play(name) {
    this.animations.play(name);
    return this;
  }

  stop() {
    this.animations.stop();
    return this;
  }

  pause() {
    this.animations.pause();
    return this;
  }

  resume() {
    this.animations.resume();
    return this;
  }

  // --- Bounds ---
  getBounds() {
    const ax = this.anchorX * this.width * this.scaleX;
    const ay = this.anchorY * this.height * this.scaleY;
    return {
      x: this.x - ax,
      y: this.y - ay,
      width: this.width * Math.abs(this.scaleX),
      height: this.height * Math.abs(this.scaleY)
    };
  }

  getCollisionBounds() {
    if (this.collisionBox) {
      return {
        x: this.x + this.collisionBox.x,
        y: this.y + this.collisionBox.y,
        width: this.collisionBox.w,
        height: this.collisionBox.h
      };
    }
    return this.getBounds();
  }

  // --- Update & Render ---
  update(dt) {
    this.animations.update(dt);
  }

  render(ctx) {
    if (!this.visible || this.opacity <= 0) return;
    if (!this.image && !this.pixels) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    const w = this.frameWidth || this.width;
    const h = this.frameHeight || this.height;
    const dw = w * this.scaleX;
    const dh = h * this.scaleY;

    let dx = Math.round(this.x - this.anchorX * dw);
    let dy = Math.round(this.y - this.anchorY * dh);

    // Apply flip via scale
    ctx.translate(dx + (this.flipX ? dw : 0), dy + (this.flipY ? dh : 0));
    if (this.rotation) ctx.rotate(this.rotation);
    ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);

    if (this.image) {
      ctx.drawImage(
        this.image,
        this.frameX, this.frameY, w, h,
        0, 0, Math.abs(dw), Math.abs(dh)
      );
    }

    ctx.restore();
  }

  clone() {
    const s = new Sprite({
      x: this.x, y: this.y,
      width: this.width, height: this.height,
      scaleX: this.scaleX, scaleY: this.scaleY,
      rotation: this.rotation,
      visible: this.visible, opacity: this.opacity,
      flipX: this.flipX, flipY: this.flipY,
      index: this.index, zIndex: this.zIndex, layer: this.layer,
      anchorX: this.anchorX, anchorY: this.anchorY,
      image: this.image,
      frameX: this.frameX, frameY: this.frameY,
      frameWidth: this.frameWidth, frameHeight: this.frameHeight
    });
    return s;
  }
}

export default Sprite;
