/**
 * 8BIT.js v1.0.0
 * Complete 2D Retro Game Framework (8-bit / 16-bit style)
 * Browser build (IIFE) - no external dependencies
 */
(function (global) {
  'use strict';

  // ========== Math ==========
  const MathUtil = {
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
    lerp(a, b, t) { return a + (b - a) * t; },
    snap(v) { return Math.round(v); },
    distance(x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },
    random(min, max) { return Math.random() * (max - min) + min; },
    randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  };

  // ========== Time ==========
  class Time {
    constructor() {
      this.delta = 0; this.elapsed = 0; this.fps = 0; this.frameCount = 0;
      this._fpsAccum = 0; this._fpsFrames = 0;
    }
    update(dt) {
      this.delta = dt; this.elapsed += dt; this.frameCount++;
      this._fpsAccum += dt; this._fpsFrames++;
      if (this._fpsAccum >= 1) {
        this.fps = Math.round(this._fpsFrames / this._fpsAccum);
        this._fpsAccum = 0; this._fpsFrames = 0;
      }
    }
    reset() {
      this.delta = 0; this.elapsed = 0; this.frameCount = 0;
      this._fpsAccum = 0; this._fpsFrames = 0; this.fps = 0;
    }
  }

  // ========== Animation ==========
  class Animation {
    constructor(opts = {}) {
      this.name = opts.name || 'default';
      this.frames = opts.frames || [];
      this.fps = opts.fps || 8;
      this.loop = opts.loop !== false;
      this.pingPong = !!opts.pingPong;
      this.reverse = !!opts.reverse;
      this.durations = opts.durations || null;
      this.events = opts.events || {};
    }
    get frameCount() { return this.frames.length; }
    getFrameDuration(i) {
      if (this.durations && this.durations[i] != null) return this.durations[i];
      return 1 / this.fps;
    }
  }

  class AnimationController {
    constructor(sprite) {
      this.sprite = sprite;
      this.anims = new Map();
      this.current = null; this.currentName = null;
      this.frameIndex = 0; this.time = 0;
      this.playing = false; this.paused = false; this.direction = 1;
      this.onComplete = null; this.onFrame = null;
    }
    add(name, data) {
      const anim = data instanceof Animation ? data : new Animation(Object.assign({ name }, data));
      this.anims.set(name, anim);
      return this;
    }
    has(name) { return this.anims.has(name); }
    play(name, force) {
      if (!force && this.currentName === name && this.playing) return this;
      const anim = this.anims.get(name);
      if (!anim) return this;
      this.current = anim; this.currentName = name;
      this.frameIndex = anim.reverse ? anim.frameCount - 1 : 0;
      this.time = 0; this.playing = true; this.paused = false; this.direction = 1;
      this._applyFrame();
      return this;
    }
    stop() { this.playing = false; this.frameIndex = 0; this.time = 0; return this; }
    pause() { this.paused = true; return this; }
    resume() { this.paused = false; return this; }
    restart() {
      if (this.current) {
        this.frameIndex = this.current.reverse ? this.current.frameCount - 1 : 0;
        this.time = 0; this.playing = true; this.paused = false;
        this._applyFrame();
      }
      return this;
    }
    setFrame(i) {
      if (!this.current) return this;
      this.frameIndex = Math.max(0, Math.min(i, this.current.frameCount - 1));
      this.time = 0; this._applyFrame();
      return this;
    }
    nextFrame() {
      if (!this.current) return this;
      this.frameIndex = (this.frameIndex + 1) % this.current.frameCount;
      this._applyFrame(); return this;
    }
    previousFrame() {
      if (!this.current) return this;
      this.frameIndex = (this.frameIndex - 1 + this.current.frameCount) % this.current.frameCount;
      this._applyFrame(); return this;
    }
    update(dt) {
      if (!this.playing || this.paused || !this.current || this.current.frameCount === 0) return;
      this.time += dt;
      const dur = this.current.getFrameDuration(this.frameIndex);
      while (this.time >= dur) {
        this.time -= dur;
        this._advance();
        if (!this.playing) break;
      }
    }
    _advance() {
      const anim = this.current;
      let next = this.frameIndex + this.direction;
      if (anim.pingPong) {
        if (next >= anim.frameCount) { this.direction = -1; next = anim.frameCount - 2; if (next < 0) next = 0; }
        else if (next < 0) {
          this.direction = 1; next = 1;
          if (next >= anim.frameCount) next = 0;
          if (!anim.loop) { this.playing = false; if (this.onComplete) this.onComplete(this.currentName); return; }
        }
      } else {
        if (next >= anim.frameCount) {
          if (anim.loop) next = 0;
          else { this.playing = false; if (this.onComplete) this.onComplete(this.currentName); return; }
        } else if (next < 0) {
          if (anim.loop) next = anim.frameCount - 1;
          else { this.playing = false; if (this.onComplete) this.onComplete(this.currentName); return; }
        }
      }
      this.frameIndex = next;
      this._applyFrame();
    }
    _applyFrame() {
      if (!this.current || !this.sprite) return;
      const frame = this.current.frames[this.frameIndex];
      if (!frame) return;
      if (typeof frame === 'object' && frame.pixels) {
        this.sprite.setPixels(frame.pixels);
      } else if (frame instanceof HTMLImageElement || frame instanceof HTMLCanvasElement) {
        this.sprite.setImage(frame);
      } else if (typeof frame === 'object' && frame.image) {
        this.sprite.setImage(frame.image, frame.x || 0, frame.y || 0, frame.w, frame.h);
      }
    }
  }

  // ========== Sprite ==========
  let _spriteUid = 0;
  class Sprite {
    constructor(opts = {}) {
      this.id = opts.id || ('sprite_' + (_spriteUid++));
      this.x = opts.x || 0; this.y = opts.y || 0;
      this.width = opts.width || 16; this.height = opts.height || 16;
      this.scaleX = opts.scaleX != null ? opts.scaleX : 1;
      this.scaleY = opts.scaleY != null ? opts.scaleY : 1;
      this.rotation = opts.rotation || 0;
      this.visible = opts.visible !== false;
      this.opacity = opts.opacity != null ? opts.opacity : 1;
      this.flipX = !!opts.flipX; this.flipY = !!opts.flipY;
      this.index = opts.index || 0;
      this.zIndex = opts.zIndex != null ? opts.zIndex : (opts.index || 0);
      this.layer = opts.layer || 0;
      this.anchorX = opts.anchorX != null ? opts.anchorX : 0;
      this.anchorY = opts.anchorY != null ? opts.anchorY : 0;
      this.image = opts.image || null;
      this.frameX = opts.frameX || 0; this.frameY = opts.frameY || 0;
      this.frameWidth = opts.frameWidth || this.width;
      this.frameHeight = opts.frameHeight || this.height;
      this.pixels = opts.pixels || null;
      this._canvas = null; this._ctx = null;
      this.animations = new AnimationController(this);
      this.collider = opts.collider || false;
      this.solid = opts.solid || false;
      this.trigger = opts.trigger || false;
      this.collisionBox = opts.collisionBox || null;
      this.tags = opts.tags || [];
      this.data = opts.data || {};
    }
    move(x, y) { this.x = x; this.y = y; return this; }
    translate(dx, dy) { this.x += dx; this.y += dy; return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    show() { this.visible = true; return this; }
    hide() { this.visible = false; return this; }
    flip(fx, fy) { if (fx != null) this.flipX = !!fx; if (fy != null) this.flipY = !!fy; return this; }
    setIndex(i) { this.index = i; this.zIndex = i; return this; }
    setLayer(l) { this.layer = l; return this; }
    setScale(sx, sy) { this.scaleX = sx; this.scaleY = sy != null ? sy : sx; return this; }
    setImage(img, fx, fy, fw, fh) {
      this.image = img; this.frameX = fx || 0; this.frameY = fy || 0;
      if (fw) this.frameWidth = fw; if (fh) this.frameHeight = fh;
      return this;
    }
    setPixels(colors) {
      this.pixels = colors;
      const h = colors.length, w = colors[0] ? colors[0].length : 0;
      this.width = w; this.height = h; this.frameWidth = w; this.frameHeight = h;
      if (!this._canvas) {
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');
        this._ctx.imageSmoothingEnabled = false;
      }
      this._canvas.width = w; this._canvas.height = h;
      const ctx = this._ctx;
      ctx.clearRect(0, 0, w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const c = colors[y][x];
          if (c && c !== 'transparent' && c !== '') {
            ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      this.image = this._canvas;
      return this;
    }
    addAnimation(name, frames, options) {
      this.animations.add(name, Object.assign({ frames }, options || {}));
      return this;
    }
    play(name) { this.animations.play(name); return this; }
    stop() { this.animations.stop(); return this; }
    pause() { this.animations.pause(); return this; }
    resume() { this.animations.resume(); return this; }
    getBounds() {
      const ax = this.anchorX * this.width * this.scaleX;
      const ay = this.anchorY * this.height * this.scaleY;
      return { x: this.x - ax, y: this.y - ay, width: this.width * Math.abs(this.scaleX), height: this.height * Math.abs(this.scaleY) };
    }
    getCollisionBounds() {
      if (this.collisionBox) {
        return { x: this.x + this.collisionBox.x, y: this.y + this.collisionBox.y, width: this.collisionBox.w, height: this.collisionBox.h };
      }
      return this.getBounds();
    }
    update(dt) { this.animations.update(dt); }
    render(ctx) {
      if (!this.visible || this.opacity <= 0 || !this.image) return;
      ctx.save();
      ctx.globalAlpha = this.opacity;
      const w = this.frameWidth || this.width, h = this.frameHeight || this.height;
      const dw = w * this.scaleX, dh = h * this.scaleY;
      let dx = Math.round(this.x - this.anchorX * dw);
      let dy = Math.round(this.y - this.anchorY * dh);
      ctx.translate(dx + (this.flipX ? dw : 0), dy + (this.flipY ? dh : 0));
      if (this.rotation) ctx.rotate(this.rotation);
      ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
      ctx.drawImage(this.image, this.frameX, this.frameY, w, h, 0, 0, Math.abs(dw), Math.abs(dh));
      ctx.restore();
    }
  }

  // ========== Physics ==========
  class PhysicsBody {
    constructor(owner) {
      this.owner = owner;
      this.velocityX = 0; this.velocityY = 0;
      this.accelerationX = 0; this.accelerationY = 0;
      this.gravity = 0; this.friction = 0; this.drag = 0;
      this.terminalVelocity = 10; this.grounded = false; this.enabled = true;
    }
    jump(force) { this.velocityY = force; this.grounded = false; }
    update(dt) {
      if (!this.enabled) return;
      this.velocityX += this.accelerationX * dt;
      this.velocityY += (this.accelerationY + this.gravity) * dt;
      if (this.grounded && this.friction) this.velocityX *= Math.max(0, 1 - this.friction * dt * 60);
      if (this.velocityY > this.terminalVelocity) this.velocityY = this.terminalVelocity;
      if (this.owner) { this.owner.x += this.velocityX; this.owner.y += this.velocityY; }
      this.accelerationX = 0; this.accelerationY = 0;
    }
  }

  // ========== Character ==========
  class Character extends Sprite {
    constructor(opts) {
      super(opts || {});
      this.direction = (opts && opts.direction) || 'down';
      this.facing = (opts && opts.facing) || 1;
      this.speed = (opts && opts.speed) || 1;
      this.physics = new PhysicsBody(this);
      if (opts && opts.gravity != null) this.physics.gravity = opts.gravity;
      this.health = (opts && opts.health != null) ? opts.health : 1;
      this.maxHealth = (opts && opts.maxHealth != null) ? opts.maxHealth : this.health;
      this.state = (opts && opts.state) || 'idle';
    }
    setDirection(dir) {
      this.direction = dir;
      if (dir.indexOf('left') >= 0) this.facing = -1;
      if (dir.indexOf('right') >= 0) this.facing = 1;
      this.flipX = this.facing < 0;
      return this;
    }
    jump(force) {
      this.physics.jump(force != null ? force : -5);
      this.state = 'jump';
      if (this.animations.has('jump')) this.play('jump');
      return this;
    }
    update(dt) {
      super.update(dt);
      this.physics.update(dt);
    }
  }

  // ========== Collision ==========
  const Collision = {
    intersects(a, b) {
      const A = a.getCollisionBounds ? a.getCollisionBounds() : a;
      const B = b.getCollisionBounds ? b.getCollisionBounds() : b;
      return A.x < B.x + B.width && A.x + A.width > B.x && A.y < B.y + B.height && A.y + A.height > B.y;
    },
    overlap(a, b) { return Collision.intersects(a, b); },
    containsPoint(rect, px, py) {
      const r = rect.getCollisionBounds ? rect.getCollisionBounds() : rect;
      return px >= r.x && px < r.x + r.width && py >= r.y && py < r.y + r.height;
    },
    resolveAABB(a, b) {
      const A = a.getCollisionBounds ? a.getCollisionBounds() : a;
      const B = b.getCollisionBounds ? b.getCollisionBounds() : b;
      const ox = Math.min(A.x + A.width, B.x + B.width) - Math.max(A.x, B.x);
      const oy = Math.min(A.y + A.height, B.y + B.height) - Math.max(A.y, B.y);
      if (ox <= 0 || oy <= 0) return { x: 0, y: 0 };
      if (ox < oy) {
        const dir = (A.x + A.width / 2) < (B.x + B.width / 2) ? -1 : 1;
        return { x: ox * dir, y: 0 };
      }
      const dir = (A.y + A.height / 2) < (B.y + B.height / 2) ? -1 : 1;
      return { x: 0, y: oy * dir };
    }
  };

  // ========== Input ==========
  class Input {
    constructor() {
      this.keys = new Map(); this.keysPressed = new Set(); this.keysReleased = new Set();
      this.mouse = { x: 0, y: 0, down: false, pressed: false, released: false };
      this.gamepads = []; this._attached = false;
      this._keyMap = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        ' ': 'space', Space: 'space', z: 'a', x: 'b', Enter: 'start', Shift: 'select',
        a: 'left', d: 'right', w: 'up', s: 'down'
      };
      this._onKeyDown = this._onKeyDown.bind(this);
      this._onKeyUp = this._onKeyUp.bind(this);
    }
    attach() {
      if (this._attached) return;
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      this._attached = true;
    }
    detach() {
      if (!this._attached) return;
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      this._attached = false;
    }
    update() { this.keysPressed.clear(); this.keysReleased.clear(); this._pollGamepads(); }
    _onKeyDown(e) {
      if (!this.keys.get(e.key)) {
        this.keysPressed.add(e.key);
        if (this._keyMap[e.key]) this.keysPressed.add(this._keyMap[e.key]);
      }
      this.keys.set(e.key, true);
    }
    _onKeyUp(e) {
      this.keys.set(e.key, false);
      this.keysReleased.add(e.key);
      if (this._keyMap[e.key]) this.keysReleased.add(this._keyMap[e.key]);
    }
    _pollGamepads() {
      if (!navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      this.gamepads = [];
      for (let i = 0; i < pads.length; i++) if (pads[i]) this.gamepads.push(pads[i]);
    }
    isDown(key) {
      if (this.keys.get(key)) return true;
      for (const pad of this.gamepads) {
        if (key === 'left' || key === 'ArrowLeft') { if (pad.axes[0] < -0.3) return true; }
        if (key === 'right' || key === 'ArrowRight') { if (pad.axes[0] > 0.3) return true; }
        if (key === 'up' || key === 'ArrowUp') { if (pad.axes[1] < -0.3) return true; }
        if (key === 'down' || key === 'ArrowDown') { if (pad.axes[1] > 0.3) return true; }
        if (key === 'a' && pad.buttons[0] && pad.buttons[0].pressed) return true;
        if (key === 'b' && pad.buttons[1] && pad.buttons[1].pressed) return true;
      }
      return false;
    }
    isPressed(key) { return this.keysPressed.has(key); }
    isReleased(key) { return this.keysReleased.has(key); }
    get axisX() {
      let v = 0;
      if (this.isDown('left') || this.isDown('ArrowLeft') || this.isDown('a')) v -= 1;
      if (this.isDown('right') || this.isDown('ArrowRight') || this.isDown('d')) v += 1;
      return v;
    }
    get axisY() {
      let v = 0;
      if (this.isDown('up') || this.isDown('ArrowUp') || this.isDown('w')) v -= 1;
      if (this.isDown('down') || this.isDown('ArrowDown') || this.isDown('s')) v += 1;
      return v;
    }
  }
  Input._instance = null;
  Input.get = function () {
    if (!Input._instance) Input._instance = new Input();
    return Input._instance;
  };

  // ========== Palette ==========
  class Palette {
    constructor(colors) {
      this.colors = (colors || []).map(Palette.normalize);
      this.name = 'custom';
    }
    static normalize(c) {
      if (typeof c === 'string') return c.startsWith('#') ? c.toUpperCase() : c;
      return '#000000';
    }
    get(i) { return this.colors[i] || '#000000'; }
    set(i, c) { this.colors[i] = Palette.normalize(c); return this; }
    add(c) { this.colors.push(Palette.normalize(c)); return this; }
    get length() { return this.colors.length; }
    clone() { const p = new Palette(this.colors); p.name = this.name; return p; }
    static getPreset(name) {
      const presets = {
        'NES-like': ['#7C7C7C','#0000FC','#0000BC','#4428BC','#940084','#A80020','#A81000','#881400','#503000','#007800','#006800','#005800','#004058','#000000','#BCBCBC','#0078F8','#0058F8','#6844FC','#D800CC','#E40058','#F83800','#E45C10','#AC7C00','#00B800','#00A800','#00A844','#008888','#000000','#F8F8F8','#3CBCFC','#6888FC','#9878F8','#F878F8','#F85898','#F87858','#FCA044','#F8B800','#B8F818','#58D854','#58F898','#00E8D8','#787878','#FCFCFC','#A4E4FC','#B8B8F8','#D8B8F8','#F8B8F8','#F8A4C0','#F0D0B0','#FCE0A8','#F8D878','#D8F878','#B8F8B8','#B8F8D8','#00FCFC','#F8D8F8'],
        'Game Boy-like': ['#0F380F','#306230','#8BAC0F','#9BBC0F'],
        'CGA-like': ['#000000','#0000AA','#00AA00','#00AAAA','#AA0000','#AA00AA','#AA5500','#AAAAAA','#555555','#5555FF','#55FF55','#55FFFF','#FF5555','#FF55FF','#FFFF55','#FFFFFF'],
        '16-bit': ['#000000','#1A1C2C','#5D275D','#B13E53','#EF7D57','#FFCD75','#A7F070','#38B764','#257179','#29366F','#3B5DC9','#41A6F6','#73EFF7','#F4F4F4','#94B0C2','#566C86','#333C57'],
        'Arcade': ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#FF8000','#8000FF']
      };
      return new Palette(presets[name] || ['#000000','#FFFFFF']);
    }
  }

  // ========== Tilemap ==========
  class Tilemap {
    constructor(opts) {
      opts = opts || {};
      this.tileWidth = opts.tileWidth || 16;
      this.tileHeight = opts.tileHeight || 16;
      this.width = opts.width || 32;
      this.height = opts.height || 30;
      this.tileset = opts.tileset || null;
      this.tilesetColumns = opts.tilesetColumns || 16;
      this.layers = new Map();
      this.collision = [];
      this.parallaxX = opts.parallaxX || 1;
      this.parallaxY = opts.parallaxY || 1;
      this._initCollision();
      this.addLayer('ground');
    }
    _initCollision() {
      this.collision = [];
      for (let y = 0; y < this.height; y++) this.collision[y] = new Array(this.width).fill(0);
    }
    addLayer(name, data) {
      const layer = { name, data: data || this._empty(), visible: true, opacity: 1, zIndex: this.layers.size };
      this.layers.set(name, layer);
      return layer;
    }
    _empty() {
      const d = [];
      for (let y = 0; y < this.height; y++) d[y] = new Array(this.width).fill(0);
      return d;
    }
    setTile(x, y, id, layerName) {
      const layer = this.layers.get(layerName || 'ground');
      if (!layer || x < 0 || y < 0 || x >= this.width || y >= this.height) return this;
      layer.data[y][x] = id; return this;
    }
    getTile(x, y, layerName) {
      const layer = this.layers.get(layerName || 'ground');
      if (!layer || x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
      return layer.data[y][x];
    }
    setCollision(x, y, solid) {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return this;
      this.collision[y][x] = solid ? 1 : 0; return this;
    }
    isSolid(x, y) {
      const tx = Math.floor(x / this.tileWidth), ty = Math.floor(y / this.tileHeight);
      if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
      return !!this.collision[ty][tx];
    }
    fill(id, layerName) {
      const layer = this.layers.get(layerName || 'ground');
      if (!layer) return this;
      for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) layer.data[y][x] = id;
      return this;
    }
    setTileset(img, cols) { this.tileset = img; this.tilesetColumns = cols || 16; return this; }
    update() {}
    render(ctx, camX, camY, viewW, viewH) {
      if (!this.tileset) return;
      const tw = this.tileWidth, th = this.tileHeight;
      const startX = Math.max(0, Math.floor((camX || 0) / tw) - 1);
      const startY = Math.max(0, Math.floor((camY || 0) / th) - 1);
      const endX = Math.min(this.width, Math.ceil(((camX || 0) + (viewW || 256)) / tw) + 1);
      const endY = Math.min(this.height, Math.ceil(((camY || 0) + (viewH || 240)) / th) + 1);
      const layers = Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
      for (const layer of layers) {
        if (!layer.visible) continue;
        ctx.globalAlpha = layer.opacity;
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const id = layer.data[y][x];
            if (!id) continue;
            const col = (id - 1) % this.tilesetColumns;
            const row = Math.floor((id - 1) / this.tilesetColumns);
            ctx.drawImage(this.tileset, col * tw, row * th, tw, th, x * tw, y * th, tw, th);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    get pixelWidth() { return this.width * this.tileWidth; }
    get pixelHeight() { return this.height * this.tileHeight; }
  }

  // ========== Camera ==========
  class Camera {
    constructor(opts) {
      opts = opts || {};
      this.width = opts.width || 256; this.height = opts.height || 240;
      this.x = opts.x || 0; this.y = opts.y || 0;
      this.target = null;
      this.deadzone = opts.deadzone || { x: 32, y: 24 };
      this.bounds = opts.bounds || null;
      this.smooth = opts.smooth != null ? opts.smooth : 0.15;
      this.offsetX = 0; this.offsetY = 0;
      this._shakeTime = 0; this._shakeIntensity = 0; this._shakeX = 0; this._shakeY = 0;
    }
    follow(t) { this.target = t; return this; }
    setBounds(x, y, w, h) { this.bounds = { x, y, width: w, height: h }; return this; }
    shake(intensity, duration) {
      this._shakeIntensity = intensity || 4;
      this._shakeTime = (duration || 10) / 60;
      return this;
    }
    update(dt) {
      if (this.target) {
        const tx = this.target.x - this.width / 2 + this.offsetX;
        const ty = this.target.y - this.height / 2 + this.offsetY;
        const dx = tx - this.x, dy = ty - this.y;
        if (Math.abs(dx) > this.deadzone.x) this.x += (dx - Math.sign(dx) * this.deadzone.x) * this.smooth;
        if (Math.abs(dy) > this.deadzone.y) this.y += (dy - Math.sign(dy) * this.deadzone.y) * this.smooth;
      }
      if (this._shakeTime > 0) {
        this._shakeTime -= dt;
        this._shakeX = (Math.random() - 0.5) * 2 * this._shakeIntensity;
        this._shakeY = (Math.random() - 0.5) * 2 * this._shakeIntensity;
      } else { this._shakeX = 0; this._shakeY = 0; }
      if (this.bounds) {
        this.x = Math.max(this.bounds.x, Math.min(this.x, this.bounds.x + this.bounds.width - this.width));
        this.y = Math.max(this.bounds.y, Math.min(this.y, this.bounds.y + this.bounds.height - this.height));
      }
      this.x = Math.round(this.x + this._shakeX);
      this.y = Math.round(this.y + this._shakeY);
    }
  }

  // ========== Scene ==========
  class Scene {
    constructor(name) {
      this.name = name || 'scene';
      this.sprites = []; this.characters = []; this.tilemaps = [];
      this.objects = []; this.particles = []; this.ui = []; this.backgrounds = [];
      this.camera = null; this.active = true; this.data = {};
    }
    add(entity) {
      if (!entity) return this;
      if (entity instanceof Character) this.characters.push(entity);
      if (entity.render || entity.x != null) this.sprites.push(entity);
      return this;
    }
    addTilemap(map) { this.tilemaps.push(map); return this; }
    remove(entity) {
      const rm = (arr) => { const i = arr.indexOf(entity); if (i >= 0) arr.splice(i, 1); };
      rm(this.sprites); rm(this.characters); rm(this.objects); rm(this.particles);
      return this;
    }
    find(id) {
      return this.sprites.find(s => s.id === id) || this.characters.find(c => c.id === id);
    }
    clear() {
      this.sprites.length = 0; this.characters.length = 0; this.tilemaps.length = 0;
      this.objects.length = 0; this.particles.length = 0; this.ui.length = 0;
    }
    update(dt) {
      if (!this.active) return;
      for (const m of this.tilemaps) if (m.update) m.update(dt);
      for (const s of this.sprites) if (s.update) s.update(dt);
      for (const p of this.particles) if (p.update) p.update(dt);
    }
    render(renderer) {
      if (!this.active) return;
      const ctx = renderer.ctx, cam = this.camera;
      for (const map of this.tilemaps) {
        map.render(ctx, cam ? cam.x * (map.parallaxX || 1) : 0, cam ? cam.y * (map.parallaxY || 1) : 0, renderer.width, renderer.height);
      }
      const sorted = this.sprites.slice().sort((a, b) => {
        const la = typeof a.layer === 'number' ? a.layer : 0;
        const lb = typeof b.layer === 'number' ? b.layer : 0;
        if (la !== lb) return la - lb;
        return (a.zIndex || a.index || 0) - (b.zIndex || b.index || 0);
      });
      for (const s of sorted) if (s.visible !== false) s.render(ctx);
      for (const p of this.particles) if (p.render) p.render(ctx);
    }
  }

  // ========== Renderer ==========
  class Renderer {
    constructor(opts) {
      opts = opts || {};
      this.width = opts.width || 256; this.height = opts.height || 240;
      this.scale = opts.scale || 3;
      this.background = opts.background || '#000000';
      this.parent = opts.parent || document.body;
      this.canvas = opts.canvas || document.createElement('canvas');
      this.canvas.width = this.width; this.canvas.height = this.height;
      this.canvas.style.imageRendering = 'pixelated';
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.ctx.imageSmoothingEnabled = false;
      this.display = document.createElement('canvas');
      this.display.style.imageRendering = 'pixelated';
      this.display.style.display = 'block';
      this.display.style.margin = '0 auto';
      this.dctx = this.display.getContext('2d');
      this.dctx.imageSmoothingEnabled = false;
      if (!opts.canvas) this.parent.appendChild(this.display);
      this.drawCalls = 0;
      this.resize();
    }
    resize() {
      this.display.width = this.width * this.scale;
      this.display.height = this.height * this.scale;
      this.dctx.imageSmoothingEnabled = false;
    }
    setScale(s) { this.scale = Math.max(1, Math.floor(s)); this.resize(); }
    begin(camera) {
      this.drawCalls = 0;
      this.ctx.fillStyle = this.background;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.save();
      if (camera) this.ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    }
    end() {
      this.ctx.restore();
      this.dctx.imageSmoothingEnabled = false;
      this.dctx.clearRect(0, 0, this.display.width, this.display.height);
      this.dctx.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, this.display.width, this.display.height);
    }
    destroy() {
      if (this.display && this.display.parentNode) this.display.parentNode.removeChild(this.display);
    }
  }

  class SpriteRenderer {
    constructor(opts) {
      opts = opts || {};
      this.width = opts.width || 256; this.height = opts.height || 240;
      this.scale = opts.scale || 3;
      this.background = opts.background || '#000000';
      this.parent = opts.parent || document.body;
      this.canvas = opts.canvas || document.createElement('canvas');
      this.canvas.width = this.width; this.canvas.height = this.height;
      this.canvas.style.imageRendering = 'pixelated';
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.ctx.imageSmoothingEnabled = false;
      this.display = document.createElement('canvas');
      this.display.style.imageRendering = 'pixelated';
      this.display.style.display = 'block';
      this.display.style.margin = '0 auto';
      this.dctx = this.display.getContext('2d');
      this.dctx.imageSmoothingEnabled = false;
      if (!opts.canvas) this.parent.appendChild(this.display);
      this.sprites = []; this.drawCalls = 0; this._updateCb = null; this.running = false; this._raf = null;
      this.resize();
    }
    resize() {
      this.display.width = this.width * this.scale;
      this.display.height = this.height * this.scale;
      this.dctx.imageSmoothingEnabled = false;
    }
    add(s) { if (s && this.sprites.indexOf(s) < 0) { this.sprites.push(s); this._sort(); } return this; }
    remove(s) { const i = this.sprites.indexOf(s); if (i >= 0) this.sprites.splice(i, 1); return this; }
    clear() { this.sprites.length = 0; }
    _sort() {
      this.sprites.sort((a, b) => {
        const la = a.layer || 0, lb = b.layer || 0;
        if (la !== lb) return la - lb;
        return (a.zIndex || a.index || 0) - (b.zIndex || b.index || 0);
      });
    }
    update(dt) {
      for (const s of this.sprites) if (s.update) s.update(dt);
      if (this._updateCb) this._updateCb(dt);
    }
    onUpdate(fn) { this._updateCb = fn; return this; }
    render() {
      this.drawCalls = 0;
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = this.background;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this._sort();
      for (const s of this.sprites) {
        if (s.visible !== false) { s.render(this.ctx); this.drawCalls++; }
      }
      this.dctx.imageSmoothingEnabled = false;
      this.dctx.clearRect(0, 0, this.display.width, this.display.height);
      this.dctx.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, this.display.width, this.display.height);
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
      if (this.display && this.display.parentNode) this.display.parentNode.removeChild(this.display);
    }
  }

  // ========== Particles ==========
  class Particles {
    constructor(opts) {
      opts = opts || {};
      this.x = opts.x || 0; this.y = opts.y || 0;
      this.count = opts.count || 20;
      this.particles = [];
      this.gravity = opts.gravity != null ? opts.gravity : 0.1;
      this.lifetime = opts.lifetime || 1;
      this.size = opts.size || 2;
      this.color = opts.color || '#FFFFFF';
      this.colors = opts.colors || null;
      this.speed = opts.speed || 2;
      this.spread = opts.spread != null ? opts.spread : Math.PI * 2;
      this.angle = opts.angle || 0;
      this.active = true;
    }
    burst(x, y, count) {
      const n = count != null ? count : this.count;
      const px = x != null ? x : this.x, py = y != null ? y : this.y;
      for (let i = 0; i < n; i++) {
        const a = this.angle + (Math.random() - 0.5) * this.spread;
        const sp = this.speed * (0.5 + Math.random() * 0.5);
        this.particles.push({
          x: px, y: py,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: this.lifetime * (0.5 + Math.random() * 0.5),
          maxLife: this.lifetime,
          size: this.size * (0.5 + Math.random()),
          color: this.colors ? this.colors[Math.floor(Math.random() * this.colors.length)] : this.color
        });
      }
      return this;
    }
    update(dt) {
      if (!this.active) return;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += this.gravity; p.x += p.vx; p.y += p.vy; p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    render(ctx) {
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size * (p.life / p.maxLife)));
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ========== Text ==========
  const Text = {
    draw(ctx, text, x, y, options) {
      options = options || {};
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.font = (options.size || 8) + 'px monospace';
      ctx.textAlign = options.align || 'left';
      ctx.textBaseline = options.baseline || 'top';
      if (options.shadow) {
        ctx.fillStyle = options.shadow.color || '#000';
        ctx.fillText(text, x + (options.shadow.x || 1), y + (options.shadow.y || 1));
      }
      if (options.outline) {
        ctx.strokeStyle = options.outline;
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);
      }
      ctx.fillStyle = options.color || '#FFF';
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  };

  // ========== Assets ==========
  class Assets {
    constructor() {
      this.images = new Map(); this.xmls = new Map();
      this.loading = 0; this.loaded = 0;
    }
    loadImage(key, src) {
      if (this.images.has(key)) return Promise.resolve(this.images.get(key));
      this.loading++;
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.images.set(key, img); this.loaded++; this.loading--;
          resolve(img);
        };
        img.onerror = () => { this.loading--; reject(new Error('Failed: ' + src)); };
        img.src = src;
      });
    }
    getImage(key) { return this.images.get(key); }
  }

  // ========== XML ==========
  const XML = {
    parse(xmlString) {
      if (typeof DOMParser === 'undefined') return { error: 'No DOMParser' };
      const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
      if (doc.querySelector('parsererror')) return { error: 'Parse error' };
      const root = doc.documentElement;
      const isSO = root.tagName === 'spriteProject' || root.getAttribute('mode') === 'spriteOnly';
      const project = {
        name: root.getAttribute('name') || 'Untitled',
        version: root.getAttribute('version') || '1.0',
        mode: isSO ? 'spriteOnly' : 'game',
        width: 256, height: 240, scale: 3,
        sprites: [], tilemaps: [], palettes: []
      };
      const settings = root.querySelector('settings');
      if (settings) {
        project.width = parseInt((settings.querySelector('width') || {}).textContent || '256', 10);
        project.height = parseInt((settings.querySelector('height') || {}).textContent || '240', 10);
        project.scale = parseInt((settings.querySelector('scale') || {}).textContent || '3', 10);
      }
      root.querySelectorAll('palette').forEach(pal => {
        const colors = [];
        pal.querySelectorAll('color').forEach(c => colors.push(c.textContent.trim()));
        project.palettes.push({ name: pal.getAttribute('name') || 'main', colors });
      });
      root.querySelectorAll('sprite').forEach(sp => {
        const sprite = {
          id: sp.getAttribute('id') || 'sprite',
          x: parseFloat(sp.getAttribute('x') || '0'),
          y: parseFloat(sp.getAttribute('y') || '0'),
          width: parseInt(sp.getAttribute('width') || '16', 10),
          height: parseInt(sp.getAttribute('height') || '16', 10),
          index: parseInt(sp.getAttribute('index') || '0', 10),
          animations: []
        };
        sp.querySelectorAll('animation').forEach(an => {
          const frames = [];
          an.querySelectorAll('frame').forEach(f => frames.push(f.getAttribute('src') || f.textContent.trim()));
          sprite.animations.push({
            name: an.getAttribute('name') || 'idle',
            fps: parseInt(an.getAttribute('fps') || '8', 10),
            loop: an.getAttribute('loop') !== 'false',
            frames
          });
        });
        project.sprites.push(sprite);
      });
      return project;
    },
    stringify(project) {
      const mode = project.mode === 'spriteOnly' ? 'spriteProject' : 'project';
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<' + mode + ' name="' + (project.name || 'Untitled') + '" version="' + (project.version || '1.0') + '"';
      if (project.mode === 'spriteOnly') xml += ' mode="spriteOnly" width="' + project.width + '" height="' + project.height + '"';
      xml += '>\n';
      if (project.mode !== 'spriteOnly') {
        xml += '  <settings>\n    <width>' + (project.width || 256) + '</width>\n    <height>' + (project.height || 240) + '</height>\n    <scale>' + (project.scale || 3) + '</scale>\n  </settings>\n';
      }
      (project.sprites || []).forEach(sp => {
        xml += '  <sprite id="' + sp.id + '" width="' + sp.width + '" height="' + sp.height + '" x="' + sp.x + '" y="' + sp.y + '" index="' + (sp.index || 0) + '">\n';
        (sp.animations || []).forEach(an => {
          xml += '    <animation name="' + an.name + '" fps="' + an.fps + '" loop="' + an.loop + '">\n';
          (an.frames || []).forEach(f => { xml += '      <frame src="' + f + '"/>\n'; });
          xml += '    </animation>\n';
        });
        xml += '  </sprite>\n';
      });
      xml += '</' + mode + '>\n';
      return xml;
    },
    load(url) { return fetch(url).then(r => r.text()).then(t => XML.parse(t)); },
    save(p) { return XML.stringify(p); },
    export(p) { return XML.stringify(p); }
  };

  // ========== Debug ==========
  class Debug {
    constructor(game) {
      this.game = game; this.enabled = false;
      this.showHitboxes = true; this.showFPS = true;
    }
    draw(ctx) {
      if (!this.enabled || !ctx) return;
      const g = this.game;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#0F0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let y = 4;
      if (this.showFPS) { ctx.fillText('FPS: ' + (g.fps || 0) + '  Frame: ' + (g.frame || 0), 4, y); y += 12; }
      if (g.scene) { ctx.fillText('Sprites: ' + g.scene.sprites.length, 4, y); y += 12; }
      if (g.camera) { ctx.fillText('Cam: ' + g.camera.x + ', ' + g.camera.y, 4, y); y += 12; }
      if (this.showHitboxes && g.scene) {
        ctx.strokeStyle = '#F00';
        ctx.lineWidth = 1;
        for (const s of g.scene.sprites) {
          if (!s.collider && !s.solid) continue;
          const b = s.getCollisionBounds ? s.getCollisionBounds() : s.getBounds();
          const cam = g.camera;
          ctx.strokeRect(Math.round(b.x - (cam ? cam.x : 0)), Math.round(b.y - (cam ? cam.y : 0)), b.width, b.height);
        }
      }
      ctx.restore();
    }
  }

  // ========== Game ==========
  class Game {
    constructor(options) {
      options = options || {};
      this.width = options.width || 256;
      this.height = options.height || 240;
      this.scale = options.scale || 3;
      this.spriteOnly = !!options.spriteOnly;
      this.background = options.background || '#000000';
      this.parent = typeof options.parent === 'string' ? document.querySelector(options.parent) : (options.parent || document.body);
      this.running = false; this.paused = false; this.frame = 0; this.fps = 0;
      this._lastTime = 0; this._accum = 0; this._fixedDt = 1 / 60;
      this._updateCallbacks = []; this._renderCallbacks = [];
      this.time = new Time();
      this.assets = new Assets();
      this.input = new Input();
      this.debug = new Debug(this);
      if (this.spriteOnly) {
        this.renderer = new SpriteRenderer({
          width: this.width, height: this.height, scale: this.scale,
          parent: this.parent, background: this.background
        });
        this.scene = null; this.camera = null;
      } else {
        this.renderer = new Renderer({
          width: this.width, height: this.height, scale: this.scale,
          parent: this.parent, background: this.background
        });
        this.scene = new Scene('default');
        this.camera = new Camera({ width: this.width, height: this.height });
        this.scene.camera = this.camera;
      }
      this._loop = this._loop.bind(this);
    }
    isSpriteOnly() { return this.spriteOnly; }
    enableGameMode() {
      if (!this.spriteOnly) return this;
      const sprites = this.renderer ? this.renderer.sprites.slice() : [];
      this.spriteOnly = false;
      this.renderer = new Renderer({
        width: this.width, height: this.height, scale: this.scale,
        parent: this.parent, background: this.background
      });
      this.scene = new Scene('default');
      this.camera = new Camera({ width: this.width, height: this.height });
      this.scene.camera = this.camera;
      sprites.forEach(s => this.scene.add(s));
      return this;
    }
    enableSpriteOnly() {
      if (this.spriteOnly) return this;
      const sprites = this.scene ? this.scene.sprites.slice() : [];
      this.spriteOnly = true;
      this.renderer = new SpriteRenderer({
        width: this.width, height: this.height, scale: this.scale,
        parent: this.parent, background: this.background
      });
      this.scene = null; this.camera = null;
      sprites.forEach(s => this.renderer.add(s));
      return this;
    }
    update(fn) { if (typeof fn === 'function') this._updateCallbacks.push(fn); return this; }
    onRender(fn) { if (typeof fn === 'function') this._renderCallbacks.push(fn); return this; }
    start() {
      if (this.running) return this;
      this.running = true; this.paused = false;
      this._lastTime = performance.now();
      this.input.attach();
      requestAnimationFrame(this._loop);
      return this;
    }
    stop() { this.running = false; this.input.detach(); return this; }
    pause() { this.paused = true; return this; }
    resume() { this.paused = false; this._lastTime = performance.now(); return this; }
    restart() { this.frame = 0; this.time.reset(); this.resume(); return this; }
    _loop(now) {
      if (!this.running) return;
      requestAnimationFrame(this._loop);
      const dt = Math.min((now - this._lastTime) / 1000, 0.1);
      this._lastTime = now;
      if (this.paused) return;
      this.time.update(dt); this.frame++; this.fps = this.time.fps;
      this._accum += dt;
      while (this._accum >= this._fixedDt) {
        this._fixedUpdate(this._fixedDt);
        this._accum -= this._fixedDt;
      }
      this._render();
    }
    _fixedUpdate(dt) {
      this.input.update();
      if (this.spriteOnly) this.renderer.update(dt);
      else {
        if (this.scene) this.scene.update(dt);
        if (this.camera) this.camera.update(dt);
      }
      for (const cb of this._updateCallbacks) { try { cb(dt); } catch (e) { console.error(e); } }
    }
    _render() {
      if (this.spriteOnly) this.renderer.render();
      else {
        this.renderer.begin(this.camera);
        if (this.scene) this.scene.render(this.renderer);
        this.renderer.end();
      }
      for (const cb of this._renderCallbacks) { try { cb(this.renderer.ctx); } catch (e) { console.error(e); } }
      if (this.debug.enabled) this.debug.draw(this.renderer.ctx);
    }
    get canvas() { return this.renderer ? this.renderer.canvas : null; }
    get ctx() { return this.renderer ? this.renderer.ctx : null; }
    destroy() {
      this.stop();
      if (this.renderer) this.renderer.destroy();
    }
  }

  // ========== Public API ==========
  const EightBit = {
    version: '1.0.0',
    mode: 'game',
    Game, Sprite, Character, Animation, AnimationController,
    Tilemap, Scene, Camera, Collision, Physics: PhysicsBody,
    Input, Palette, Particles, Text, Assets, XML, Debug,
    Renderer, SpriteRenderer, SpriteEngine: SpriteRenderer,
    Math: MathUtil, Time,
    isSpriteOnly() { return EightBit.mode === 'spriteOnly'; },
    setMode(m) { EightBit.mode = m === 'spriteOnly' ? 'spriteOnly' : 'game'; },
    SpriteOnly: {
      render(sprite, options) {
        options = options || {};
        const r = new SpriteRenderer({
          width: options.width || 256, height: options.height || 240,
          scale: options.scale || 3, parent: options.parent || document.body,
          background: options.background || '#000'
        });
        r.add(sprite); r.start(); return r;
      },
      create(options) { return new SpriteRenderer(options || {}); }
    },
    get input() { return Input.get(); }
  };

  global.EightBit = EightBit;
  if (typeof module !== 'undefined' && module.exports) module.exports = EightBit;

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
