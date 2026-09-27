/**
 * Animation state machine / controller attached to a Sprite
 */
import { Animation } from './Animation.js';

export class AnimationController {
  constructor(sprite) {
    this.sprite = sprite;
    /** @type {Map<string, Animation>} */
    this.anims = new Map();
    this.current = null;
    this.currentName = null;
    this.frameIndex = 0;
    this.time = 0;
    this.playing = false;
    this.paused = false;
    this.direction = 1; // 1 or -1 for ping-pong
    this.onComplete = null;
    this.onFrame = null;
  }

  /**
   * @param {string} name
   * @param {Object|Animation} data
   */
  add(name, data) {
    const anim = data instanceof Animation
      ? data
      : new Animation({ name, ...data });
    this.anims.set(name, anim);
    return this;
  }

  has(name) {
    return this.anims.has(name);
  }

  get(name) {
    return this.anims.get(name);
  }

  play(name, force = false) {
    if (!force && this.currentName === name && this.playing) return this;
    const anim = this.anims.get(name);
    if (!anim) {
      console.warn(`[8BIT] Animation "${name}" not found`);
      return this;
    }
    this.current = anim;
    this.currentName = name;
    this.frameIndex = anim.reverse ? anim.frameCount - 1 : 0;
    this.time = 0;
    this.playing = true;
    this.paused = false;
    this.direction = 1;
    this._applyFrame();
    return this;
  }

  stop() {
    this.playing = false;
    this.frameIndex = 0;
    this.time = 0;
    return this;
  }

  pause() {
    this.paused = true;
    return this;
  }

  resume() {
    this.paused = false;
    return this;
  }

  restart() {
    if (this.current) {
      this.frameIndex = this.current.reverse ? this.current.frameCount - 1 : 0;
      this.time = 0;
      this.playing = true;
      this.paused = false;
      this._applyFrame();
    }
    return this;
  }

  setFrame(index) {
    if (!this.current) return this;
    this.frameIndex = Math.max(0, Math.min(index, this.current.frameCount - 1));
    this.time = 0;
    this._applyFrame();
    return this;
  }

  nextFrame() {
    if (!this.current) return this;
    this.frameIndex = (this.frameIndex + 1) % this.current.frameCount;
    this._applyFrame();
    return this;
  }

  previousFrame() {
    if (!this.current) return this;
    this.frameIndex = (this.frameIndex - 1 + this.current.frameCount) % this.current.frameCount;
    this._applyFrame();
    return this;
  }

  setAnimation(name) {
    return this.play(name, true);
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
      if (next >= anim.frameCount) {
        this.direction = -1;
        next = anim.frameCount - 2;
        if (next < 0) next = 0;
      } else if (next < 0) {
        this.direction = 1;
        next = 1;
        if (next >= anim.frameCount) next = 0;
        if (!anim.loop) {
          this.playing = false;
          if (this.onComplete) this.onComplete(this.currentName);
          return;
        }
      }
    } else {
      if (next >= anim.frameCount) {
        if (anim.loop) {
          next = 0;
        } else {
          this.playing = false;
          if (this.onComplete) this.onComplete(this.currentName);
          return;
        }
      } else if (next < 0) {
        if (anim.loop) {
          next = anim.frameCount - 1;
        } else {
          this.playing = false;
          if (this.onComplete) this.onComplete(this.currentName);
          return;
        }
      }
    }

    this.frameIndex = next;
    this._applyFrame();

    // Frame events
    if (anim.events[this.frameIndex] && this.onFrame) {
      this.onFrame(this.frameIndex, anim.events[this.frameIndex]);
    }
  }

  _applyFrame() {
    if (!this.current || !this.sprite) return;
    const frame = this.current.frames[this.frameIndex];
    if (!frame) return;

    if (typeof frame === 'string') {
      // Assume frame is an image key or data URL – resolved by asset system later
      // For now store as pending key
      this.sprite._frameKey = frame;
    } else if (frame instanceof HTMLImageElement || frame instanceof HTMLCanvasElement) {
      this.sprite.setImage(frame);
    } else if (typeof frame === 'object') {
      if (frame.image) {
        this.sprite.setImage(
          frame.image,
          frame.x || 0,
          frame.y || 0,
          frame.w || frame.width,
          frame.h || frame.height
        );
      }
      if (frame.pixels) {
        this.sprite.setPixels(frame.pixels);
      }
    }
  }
}

export default AnimationController;
