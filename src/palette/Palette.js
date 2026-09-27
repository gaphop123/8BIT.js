/**
 * Retro Palette system with presets and swapping
 */
export class Palette {
  constructor(colors = []) {
    this.colors = colors.map(c => Palette.normalize(c));
    this.name = 'custom';
  }

  static normalize(c) {
    if (typeof c === 'string') {
      if (c.startsWith('#')) return c.toUpperCase();
      return c;
    }
    if (Array.isArray(c)) {
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
    return '#000000';
  }

  get(index) {
    return this.colors[index] || '#000000';
  }

  set(index, color) {
    this.colors[index] = Palette.normalize(color);
    return this;
  }

  add(color) {
    this.colors.push(Palette.normalize(color));
    return this;
  }

  get length() {
    return this.colors.length;
  }

  toArray() {
    return this.colors.slice();
  }

  clone() {
    const p = new Palette(this.colors);
    p.name = this.name;
    return p;
  }

  /** Swap two colors by index */
  swap(i, j) {
    const t = this.colors[i];
    this.colors[i] = this.colors[j];
    this.colors[j] = t;
    return this;
  }

  /** Create grayscale version */
  toGrayscale() {
    const p = new Palette();
    p.name = this.name + '_gray';
    for (const c of this.colors) {
      const rgb = Palette.hexToRgb(c);
      const g = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
      p.colors.push(`#${g.toString(16).padStart(2, '0').repeat(3)}`);
    }
    return p;
  }

  static hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  // --- Presets ---
  static NES = new Palette([
    '#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000',
    '#881400', '#503000', '#007800', '#006800', '#005800', '#004058', '#000000',
    '#BCBCBC', '#0078F8', '#0058F8', '#6844FC', '#D800CC', '#E40058', '#F83800',
    '#E45C10', '#AC7C00', '#00B800', '#00A800', '#00A844', '#008888', '#000000',
    '#F8F8F8', '#3CBCFC', '#6888FC', '#9878F8', '#F878F8', '#F85898', '#F87858',
    '#FCA044', '#F8B800', '#B8F818', '#58D854', '#58F898', '#00E8D8', '#787878',
    '#FCFCFC', '#A4E4FC', '#B8B8F8', '#D8B8F8', '#F8B8F8', '#F8A4C0', '#F0D0B0',
    '#FCE0A8', '#F8D878', '#D8F878', '#B8F8B8', '#B8F8D8', '#00FCFC', '#F8D8F8'
  ]);

  static GameBoy = new Palette([
    '#0F380F', '#306230', '#8BAC0F', '#9BBC0F'
  ]);

  static GameBoyPocket = new Palette([
    '#000000', '#555555', '#AAAAAA', '#FFFFFF'
  ]);

  static CGA = new Palette([
    '#000000', '#0000AA', '#00AA00', '#00AAAA',
    '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF',
    '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
  ]);

  static EGA = new Palette([
    '#000000', '#0000AA', '#00AA00', '#00AAAA',
    '#AA0000', '#AA00AA', '#AAAA00', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF',
    '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
  ]);

  static Arcade = new Palette([
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FF8000', '#8000FF',
    '#80FF00', '#0080FF', '#FF0080', '#00FF80', '#808080', '#404040'
  ]);

  static SixteenBit = new Palette([
    '#000000', '#1A1C2C', '#5D275D', '#B13E53', '#EF7D57', '#FFCD75',
    '#A7F070', '#38B764', '#257179', '#29366F', '#3B5DC9', '#41A6F6',
    '#73EFF7', '#F4F4F4', '#94B0C2', '#566C86', '#333C57'
  ]);

  static presets = {
    'NES-like': Palette.NES,
    'Game Boy-like': Palette.GameBoy,
    'Game Boy Pocket': Palette.GameBoyPocket,
    'CGA-like': Palette.CGA,
    'EGA-like': Palette.EGA,
    'Arcade': Palette.Arcade,
    '16-bit': Palette.SixteenBit
  };

  static getPreset(name) {
    return Palette.presets[name] ? Palette.presets[name].clone() : new Palette();
  }
}

// Init names
Palette.NES.name = 'NES-like';
Palette.GameBoy.name = 'Game Boy-like';
Palette.GameBoyPocket.name = 'Game Boy Pocket';
Palette.CGA.name = 'CGA-like';
Palette.EGA.name = 'EGA-like';
Palette.Arcade.name = 'Arcade';
Palette.SixteenBit.name = '16-bit';

export default Palette;
