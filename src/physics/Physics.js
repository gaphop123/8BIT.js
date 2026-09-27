/**
 * Simple arcade-style physics body
 */
export class PhysicsBody {
  constructor(owner) {
    this.owner = owner;
    this.velocityX = 0;
    this.velocityY = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
    this.gravity = 0;
    this.friction = 0;
    this.drag = 0;
    this.terminalVelocity = 10;
    this.grounded = false;
    this.enabled = true;
  }

  jump(force) {
    this.velocityY = force;
    this.grounded = false;
  }

  applyForce(fx, fy) {
    this.accelerationX += fx;
    this.accelerationY += fy;
  }

  update(dt) {
    if (!this.enabled) return;

    this.velocityX += this.accelerationX * dt;
    this.velocityY += (this.accelerationY + this.gravity) * dt;

    // Friction / drag
    if (this.grounded && this.friction) {
      this.velocityX *= Math.max(0, 1 - this.friction * dt * 60);
    }
    if (this.drag) {
      this.velocityX *= Math.max(0, 1 - this.drag * dt);
      this.velocityY *= Math.max(0, 1 - this.drag * dt);
    }

    // Terminal velocity
    if (this.velocityY > this.terminalVelocity) {
      this.velocityY = this.terminalVelocity;
    }
    if (this.velocityY < -this.terminalVelocity) {
      this.velocityY = -this.terminalVelocity;
    }

    if (this.owner) {
      this.owner.x += this.velocityX;
      this.owner.y += this.velocityY;
    }

    // Reset acceleration
    this.accelerationX = 0;
    this.accelerationY = 0;
  }
}

export default PhysicsBody;
