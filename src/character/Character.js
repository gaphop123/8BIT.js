/**
 * Character extends Sprite with movement, direction, physics, hitboxes
 */
import { Sprite } from '../sprite/Sprite.js';
import { PhysicsBody } from '../physics/Physics.js';

export class Character extends Sprite {
  constructor(opts = {}) {
    super(opts);
    this.direction = opts.direction || 'down'; // up down left right + diagonals
    this.facing = opts.facing || 1; // 1 = right, -1 = left
    this.speed = opts.speed || 1;
    this.physics = new PhysicsBody(this);
    if (opts.gravity != null) this.physics.gravity = opts.gravity;
    if (opts.velocityX != null) this.physics.velocityX = opts.velocityX;
    if (opts.velocityY != null) this.physics.velocityY = opts.velocityY;

    this.hitbox = opts.hitbox || null;
    this.hurtbox = opts.hurtbox || null;
    this.health = opts.health != null ? opts.health : 1;
    this.maxHealth = opts.maxHealth != null ? opts.maxHealth : this.health;
    this.invincible = false;
    this.state = opts.state || 'idle';
  }

  setDirection(dir) {
    this.direction = dir;
    if (dir.includes('left')) this.facing = -1;
    if (dir.includes('right')) this.facing = 1;
    this.flipX = this.facing < 0;
    return this;
  }

  moveBy(dx, dy) {
    this.x += dx;
    this.y += dy;
    if (dx < 0) this.setDirection('left');
    else if (dx > 0) this.setDirection('right');
    if (dy < 0 && dx === 0) this.setDirection('up');
    else if (dy > 0 && dx === 0) this.setDirection('down');
    return this;
  }

  jump(force = -5) {
    this.physics.jump(force);
    this.state = 'jump';
    if (this.animations.has('jump')) this.play('jump');
    return this;
  }

  takeDamage(amount = 1) {
    if (this.invincible) return this;
    this.health = Math.max(0, this.health - amount);
    this.state = 'hurt';
    if (this.animations.has('hurt')) this.play('hurt');
    if (this.health <= 0) {
      this.state = 'death';
      if (this.animations.has('death')) this.play('death');
    }
    return this;
  }

  update(dt) {
    super.update(dt);
    this.physics.update(dt);

    // Auto animation based on state
    if (this.physics.grounded && Math.abs(this.physics.velocityX) > 0.1) {
      if (this.state !== 'walk' && this.animations.has('walk')) {
        this.state = 'walk';
        this.play('walk');
      }
    } else if (this.physics.grounded && this.state === 'walk') {
      this.state = 'idle';
      if (this.animations.has('idle')) this.play('idle');
    }
  }
}

export default Character;
