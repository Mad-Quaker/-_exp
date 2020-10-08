const INPUT_KEYDOWN = 1,
      INPUT_KEYUP = -1,
      INPUT_MOUSEDOWN = 2,
      INPUT_MOUSEUP = -2,
      // INPUT_MOVE = 3,
      INPUT_WHEEL = 4;
const mouseButtonsNames = ['mouse1','mouse3','mouse2','mouse4','mouse5']; // e.button based [0,2,1,3,4] unlike e.buttons bits [1|2|4|8|16]

export class Input {
  debug = false;
  mouse;
  keyboard = {
    buttons: [], // list of held buttons, helps prevent repeat keystrokes and allow key-combos in future
    mods: {},
    isHeld: function (checks) {
      if (typeof checks === 'string') {
        return this.buttons.indexOf(checks) !== -1; // check only for one held button
      } else if (Array.isArray(checks)) {
        checks.forEach(key => {
          if (this.buttons.indexOf(key) === -1) return false; // at least one button unpressed
        });
        return true;
      }
    }
  };
  bindings = {}; /* {command: function, ... }
  * Every binded command calls twice for most cases.
  * First - on keydown/mousedown with {press:true} option.
  * Second - on keyup/mouseup with {press:false} */
  constructor ({ pos, bounds, contextDisabled, lockable, onLockChange = ()=>{} }) {
    if (!!window.Pointer) return window.Pointer;
    window.Pointer = this;
    this.mouse = {
      buttons: 0, // held
      pos: {
        x: pos?.x || 0,
        y: pos?.y || 0,
        vX: 0,
        vY: 0,
      },
      isButtonHeld(button) { return this?.buttons & Math.pow(2,button) ? true : false; },
      bounds: bounds || null,
    };
    this.mouse.getState = ()=>this.getMouseState();
    this.isFocused = false;
    this.mouse.oldPos = { ...this.mouse.pos };
    this.contextDisabled = contextDisabled || false;
    /* pointerlock handler */
    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || this.isFocused) return;
      this.setMousePosition(e.offsetX, e.offsetY); // reseting
      if (lockable) {
        document.body.requestPointerLock();
      } else {
        this.isFocused = true;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (this.isFocused && (e.code === 'Escape' || (e.code === 'KeyZ' && e.altKey))) {
        if (lockable) { 
          document.exitPointerLock();
        } else {
          this.isFocused = false;
        }
      }
    });
    document.addEventListener('pointerlockchange', (e) => onLockChange(this.isFocused = document.pointerLockElement === document.body));
    document.addEventListener('pointerlockerror', () => console.log('Unable to lock'));
    /* general handlers */
    document.addEventListener('contextmenu', (e)=>{ if (this.isFocused && this.contextDisabled) e.preventDefault()});
    document.addEventListener('keydown', (e) => this._handleEvent(INPUT_KEYDOWN, e));
    document.addEventListener('keyup', (e) => this._handleEvent(INPUT_KEYUP, e));
    document.addEventListener('mousedown', (e) => this._handleEvent(INPUT_MOUSEDOWN, e));
    document.addEventListener('mouseup', (e) => this._handleEvent(INPUT_MOUSEUP, e));
    document.addEventListener('mousemove', (e) => this._handleMouseMove(e));
    document.addEventListener('wheel', (e) => this._handleEvent(INPUT_WHEEL, e));
    this.bind('Backquote', (e) => { if (e.down && e.isHeld('AltLeft')) this.debug = !this.debug; console.log(this.debug); });
    return this;
  }

  // on focus
  setMousePosition (...newPos) {
    this.mouse.pos.x = newPos[0];
    this.mouse.pos.y = newPos[1];
    this.mouse.oldPos = { ...this.mouse.pos };
    return this;
  }

  getMouseState () { // tick read?
    const out = {};
    out.x = this.mouse.bounds
        ? e.offsetX - this.mouse.bounds.left
        : this.mouse.pos.x;
    out.y = this.mouse.bounds
        ? e.offsetY - this.mouse.bounds.left
        : this.mouse.pos.y,
    out.vX = this.mouse.pos.x - this.mouse.oldPos.x;
    out.vY = this.mouse.pos.y - this.mouse.oldPos.y;
    out.buttons = this.mouse.buttons;
    this.mouse.oldPos = { ...this.mouse.pos };
    return out;
  }

  bind (command, f) {
    this.bindings[command] = f;
    return this;
  }

  _checkCommand(input) {
    // const combo = Object.keys(this.heldButtons;
  }

  _handleMouseMove (e) {
    if (!this.isFocused) return;
    this.mouse.pos.x = this.mouse.pos.x + e.movementX;
    this.mouse.pos.y = this.mouse.pos.y + e.movementY;
    if (this.mouse.bounds ) {
      if (this.pos.x < this.mouse.bounds.left) this.pos.x = this.mouse.bounds.left;
      if (this.pos.x > this.mouse.bounds.right) this.pos.x = this.mouse.bounds.right;
      if (this.pos.y < this.mouse.bounds.top) this.pos.y = this.mouse.bounds.top;
      if (this.pos.y > this.mouse.bounds.bottom) this.pos.y = this.mouse.bounds.bottom;
    }
  }

  _handleEvent(eventType, e) {
    if (!this.isFocused) return;
    if (eventType !== INPUT_WHEEL && e?.code !== 'F5') e.preventDefault();
    let inputCommand = 'none';
    let options = {
      buttons: [...this.keyboard.buttons],
      down: (eventType === INPUT_KEYDOWN || eventType === INPUT_MOUSEDOWN),
      up: (eventType === INPUT_KEYUP || eventType === INPUT_MOUSEUP),
      mods: this.keyboard.mods,
      isHeld: this.keyboard.isHeld,
    };
    if (eventType === INPUT_MOUSEDOWN || eventType === INPUT_MOUSEUP) {
      inputCommand = mouseButtonsNames[e.button];
      this.mouse.buttons = e.buttons;
    }
    if (INPUT_WHEEL === eventType) {
      inputCommand = (e.wheelDelta < 0) ? 'mwheeldown' : 'mwheelup';
    }
    if (eventType === INPUT_KEYDOWN || eventType === INPUT_KEYUP) {
      inputCommand = e.code; // 'keyF'
      this.keyboard.mods = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        win: e.metaKey,
      };
    }
    if (eventType === INPUT_KEYDOWN || eventType === INPUT_MOUSEDOWN) {
      if (this.keyboard.isHeld(inputCommand)) return;
      this.keyboard.buttons.push(inputCommand);
    }
    if (eventType === INPUT_KEYUP || eventType === INPUT_MOUSEUP) {
      const index = this.keyboard.buttons.indexOf(inputCommand);
      if (index !== -1) this.keyboard.buttons.splice(index,1);
    }
    // checking bindings
    Object.keys(this.bindings).forEach(key=>{
      if (key === inputCommand) {
        // fire binded action!
        this.bindings[key](options);
      }
    });
    if (this.debug) console.log(eventType, inputCommand, options);
  }
}
