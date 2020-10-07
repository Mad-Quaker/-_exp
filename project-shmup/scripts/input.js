const INPUT_KEYDOWN = 1,
      INPUT_KEYUP = 2,
      INPUT_MOUSEDOWN = 3,
      INPUT_MOUSEUP = 4,
      INPUT_MOVE = 5,
      INPUT_WHEEL = 6;

export class Input {
  mouseButtonsNames = ['mouse1','mouse3','mouse2','mouse4','mouse5']; // e.button based [0,2,1,3,4] unlike e.buttons bits [1|2|4|8|16]
  mouse;
  keyboard;
  bindings = {}; /* {command: function, ... }
  * Every binded command calls twice for most cases.
  * First - on keydown/mousedown with {press:true} option.
  * Second - on keyup/mouseup with {press:false} */
  constructor ({ pos, bounds, mode, contextDisabled, lockable }) {
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
    this.contextDisabled = contextDisabled || false;
    document.addEventListener('contextmenu', (e)=>{ if (this.contextDisabled) e.preventDefault()});
    document.addEventListener('keydown', (e) => this._handleEvent(INPUT_KEYDOWN, e));
    document.addEventListener('keyup', (e) => this._handleEvent(INPUT_KEYUP, e));
    document.addEventListener('mousedown', (e) => this._handleEvent(INPUT_MOUSEDOWN, e));
    document.addEventListener('mouseup', (e) => this._handleEvent(INPUT_MOUSEUP, e));
    document.addEventListener('mousemove', (e) => this._handleMouseMove(INPUT_MOVE, e));
    document.addEventListener('wheel', (e) => this._handleEvent(INPUT_WHEEL, e));
    // adding pointerlock as separate triggers
    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || this.isOn) return;
      this.setMousePosition(e.offsetX, e.offsetY, e.movementX, e.movementY); // reseting
      if (lockable) {
        document.body.requestPointerLock();
      } else {
        this.isOn = true;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (this.isOn && (e.code === 'Escape' || e.code === 'AltLeft')) {
        if (lockable) { 
          document.exitPointerLock();
        } else {
          this.isOn = false;
        }
      }
    });
    document.addEventListener('pointerlockchange', (e) => this.isOn = document.pointerLockElement === document.body);
    document.addEventListener('pointerlockerror', () => console.log('Unable to lock'));
    return this;
  }

  // on focus
  setMousePosition (newPos) {
    this.mouse.pos = { x: newPos[0], y: newPos[1], vX: newPos[2], vY: newPos[3] };
    this.mouse.oldPos = { ...this.mouse.pos };
    return this;
  }

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
    return this;
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
    let command = 'none';
    let press = null;
    if ([INPUT_MOUSEDOWN, INPUT_MOUSEUP].includes(eventType)) {
      command = mouseButtonsNames[e.button];
      this.mouse.buttons = e.buttons;
    }
    if (INPUT_WHEEL === eventType) {
      command = (e.wheelDelta < 0) ? 'mwheeldown' : 'mwheelup';
    }
    if ([INPUT_KEYDOWN, INPUT_KEYUP].includes(eventType)) {
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
      if (key === command) { 
        this.bindings[key]({
          press,
          mouseButtons: this.mouse.buttons,
          keyboardMods: this.keyboard.mods
        });
      }
    });
  }

}
