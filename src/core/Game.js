/**
 * 8BIT.js - Core Game class
 * Main entry point for both Full Game Mode and Sprite Only Mode
 */

import { Renderer } from '../renderer/Renderer.js';
import { Input } from '../input/Input.js';
import { Scene } from '../scene/Scene.js';
import { Camera } from '../camera/Camera.js';
import { Assets } from '../asset/Assets.js';
import { Debug } from '../debug/Debug.js';
import { Time } from './Time.js';
import { SpriteRenderer } from '../renderer/SpriteRenderer.js';

export class Game {
  /**
   * @param {Object} options
   * @param {number} [options.width=256]
   * @param {number} [options.height=240]
   * @param {number} [options.scale=3]
   * @param {boolean} [options.spriteOnly=false]
   * @param {HTMLElement|string} [options.parent=document.body]
   * @param {boolean} [options.pixelPerfect=true]
   * @param {boolean} [options.fullscreen=false]
   * @param {string} [options.background='#000000']
   */
  constructor(options = {}) {
    this.width = options.width || 256;
    this.height = options.height || 240;
    this.scale = options.scale || 3;
    this.spriteOnly = !!options.spriteOnly;
    this.pixelPerfect = options.pixelPerfect !== false;
    this.background = options.background || '#000000';
    this.parent = typeof options.parent === 'string'
      ? document.querySelector(options.parent)
      : (options.parent || document.body);

    this.running = false;
    this.paused = false;
    this.frame = 0;
    this.fps = 0;
    this._lastTime = 0;
    this._accum = 0;
    this._fixedDt = 1 / 60;
    this._updateCallbacks = [];
    this._renderCallbacks = [];

    // Core systems always available
    this.time = new Time();
    this.assets = new Assets();
    this.input = new Input();
    this.debug = new Debug(this);

    if (this.spriteOnly) {
      this.renderer = new SpriteRenderer({
        width: this.width,
        height: this.height,
        scale: this.scale,
        parent: this.parent,
        pixelPerfect: this.pixelPerfect,
        background: this.background
      });
      this.scene = null;
      this.camera = null;
    } else {
      this.renderer = new Renderer({
        width: this.width,
        height: this.height,
        scale: this.scale,
        parent: this.parent,
        pixelPerfect: this.pixelPerfect,
        background: this.background
      });
      this.scene = new Scene('default');
      this.camera = new Camera({ width: this.width, height: this.height });
      this.scene.camera = this.camera;
    }

    // Bind methods
    this._loop = this._loop.bind(this);
    this._onResize = this._onResize.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onResize);
    }
  }

  /** Check if currently in sprite-only mode */
  isSpriteOnly() {
    return this.spriteOnly;
  }

  /** Switch to full game mode without losing sprites */
  enableGameMode() {
    if (!this.spriteOnly) return this;
    const sprites = this.renderer ? this.renderer.sprites.slice() : [];
    this.spriteOnly = false;
    const oldCanvas = this.renderer && this.renderer.canvas;
    this.renderer = new Renderer({
      width: this.width,
      height: this.height,
      scale: this.scale,
      parent: this.parent,
      pixelPerfect: this.pixelPerfect,
      background: this.background,
      canvas: oldCanvas
    });
    this.scene = new Scene('default');
    this.camera = new Camera({ width: this.width, height: this.height });
    this.scene.camera = this.camera;
    sprites.forEach(s => this.scene.add(s));
    return this;
  }

  /** Switch to sprite-only mode */
  enableSpriteOnly() {
    if (this.spriteOnly) return this;
    const sprites = this.scene ? this.scene.sprites.slice() : [];
    this.spriteOnly = true;
    const oldCanvas = this.renderer && this.renderer.canvas;
    this.renderer = new SpriteRenderer({
      width: this.width,
      height: this.height,
      scale: this.scale,
      parent: this.parent,
      pixelPerfect: this.pixelPerfect,
      background: this.background,
      canvas: oldCanvas
    });
    this.scene = null;
    this.camera = null;
    sprites.forEach(s => this.renderer.add(s));
    return this;
  }

  /**
   * Register update callback
   * @param {function(number)} fn - receives deltaTime
   */
  update(fn) {
    if (typeof fn === 'function') this._updateCallbacks.push(fn);
    return this;
  }

  /**
   * Register render callback
   * @param {function(CanvasRenderingContext2D)} fn
   */
  onRender(fn) {
    if (typeof fn === 'function') this._renderCallbacks.push(fn);
    return this;
  }

  start() {
    if (this.running) return this;
    this.running = true;
    this.paused = false;
    this._lastTime = performance.now();
    this.input.attach();
    requestAnimationFrame(this._loop);
    return this;
  }

  stop() {
    this.running = false;
    this.input.detach();
    return this;
  }

  pause() {
    this.paused = true;
    return this;
  }

  resume() {
    this.paused = false;
    this._lastTime = performance.now();
    return this;
  }

  restart() {
    this.frame = 0;
    this.time.reset();
    if (this.scene) this.scene.reset();
    this.resume();
    return this;
  }

  _loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this._loop);

    const dt = Math.min((now - this._lastTime) / 1000, 0.1);
    this._lastTime = now;

    if (this.paused) return;

    this.time.update(dt);
    this.frame++;
    this.fps = this.time.fps;

    // Fixed timestep update
    this._accum += dt;
    while (this._accum >= this._fixedDt) {
      this._fixedUpdate(this._fixedDt);
      this._accum -= this._fixedDt;
    }

    this._render();
  }

  _fixedUpdate(dt) {
    this.input.update();
    if (this.spriteOnly) {
      this.renderer.update(dt);
    } else {
      if (this.scene) this.scene.update(dt);
      if (this.camera) this.camera.update(dt);
    }
    for (const cb of this._updateCallbacks) {
      try { cb(dt); } catch (e) { console.error(e); }
    }
  }

  _render() {
    if (this.spriteOnly) {
      this.renderer.render();
    } else {
      this.renderer.begin(this.camera);
      if (this.scene) this.scene.render(this.renderer);
      this.renderer.end();
    }
    for (const cb of this._renderCallbacks) {
      try { cb(this.renderer.ctx); } catch (e) { console.error(e); }
    }
    if (this.debug.enabled) this.debug.draw(this.renderer.ctx);
  }

  _onResize() {
    if (this.renderer) this.renderer.resize();
  }

  /** Get the underlying canvas element */
  get canvas() {
    return this.renderer ? this.renderer.canvas : null;
  }

  /** Get 2D context */
  get ctx() {
    return this.renderer ? this.renderer.ctx : null;
  }

  destroy() {
    this.stop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onResize);
    }
    if (this.renderer) this.renderer.destroy();
  }
}

export default Game;
