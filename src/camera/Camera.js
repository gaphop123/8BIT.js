/**
 * Camera with follow, bounds, shake, deadzone
 */
export class Camera {
  constructor(opts = {}) {
    this.width = opts.width || 256;
    this.height = opts.height || 240;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.target = null;
    this.deadzone = opts.deadzone || { x: 32, y: 24 };
    this.bounds = opts.bounds || null; // {x, y, width, height}
    this.smooth = opts.smooth != null ? opts.smooth : 0.15;
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this._shakeTime = 0;
    this._shakeIntensity = 0;
    this._shakeX = 0;
    this._shakeY = 0;
  }

  follow(target) {
    this.target = target;
    return this;
  }

  setBounds(x, y, w, h) {
    this.bounds = { x, y, width: w, height: h };
    return this;
  }

  clearBounds() {
    this.bounds = null;
    return this;
  }

  shake(intensity = 4, duration = 10) {
    this._shakeIntensity = intensity;
    this._shakeTime = duration / 60; // frames to seconds approx
    return this;
  }

  setZoom(z) {
    this.zoom = Math.max(0.25, z);
    return this;
  }

  update(dt) {
    if (this.target) {
      const tx = this.target.x - this.width / 2 + this.offsetX;
      const ty = this.target.y - this.height / 2 + this.offsetY;

      // Deadzone
      const dx = tx - this.x;
      const dy = ty - this.y;
      if (Math.abs(dx) > this.deadzone.x) {
        this.x += (dx - Math.sign(dx) * this.deadzone.x) * this.smooth;
      }
      if (Math.abs(dy) > this.deadzone.y) {
        this.y += (dy - Math.sign(dy) * this.deadzone.y) * this.smooth;
      }
    }

    // Shake
    if (this._shakeTime > 0) {
      this._shakeTime -= dt;
      this._shakeX = (Math.random() - 0.5) * 2 * this._shakeIntensity;
      this._shakeY = (Math.random() - 0.5) * 2 * this._shakeIntensity;
    } else {
      this._shakeX = 0;
      this._shakeY = 0;
    }

    // Bounds
    if (this.bounds) {
      this.x = Math.max(this.bounds.x, Math.min(this.x, this.bounds.x + this.bounds.width - this.width));
      this.y = Math.max(this.bounds.y, Math.min(this.y, this.bounds.y + this.bounds.height - this.height));
    }

    // Pixel snap
    this.x = Math.round(this.x + this._shakeX);
    this.y = Math.round(this.y + this._shakeY);
  }

  screenToWorld(sx, sy) {
    return { x: sx + this.x, y: sy + this.y };
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.x, y: wy - this.y };
  }
}

export default Camera;
