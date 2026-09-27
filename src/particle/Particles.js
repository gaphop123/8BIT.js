/**
 * Lightweight pixel-art particle system
 */
export class Particles {
  constructor(opts = {}) {
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.count = opts.count || 20;
    this.particles = [];
    this.gravity = opts.gravity != null ? opts.gravity : 0.1;
    this.lifetime = opts.lifetime || 1;
    this.size = opts.size || 2;
    this.color = opts.color || '#FFFFFF';
    this.colors = opts.colors || null;
    this.speed = opts.speed || 2;
    this.spread = opts.spread || Math.PI * 2;
    this.angle = opts.angle || 0;
    this.active = true;
  }

  burst(x, y, count) {
    const n = count != null ? count : this.count;
    const px = x != null ? x : this.x;
    const py = y != null ? y : this.y;
    for (let i = 0; i < n; i++) {
      const a = this.angle + (Math.random() - 0.5) * this.spread;
      const sp = this.speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: this.lifetime * (0.5 + Math.random() * 0.5),
        maxLife: this.lifetime,
        size: this.size * (0.5 + Math.random()),
        color: this.colors
          ? this.colors[Math.floor(Math.random() * this.colors.length)]
          : this.color
      });
    }
    return this;
  }

  update(dt) {
    if (!this.active) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += this.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = Math.max(1, Math.round(p.size * alpha));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
    ctx.globalAlpha = 1;
  }

  get alive() {
    return this.particles.length;
  }
}

export default Particles;
