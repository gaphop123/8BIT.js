/**
 * Unified Input: Keyboard, Mouse, Touch, Gamepad
 */
export class Input {
  constructor() {
    this.keys = new Map();
    this.keysPressed = new Set();
    this.keysReleased = new Set();
    this.mouse = { x: 0, y: 0, down: false, pressed: false, released: false, button: 0 };
    this.touches = [];
    this.gamepads = [];
    this._attached = false;
    this._keyMap = {
      'ArrowLeft': 'left', 'ArrowRight': 'right', 'ArrowUp': 'up', 'ArrowDown': 'down',
      ' ': 'space', 'Space': 'space',
      'z': 'a', 'x': 'b', 'c': 'x', 'v': 'y',
      'Enter': 'start', 'Shift': 'select',
      'a': 'left', 'd': 'right', 'w': 'up', 's': 'down'
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
  }

  attach(target = window) {
    if (this._attached) return;
    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
    target.addEventListener('mousedown', this._onMouseDown);
    target.addEventListener('mouseup', this._onMouseUp);
    target.addEventListener('mousemove', this._onMouseMove);
    target.addEventListener('touchstart', this._onTouchStart, { passive: true });
    target.addEventListener('touchend', this._onTouchEnd);
    target.addEventListener('touchmove', this._onTouchMove, { passive: true });
    this._attached = true;
  }

  detach(target = window) {
    if (!this._attached) return;
    target.removeEventListener('keydown', this._onKeyDown);
    target.removeEventListener('keyup', this._onKeyUp);
    target.removeEventListener('mousedown', this._onMouseDown);
    target.removeEventListener('mouseup', this._onMouseUp);
    target.removeEventListener('mousemove', this._onMouseMove);
    target.removeEventListener('touchstart', this._onTouchStart);
    target.removeEventListener('touchend', this._onTouchEnd);
    target.removeEventListener('touchmove', this._onTouchMove);
    this._attached = false;
  }

  update() {
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.mouse.pressed = false;
    this.mouse.released = false;
    this._pollGamepads();
  }

  _onKeyDown(e) {
    const key = e.key;
    if (!this.keys.get(key)) {
      this.keysPressed.add(key);
      const mapped = this._keyMap[key];
      if (mapped) this.keysPressed.add(mapped);
    }
    this.keys.set(key, true);
  }

  _onKeyUp(e) {
    const key = e.key;
    this.keys.set(key, false);
    this.keysReleased.add(key);
    const mapped = this._keyMap[key];
    if (mapped) this.keysReleased.add(mapped);
  }

  _onMouseDown(e) {
    this.mouse.down = true;
    this.mouse.pressed = true;
    this.mouse.button = e.button;
  }

  _onMouseUp(e) {
    this.mouse.down = false;
    this.mouse.released = true;
  }

  _onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  _onTouchStart(e) {
    this.touches = Array.from(e.touches).map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
    this.mouse.down = true;
    this.mouse.pressed = true;
  }

  _onTouchEnd(e) {
    this.touches = Array.from(e.touches).map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
    if (this.touches.length === 0) {
      this.mouse.down = false;
      this.mouse.released = true;
    }
  }

  _onTouchMove(e) {
    this.touches = Array.from(e.touches).map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
  }

  _pollGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    this.gamepads = [];
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) this.gamepads.push(pads[i]);
    }
  }

  isDown(key) {
    if (this.keys.get(key)) return true;
    // Gamepad buttons
    for (const pad of this.gamepads) {
      if (this._gamepadButton(pad, key)) return true;
      if (this._gamepadAxis(pad, key)) return true;
    }
    return false;
  }

  isPressed(key) {
    return this.keysPressed.has(key);
  }

  isReleased(key) {
    return this.keysReleased.has(key);
  }

  _gamepadButton(pad, name) {
    const map = {
      'a': 0, 'b': 1, 'x': 2, 'y': 3,
      'start': 9, 'select': 8,
      'lb': 4, 'rb': 5
    };
    const idx = map[name.toLowerCase()];
    if (idx != null && pad.buttons[idx]) return pad.buttons[idx].pressed;
    return false;
  }

  _gamepadAxis(pad, name) {
    const dead = 0.3;
    if (name === 'left' || name === 'ArrowLeft') return pad.axes[0] < -dead;
    if (name === 'right' || name === 'ArrowRight') return pad.axes[0] > dead;
    if (name === 'up' || name === 'ArrowUp') return pad.axes[1] < -dead;
    if (name === 'down' || name === 'ArrowDown') return pad.axes[1] > dead;
    return false;
  }

  get axisX() {
    let v = 0;
    if (this.isDown('left') || this.isDown('ArrowLeft') || this.isDown('a')) v -= 1;
    if (this.isDown('right') || this.isDown('ArrowRight') || this.isDown('d')) v += 1;
    return v;
  }

  get axisY() {
    let v = 0;
    if (this.isDown('up') || this.isDown('ArrowUp') || this.isDown('w')) v -= 1;
    if (this.isDown('down') || this.isDown('ArrowDown') || this.isDown('s')) v += 1;
    return v;
  }
}

// Singleton-style static access
Input._instance = null;
Input.get = function () {
  if (!Input._instance) Input._instance = new Input();
  return Input._instance;
};

export default Input;
