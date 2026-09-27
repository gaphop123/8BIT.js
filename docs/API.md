# 8BIT.js API Reference

## EightBit.Game

```js
const game = new EightBit.Game({
  width: 256,      // internal resolution
  height: 240,
  scale: 3,        // integer display scale
  spriteOnly: false,
  background: '#000000',
  parent: document.body
});
```

### Methods
- `start()` / `stop()` / `pause()` / `resume()` / `restart()`
- `update(fn)` – register update callback `(dt) => {}`
- `onRender(fn)` – register render callback `(ctx) => {}`
- `enableGameMode()` / `enableSpriteOnly()`
- `isSpriteOnly()` → boolean

### Properties
- `scene` – Scene (null in spriteOnly)
- `camera` – Camera (null in spriteOnly)
- `renderer` – Renderer or SpriteRenderer
- `input` – Input instance
- `debug` – Debug instance
- `fps`, `frame`

## EightBit.Sprite

```js
const s = new EightBit.Sprite({ x, y, width, height });
s.setPixels([['#F00','#0F0'],['#00F','#FFF']]);
s.setImage(img, frameX, frameY, fw, fh);
s.addAnimation('walk', frames, { fps: 8, loop: true });
s.play('walk');
s.flip(true, false);
s.render(ctx);
```

## EightBit.Character

Extends Sprite. Adds `physics`, `direction`, `health`, `jump()`, `takeDamage()`.

## EightBit.Tilemap

```js
const map = new EightBit.Tilemap({ tileWidth:16, tileHeight:16, width:32, height:30 });
map.setTile(x, y, id);
map.setCollision(x, y, true);
map.setTileset(image, columns);
map.render(ctx, camX, camY, viewW, viewH);
```

## EightBit.Camera

```js
camera.follow(target);
camera.setBounds(0, 0, 2048, 2048);
camera.shake(4, 10);
```

## EightBit.Collision

```js
EightBit.Collision.intersects(a, b);
EightBit.Collision.resolveAABB(a, b); // → {x, y}
```

## EightBit.Input

```js
const input = EightBit.Input.get();
input.isDown('ArrowLeft');
input.isPressed('Space');
input.axisX; // -1 | 0 | 1
```

## EightBit.Palette

```js
const p = EightBit.Palette.getPreset('NES-like');
// or new EightBit.Palette(['#000','#FFF']);
```

## EightBit.XML

```js
const project = await EightBit.XML.load('project.xml');
const str = EightBit.XML.save(project);
```

## Sprite Only Mode

```js
const game = new EightBit.Game({ spriteOnly: true });
// or
const renderer = new EightBit.SpriteRenderer({ width:256, height:240, scale:4 });
renderer.add(sprite);
renderer.start();
// or
EightBit.SpriteOnly.render(sprite);
```
