/**
 * Scene container for sprites, characters, tilemaps, etc.
 */
export class Scene {
  constructor(name = 'scene') {
    this.name = name;
    this.sprites = [];
    this.characters = [];
    this.tilemaps = [];
    this.objects = [];
    this.particles = [];
    this.ui = [];
    this.backgrounds = [];
    this.camera = null;
    this.active = true;
    this.data = {};
  }

  add(entity) {
    if (!entity) return this;
    if (entity.constructor && entity.constructor.name === 'Character') {
      this.characters.push(entity);
    }
    if (entity.render || entity.x != null) {
      this.sprites.push(entity);
    }
    return this;
  }

  addTilemap(map) {
    this.tilemaps.push(map);
    return this;
  }

  addBackground(bg) {
    this.backgrounds.push(bg);
    return this;
  }

  remove(entity) {
    const removeFrom = (arr) => {
      const i = arr.indexOf(entity);
      if (i >= 0) arr.splice(i, 1);
    };
    removeFrom(this.sprites);
    removeFrom(this.characters);
    removeFrom(this.objects);
    removeFrom(this.particles);
    removeFrom(this.ui);
    return this;
  }

  find(id) {
    return this.sprites.find(s => s.id === id) ||
           this.characters.find(c => c.id === id) ||
           this.objects.find(o => o.id === id);
  }

  findByTag(tag) {
    return this.sprites.filter(s => s.tags && s.tags.includes(tag));
  }

  clear() {
    this.sprites.length = 0;
    this.characters.length = 0;
    this.tilemaps.length = 0;
    this.objects.length = 0;
    this.particles.length = 0;
    this.ui.length = 0;
    this.backgrounds.length = 0;
  }

  reset() {
    // Reset positions etc. if needed
  }

  update(dt) {
    if (!this.active) return;
    for (const map of this.tilemaps) {
      if (map.update) map.update(dt);
    }
    for (const s of this.sprites) {
      if (s.update) s.update(dt);
    }
    for (const p of this.particles) {
      if (p.update) p.update(dt);
    }
  }

  render(renderer) {
    if (!this.active) return;
    const ctx = renderer.ctx;
    const cam = this.camera;

    // Backgrounds
    for (const bg of this.backgrounds) {
      if (bg.render) bg.render(ctx, cam);
    }

    // Tilemaps
    for (const map of this.tilemaps) {
      map.render(
        ctx,
        cam ? cam.x * (map.parallaxX || 1) : 0,
        cam ? cam.y * (map.parallaxY || 1) : 0,
        renderer.width,
        renderer.height
      );
    }

    // Sprites sorted by layer / zIndex
    const sorted = this.sprites.slice().sort((a, b) => {
      const la = typeof a.layer === 'number' ? a.layer : 0;
      const lb = typeof b.layer === 'number' ? b.layer : 0;
      if (la !== lb) return la - lb;
      return (a.zIndex || a.index || 0) - (b.zIndex || b.index || 0);
    });

    for (const s of sorted) {
      if (s.visible !== false) s.render(ctx);
    }

    // Particles
    for (const p of this.particles) {
      if (p.render) p.render(ctx);
    }

    // UI (screen space)
    ctx.save();
    if (cam) ctx.translate(Math.round(cam.x), Math.round(cam.y));
    for (const u of this.ui) {
      if (u.render) u.render(ctx);
    }
    ctx.restore();
  }
}

export default Scene;
