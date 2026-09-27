/**
 * Pixel font text renderer
 */
export class Text {
  static defaultFont = null;
  static fonts = new Map();

  /**
   * Draw text with built-in or custom pixel font
   */
  static draw(ctx, text, x, y, options = {}) {
    const {
      color = '#FFFFFF',
      size = 8,
      align = 'left',
      baseline = 'top',
      outline = null,
      shadow = null,
      spacing = 0,
      lineHeight = 1.2,
      font = null
    } = options;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Fallback to system monospace if no bitmap font
    const fontFamily = font || 'monospace';
    ctx.font = `${size}px ${fontFamily}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (shadow) {
      ctx.fillStyle = shadow.color || '#000000';
      ctx.fillText(text, x + (shadow.x || 1), y + (shadow.y || 1));
    }
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Simple built-in 8x8 pixel font data (subset)
   * For full production, load a bitmap font atlas
   */
  static createBitmapFont(image, charWidth = 8, charHeight = 8, chars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~') {
    return {
      image,
      charWidth,
      charHeight,
      chars,
      map: (() => {
        const m = {};
        for (let i = 0; i < chars.length; i++) {
          m[chars[i]] = i;
        }
        return m;
      })()
    };
  }

  static drawBitmap(ctx, text, x, y, font, options = {}) {
    if (!font || !font.image) {
      Text.draw(ctx, text, x, y, options);
      return;
    }
    const color = options.color;
    const scale = options.scale || 1;
    let cx = x;
    for (const ch of text) {
      const idx = font.map[ch];
      if (idx == null) {
        cx += font.charWidth * scale;
        continue;
      }
      const sx = (idx % 16) * font.charWidth; // assume 16 cols
      const sy = Math.floor(idx / 16) * font.charHeight;
      ctx.drawImage(
        font.image,
        sx, sy, font.charWidth, font.charHeight,
        Math.round(cx), Math.round(y),
        font.charWidth * scale, font.charHeight * scale
      );
      cx += (font.charWidth + (options.spacing || 0)) * scale;
    }
  }
}

export default Text;
