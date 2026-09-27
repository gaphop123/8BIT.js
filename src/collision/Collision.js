/**
 * Simple collision detection: AABB, circle, point, tile
 */
export class Collision {
  static intersects(a, b) {
    const A = a.getCollisionBounds ? a.getCollisionBounds() : a;
    const B = b.getCollisionBounds ? b.getCollisionBounds() : b;
    return (
      A.x < B.x + B.width &&
      A.x + A.width > B.x &&
      A.y < B.y + B.height &&
      A.y + A.height > B.y
    );
  }

  static overlap(a, b) {
    return Collision.intersects(a, b);
  }

  static containsPoint(rect, px, py) {
    const r = rect.getCollisionBounds ? rect.getCollisionBounds() : rect;
    return px >= r.x && px < r.x + r.width && py >= r.y && py < r.y + r.height;
  }

  static circleCircle(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
  }

  static rectCircle(rect, cx, cy, r) {
    const R = rect.getCollisionBounds ? rect.getCollisionBounds() : rect;
    const closestX = Math.max(R.x, Math.min(cx, R.x + R.width));
    const closestY = Math.max(R.y, Math.min(cy, R.y + R.height));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < r * r;
  }

  /**
   * Resolve AABB collision by pushing a out of b
   * Returns {x, y} penetration
   */
  static resolveAABB(a, b) {
    const A = a.getCollisionBounds ? a.getCollisionBounds() : a;
    const B = b.getCollisionBounds ? b.getCollisionBounds() : b;
    const overlapX = Math.min(A.x + A.width, B.x + B.width) - Math.max(A.x, B.x);
    const overlapY = Math.min(A.y + A.height, B.y + B.height) - Math.max(A.y, B.y);
    if (overlapX <= 0 || overlapY <= 0) return { x: 0, y: 0 };

    if (overlapX < overlapY) {
      const dir = (A.x + A.width / 2) < (B.x + B.width / 2) ? -1 : 1;
      return { x: overlapX * dir, y: 0 };
    } else {
      const dir = (A.y + A.height / 2) < (B.y + B.height / 2) ? -1 : 1;
      return { x: 0, y: overlapY * dir };
    }
  }
}

export default Collision;
