/**
 * Single animation definition
 */
export class Animation {
  /**
   * @param {Object} opts
   * @param {string} opts.name
   * @param {Array<string|Object|HTMLImageElement>} opts.frames
   * @param {number} [opts.fps=8]
   * @param {boolean} [opts.loop=true]
   * @param {boolean} [opts.pingPong=false]
   * @param {boolean} [opts.reverse=false]
   * @param {number[]} [opts.durations] - per-frame duration overrides (seconds)
   */
  constructor(opts = {}) {
    this.name = opts.name || 'default';
    this.frames = opts.frames || [];
    this.fps = opts.fps || 8;
    this.loop = opts.loop !== false;
    this.pingPong = !!opts.pingPong;
    this.reverse = !!opts.reverse;
    this.durations = opts.durations || null;
    this.events = opts.events || {}; // frameIndex -> callback name or fn
  }

  get frameCount() {
    return this.frames.length;
  }

  getFrameDuration(index) {
    if (this.durations && this.durations[index] != null) {
      return this.durations[index];
    }
    return 1 / this.fps;
  }

  get totalDuration() {
    let t = 0;
    for (let i = 0; i < this.frames.length; i++) {
      t += this.getFrameDuration(i);
    }
    return t;
  }
}

export default Animation;
