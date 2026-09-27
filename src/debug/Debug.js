/**
 * Debug overlay
 */
export class Debug {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.showHitboxes = true;
    this.showFPS = true;
    this.showCamera = true;
    this.showBounds = true;
  }

  draw(ctx) {
    if (!this.enabled || !ctx) return;
    const g = this.game;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#00FF00';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let y = 4;
    if (this.showFPS) {
      ctx.fillText(`FPS: ${g.fps || 0}  Frame: ${g.frame || 0}`, 4, y);
      y += 12;
    }

    if (g.scene) {
      ctx.fillText(`Sprites: ${g.scene.sprites.length}`, 4, y);
      y += 12;
    }

    if (this.showCamera && g.camera) {
      ctx.fillText(`Cam: ${g.camera.x}, ${g.camera.y}`, 4, y);
      y += 12;
    }

    if (g.renderer) {
      ctx.fillText(`DrawCalls: ${g.renderer.drawCalls || 0}`, 4, y);
    }

    // Hitboxes
    if (this.showHitboxes && g.scene) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1;
      for (const s of g.scene.sprites) {
        if (!s.collider && !s.solid) continue;
        const b = s.getCollisionBounds ? s.getCollisionBounds() : s.getBounds();
        const cam = g.camera;
        const sx = b.x - (cam ? cam.x : 0);
        const sy = b.y - (cam ? cam.y : 0);
        ctx.strokeRect(Math.round(sx), Math.round(sy), b.width, b.height);
      }
    }

    ctx.restore();
  }
}

export default Debug;
