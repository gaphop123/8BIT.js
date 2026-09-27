# 8BIT.js

**A complete 2D retro game framework** for creating 8-bit / 16-bit style games, sprites, animations, tilemaps and pixel-art — with optional Sprite-Only mode and integrated tooling.

```js
const game = new EightBit.Game({ width: 256, height: 240, scale: 3 });
game.start();
```

## Features

- **Pixel-perfect Canvas 2D** rendering (nearest-neighbor, integer scaling)
- **Sprite & Character** system with flip, anchor, z-index, layers
- **Animation** controller (loop, ping-pong, FPS, frame events)
- **Tilemap** with layers, collision, parallax
- **Camera** (follow, deadzone, bounds, shake)
- **Collision** (AABB) + simple arcade **Physics**
- **Input** (Keyboard, Gamepad)
- **Palette** presets (NES, Game Boy, CGA, 16-bit…)
- **Particles** (pixel style)
- **Text** renderer
- **XML** project format
- **Sprite Only Mode** — lightweight path when you only need sprites/animation
- **Debug overlay**

> No audio system · No hardware console emulation · Pure JavaScript, zero dependencies.

## Quick Start

### Full Game Mode

```html
<script src="dist/8bit.js"></script>
<script>
  const game = new EightBit.Game({
    width: 256,
    height: 240,
    scale: 3
  });

  const player = new EightBit.Character({
    x: 120, y: 100, width: 16, height: 24
  });

  // Procedural pixel art
  player.setPixels([
    ['#000','#F00','#F00','#000'],
    ['#F00','#FFF','#FFF','#F00'],
    // ...
  ]);

  player.addAnimation('walk', [/* frames */], { fps: 10, loop: true });
  player.play('walk');

  game.scene.add(player);
  game.camera.follow(player);

  game.update((dt) => {
    if (EightBit.Input.get().isDown('ArrowLeft')) {
      player.x -= 1;
      player.flipX = true;
    }
  });

  game.start();
</script>
```

### Sprite Only Mode

```js
const game = new EightBit.Game({
  width: 256,
  height: 240,
  scale: 4,
  spriteOnly: true
});

const sprite = new EightBit.Sprite({ x: 32, y: 32, width: 16, height: 16 });
sprite.setPixels(/* ... */);
sprite.addAnimation('idle', [/* frames */], { fps: 8 });
sprite.play('idle');

game.renderer.add(sprite);
game.start();
```

Or the ultra-light path:

```js
const sprite = new EightBit.Sprite({ x: 50, y: 50, width: 16, height: 16 });
EightBit.SpriteOnly.render(sprite, { scale: 4 });
```

## Supported Resolutions

```
128×128  160×144  256×224  256×240  320×200
320×240  384×224  400×240  512×224  512×240
+ any custom size
```

## API Overview

| Class / Module       | Purpose                          |
|----------------------|----------------------------------|
| `EightBit.Game`      | Main entry (Game or SpriteOnly)  |
| `EightBit.Sprite`    | Pixel sprite                     |
| `EightBit.Character` | Sprite + physics + state         |
| `EightBit.Animation` | Frame animation definition       |
| `EightBit.Tilemap`   | Tile layer map                   |
| `EightBit.Scene`     | Entity container                 |
| `EightBit.Camera`    | Viewport / follow / shake        |
| `EightBit.Collision` | AABB helpers                     |
| `EightBit.Palette`   | Color palettes & presets         |
| `EightBit.Particles` | Pixel particle emitter           |
| `EightBit.Text`      | Bitmap / mono text               |
| `EightBit.Input`     | Keyboard + Gamepad               |
| `EightBit.XML`       | Project load / save              |
| `EightBit.Debug`     | FPS / hitbox overlay             |

## XML Project Format

```xml
<project name="MyGame" version="1.0">
  <settings>
    <width>256</width>
    <height>240</height>
    <scale>3</scale>
  </settings>
  <sprite id="player" width="16" height="24" x="32" y="64">
    <animation name="idle" fps="6" loop="true">
      <frame src="idle_0.png"/>
      <frame src="idle_1.png"/>
    </animation>
  </sprite>
</project>
```

Sprite-only projects use `<spriteProject mode="spriteOnly">`.

```js
const project = await EightBit.XML.load('project.xml');
const xmlString = EightBit.XML.save(project);
```

## Directory Structure

```
8bit.js/
├── src/           # ES modules source
├── dist/
│   └── 8bit.js    # Browser IIFE build
├── examples/
│   └── demo.html  # Playable platformer demo
├── ide/           # Web IDE (basic)
├── docs/
└── package.json
```

## Demo

Open `examples/demo.html` in a modern browser (or serve the folder).

Controls: **Arrow / WASD** move · **Space / Z** jump.

## Browser Support

Modern browsers with Canvas 2D and ES2017+ (Chrome, Firefox, Safari, Edge).

## License

MIT

---

**8BIT.js** — Pixel Art · Sprite · Animation · Tilemap · Scene · Camera · Collision · Physics · Input · UI · XML · IDE
