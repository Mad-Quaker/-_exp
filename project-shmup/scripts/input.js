const INPUT_KEYDOWN = 1,
      INPUT_KEYUP = 2,
      INPUT_MOUSEDOWN = 3,
      INPUT_MOUSEUP = 4,
      INPUT_MOVE = 5,
      INPUT_WHEEL = 6;

export class Input {
  mouseButtonsNames = ['mouse1','mouse3','mouse2','mouse4','mouse5']; // e.button base [0,2,1,3,4] unlike e.buttons bits [1|2|4|8|16]
  mouse;
  keyboard;
  bindings = {};
  constructor ({ pos, bounds, mode }) {
    if (!!window.Pointer) return window.Pointer;
    window.Pointer = this;
    this.mouse = {
      buttons, // pressed at moment
      pos,
      mode,
      isButtonPressed(button) { return this?.buttons & Math.pow(2,button) ? true : false; },
      bounds: bounds || null,
    };
    this.mouse.pos.vX = this.mouse.pos.vY = 0;
    this.isOn = false;
    this.mouse.oldPos = { ...this.mouse.pos };
    window.addEventListener('contextmenu', (e)=>e.preventDefault());
    window.addEventListener('keydown', (e) => this._handleEvent(INPUT_KEYDOWN, e));
    window.addEventListener('keyup', (e) => this._handleEvent(INPUT_KEYUP, e));
    window.addEventListener('mousedown', (e) => this._handleEvent(INPUT_MOUSEDOWN, e));
    window.addEventListener('mouseup', (e) => this._handleEvent(INPUT_MOUSEUP, e));
    window.addEventListener('mousemove', (e) => this._handleMouseMove(INPUT_MOVE, e));
    window.addEventListener('wheel', (e) => this._handleEvent(INPUT_WHEEL, e));
    document.addEventListener('pointerlockchange', (e) => this.isOn = document.pointerLockElement === renderer.canvas);
    return this;
  }

  // on focus
  setPos (newPos) { this.mouse.pos = { x: newPos[0], y: newPos[1], vX: 0, vY: 0 } }

  getMouseState () {
    const v = {
      x: this.mouse?.bounds === 'fixed'
        ? e.offsetX - this.mouse.bounds.left
        : this.mouse.pos.x,
      y: this.mouse?.bounds === 'fixed'
        ? e.offsetY - this.mouse.bounds.left
        : this.mouse.pos.y,
      vX: this.mouse.pos.x - this.mouse.oldPos.x,
      vY: this.mouse.pos.y - this.mouse.oldPos.y,
      buttons: this.mouse.buttons,
    };
    this.mouse.oldPos = { ...this.mouse.pos };
    return v;
  }

  bind (command, f) {
    this.bindings[command] = f;
  }

  _handleMouseMove (e) {
    if (!this.isOn) return;
    this.mouse.pos.x = this.mouse.pos.x + e.movementX;
    this.mouse.pos.y = this.mouse.pos.y + e.movementY;
    if (this.mouse.bounds && this.mouse.bounds.mode === 'fixed' ) {
      if (this.pos.x < this.mouse.bounds.left) this.pos.x = this.mouse.bounds.left;
      if (this.pos.x > this.mouse.bounds.right) this.pos.x = this.mouse.bounds.right;
      if (this.pos.y < this.mouse.bounds.top) this.pos.y = this.mouse.bounds.top;
      if (this.pos.y > this.mouse.bounds.bottom) this.pos.y = this.mouse.bounds.bottom;
    }
  }

  _handleEvent(eventType, e) {
    if (!this.isOn) return;
    
    if (eventType !== INPUT_WHEEL && e?.code !== 'F5' && e?.code !== 'Escape') e.preventDefault();
    if (eventType === INPUT_MOUSEDOWN && e.button === 0) {
      window.document.body.requestPointerLock();
      this.isOn = true;
    }
    if (eventType === INPUT_KEYDOWN && e.code === 'Escape') {
      document.exitPointerLock();
      this.isOn = false;
    }

    let command = 'none';
    let press = null;
    if ([INPUT_MOUSEDOWN, INPUT_MOUSEUP].includes(eventType)) {
      command = mouseButtonsNames[e.button];
      this.mouse.buttons = e.buttons;
    }
    if (INPUT_WHEEL === eventType) {
      command = (e.wheelDelta < 0) ? 'mwheeldown' : 'mwheelup';
    }
    if ([INPUT_KEYDOWN, INPUT_KEYUP].includes(eventType))
    {
      command = e.code; // 'keyF'
      this.keyboard.mods = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        win: e.metaKey,
      };
    }
    if (eventType === INPUT_KEYDOWN || eventType === INPUT_MOUSEDOWN) press = true;
    if (eventType === INPUT_KEYUP || eventType === INPUT_MOUSEUP) press = false;
    // checking bindings
    Object.keys(this.bindings).forEach(key=>{
      if (key === command) { this.bindings[key]({press, mouseButtons: this.mouse.buttons, mods: this.keyboard.mods}) }
    });
  }

}
