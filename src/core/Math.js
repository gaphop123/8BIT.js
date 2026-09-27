/**
 * Utility math helpers for pixel-perfect operations
 */
export const MathUtil = {
  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  /** Snap to integer pixel */
  snap(v) {
    return Math.round(v);
  },

  /** Floor to integer pixel */
  floor(v) {
    return Math.floor(v);
  },

  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  degToRad(d) {
    return d * Math.PI / 180;
  },

  radToDeg(r) {
    return r * 180 / Math.PI;
  },

  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

export default MathUtil;
