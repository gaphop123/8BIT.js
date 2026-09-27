/**
 * Time management for fixed timestep and delta time
 */
export class Time {
  constructor() {
    this.delta = 0;
    this.elapsed = 0;
    this.fps = 0;
    this.frameCount = 0;
    this._fpsAccum = 0;
    this._fpsFrames = 0;
  }

  update(dt) {
    this.delta = dt;
    this.elapsed += dt;
    this.frameCount++;
    this._fpsAccum += dt;
    this._fpsFrames++;
    if (this._fpsAccum >= 1) {
      this.fps = Math.round(this._fpsFrames / this._fpsAccum);
      this._fpsAccum = 0;
      this._fpsFrames = 0;
    }
  }

  reset() {
    this.delta = 0;
    this.elapsed = 0;
    this.frameCount = 0;
    this._fpsAccum = 0;
    this._fpsFrames = 0;
    this.fps = 0;
  }
}

export default Time;
