/**
 * 8BIT.js - Complete 2D Retro Game Framework
 * Global namespace: EightBit
 */

import { Game } from './core/Game.js';
import { Sprite } from './sprite/Sprite.js';
import { Animation } from './animation/Animation.js';
import { AnimationController } from './animation/AnimationController.js';
import { Character } from './character/Character.js';
import { Tilemap } from './tilemap/Tilemap.js';
import { Scene } from './scene/Scene.js';
import { Camera } from './camera/Camera.js';
import { Collision } from './collision/Collision.js';
import { PhysicsBody } from './physics/Physics.js';
import { Input } from './input/Input.js';
import { Palette } from './palette/Palette.js';
import { Particles } from './particle/Particles.js';
import { Text } from './text/Text.js';
import { Assets } from './asset/Assets.js';
import { XML } from './xml/XML.js';
import { Renderer } from './renderer/Renderer.js';
import { SpriteRenderer } from './renderer/SpriteRenderer.js';
import { Debug } from './debug/Debug.js';
import { MathUtil } from './core/Math.js';
import { Time } from './core/Time.js';

const EightBit = {
  version: '1.0.0',
  mode: 'game', // 'game' | 'spriteOnly'

  // Core
  Game,
  Time,
  Math: MathUtil,

  // Rendering
  Renderer,
  SpriteRenderer,

  // Entities
  Sprite,
  Character,
  Animation,
  AnimationController,

  // World
  Tilemap,
  Scene,
  Camera,

  // Systems
  Collision,
  Physics: PhysicsBody,
  Input,
  Palette,
  Particles,
  Text,
  Assets,
  XML,
  Debug,

  // Helpers
  isSpriteOnly() {
    return EightBit.mode === 'spriteOnly';
  },

  setMode(mode) {
    EightBit.mode = mode === 'spriteOnly' ? 'spriteOnly' : 'game';
  },

  /** Quick sprite-only render helper */
  SpriteOnly: {
    render(sprite, options = {}) {
      const renderer = new SpriteRenderer({
        width: options.width || 256,
        height: options.height || 240,
        scale: options.scale || 3,
        parent: options.parent || document.body,
        background: options.background || '#000000'
      });
      renderer.add(sprite);
      renderer.start();
      return renderer;
    },

    create(options = {}) {
      return new SpriteRenderer(options);
    }
  },

  /** SpriteEngine alias for SpriteRenderer */
  SpriteEngine: SpriteRenderer,

  // Static Input convenience
  get input() {
    return Input.get();
  }
};

// Browser global
if (typeof window !== 'undefined') {
  window.EightBit = EightBit;
}

export default EightBit;
export {
  Game,
  Sprite,
  Character,
  Animation,
  Tilemap,
  Scene,
  Camera,
  Collision,
  Input,
  Palette,
  Particles,
  Text,
  Assets,
  XML,
  Renderer,
  SpriteRenderer,
  Debug
};
