/**
 * Tilemap with layers, collision, animated tiles
 */
export class Tilemap {
  /**
   * @param {Object} opts
   * @param {number} opts.tileWidth
   * @param {number} opts.tileHeight
   * @param {number} opts.width - in tiles
   * @param {number} opts.height - in tiles
   */
  constructor(opts = {}) {
    this.tileWidth = opts.tileWidth || 16;
    this.tileHeight = opts.tileHeight || 16;
    this.width = opts.width || 32;
    this.height = opts.height || 30;
    this.tileset = opts.tileset || null; // image or canvas
    this.tilesetColumns = opts.tilesetColumns || 16;
    this.layers = new Map();
    this.collision = []; // 2D array of solid flags
    this.animatedTiles = new Map(); // tileId -> {frames, fps, time, index}
    this.name = opts.name || 'map';
    this.parallaxX = opts.parallaxX || 1;
    this.parallaxY = opts.parallaxY || 1;

    this._initCollision();
    this.addLayer('ground');
  }

  _initCollision() {
    this.collision = [];
    for (let y = 0; y < this.height; y++) {
      this.collision[y] = new Array(this.width).fill(0);
    }
  }

  addLayer(name, data = null) {
    const layer = {
      name,
      data: data || this._emptyData(),
      visible: true,
      opacity: 1,
      zIndex: this.layers.size
    };
    this.layers.set(name, layer);
    return layer;
  }

  _emptyData() {
    const d = [];
    for (let y = 0; y < this.height; y++) {
      d[y] = new Array(this.width).fill(0);
    }
    return d;
  }

  getLayer(name) {
    return this.layers.get(name);
  }

  setTile(x, y, id, layerName = 'ground') {
    const layer = this.layers.get(layerName);
    if (!layer || x < 0 || y < 0 || x >= this.width || y >= this.height) return this;
    layer.data[y][x] = id;
    return this;
  }

  getTile(x, y, layerName = 'ground') {
    const layer = this.layers.get(layerName);
    if (!layer || x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return layer.data[y][x];
  }

  setCollision(x, y, solid = 1) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return this;
    this.collision[y][x] = solid ? 1 : 0;
    return this;
  }

  isSolid(x, y) {
    const tx = Math.floor(x / this.tileWidth);
    const ty = Math.floor(y / this.tileHeight);
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
    return !!this.collision[ty][tx];
  }

  fill(id, layerName = 'ground') {
    const layer = this.layers.get(layerName);
    if (!layer) return this;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        layer.data[y][x] = id;
      }
    }
    return this;
  }

  clear(layerName) {
    if (layerName) {
      const layer = this.layers.get(layerName);
      if (layer) layer.data = this._emptyData();
    } else {
      for (const layer of this.layers.values()) {
        layer.data = this._emptyData();
      }
      this._initCollision();
    }
    return this;
  }

  setTileset(image, columns = 16) {
    this.tileset = image;
    this.tilesetColumns = columns;
    return this;
  }

  addAnimatedTile(id, frames, fps = 8) {
    this.animatedTiles.set(id, { frames, fps, time: 0, index: 0 });
    return this;
  }

  update(dt) {
    for (const anim of this.animatedTiles.values()) {
      anim.time += dt;
      const frameDur = 1 / anim.fps;
      while (anim.time >= frameDur) {
        anim.time -= frameDur;
        anim.index = (anim.index + 1) % anim.frames.length;
      }
    }
  }

  render(ctx, cameraX = 0, cameraY = 0, viewW, viewH) {
    if (!this.tileset) return;
    const tw = this.tileWidth;
    const th = this.tileHeight;
    const startX = Math.max(0, Math.floor(cameraX / tw) - 1);
    const startY = Math.max(0, Math.floor(cameraY / th) - 1);
    const endX = Math.min(this.width, Math.ceil((cameraX + (viewW || 256)) / tw) + 1);
    const endY = Math.min(this.height, Math.ceil((cameraY + (viewH || 240)) / th) + 1);

    const layers = Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          let id = layer.data[y][x];
          if (!id) continue;
          // Animated override
          const anim = this.animatedTiles.get(id);
          if (anim) id = anim.frames[anim.index];
          const col = (id - 1) % this.tilesetColumns;
          const row = Math.floor((id - 1) / this.tilesetColumns);
          ctx.drawImage(
            this.tileset,
            col * tw, row * th, tw, th,
            x * tw, y * th, tw, th
          );
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  get pixelWidth() {
    return this.width * this.tileWidth;
  }

  get pixelHeight() {
    return this.height * this.tileHeight;
  }
}

export default Tilemap;
