const INPUT_DOWN = 1,
      INPUT_UP = 2,
      INPUT_MOVE = 4,
      INPUT_WHEEL = 8,
      INPUT_KEYDOWN = 16,
      INPUT_KEYUP = 32;
class Input {
  #areasActions = [];
  bound = {left: 0, top: 0,right: 0, bottom: 0};
  logging = 1;

  constructor ($rootElement, log) {
    
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this.isOn) document.body.requestPointerLock();
    });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isOn) document.exitPointerLock();
    });
    document.addEventListener('pointerlockerror', (e) => {
      console.log('No!');
    });
    document.addEventListener('pointerlockchange', (e) => {
      this.isOn = document.pointerLockElement === document.body;
      // console.log(this.isOn, document.pointerLockElement);
    });
    this.isOn = false;
    document.addEventListener('mousedown', (e) => this._handleMouse(INPUT_DOWN, e));
    document.addEventListener('mouseup', (e) => this._handleMouse(INPUT_UP, e));
    document.addEventListener('mousemove', (e) => this._handleMouse(INPUT_MOVE, e));
    document.addEventListener('wheel', (e) => this._handleMouse(INPUT_WHEEL, e));
    document.addEventListener('keydown', (e) => this._handleKeyboard(INPUT_KEYDOWN, e));
    document.addEventListener('keyup', (e) => this._handleKeyboard(INPUT_KEYUP, e));
  }

  _log(log) { this.logging = log; }

  setBounds(playAreaOffset) {
    this.bound = {
      ...playAreaOffset,
      right: playAreaOffset.left + playAreaOffset.width,
      bottom: playAreaOffset.top + playAreaOffset.height,
    };
  }
  
  _checkBound(point, box) {
    return point.x >= box.left && point.x <= box.right
      && point.y >= box.top && point.y <= box.bottom;
  }

  _handleKeyboard(type, e) {
    if (type !== INPUT_WHEEL && e?.code !== 'F5' && e?.code !== 'Escape') e.preventDefault();
    const keyboard = {
      code: e.code,
      mods: {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        win: e.metaKey,
      },
    }
    if (e.code === 'Escape' || e.code ==='AltLeft') {
      window.document.exitPointerLock();
      // if (window.document.fullscreen) window.document.exitFullscreen();
    }
    if (this.logging) console.log(keyboard); // 
  }

  _handleMouse(type, e) {
    if (type !== INPUT_WHEEL) e.preventDefault();
    if (!this.isOn) return;
    const mouse = {
      button: e.button,
      buttons: [
        e.buttons & 1,
        e.buttons & 2,
        e.buttons & 4,
        e.buttons & 8,
        e.buttons & 16,
      ],
      type,
      wheelDelta: !e.wheelDelta ? 0 : (e.wheelDelta < 0 ? 'mwheeldown' : 'mwheelup'),
      x: e.offsetX - this.bound.left,
      y: e.offsetY - this.bound.top,
      onScreen: this._checkBound({x: e.offsetX, y: e.offsetY}, this.bound),
    };
    this.#areasActions.forEach(trigger => {
      if (!trigger.active) return;

      const mouseEnriched = {
        ...mouse,
        isHover: this._checkBound(mouse, trigger),
      }
      trigger.action(mouseEnriched);
    });
    if (this.logging && type !== INPUT_MOVE) console.log(mouse); // 
    return mouse;
  }

  addMouseArea(bound, action, active = true) {
    let trigger = {
      ...bound,
      right: bound.left + bound.width,
      bottom: bound.top + bound.height,
      active,
      action,
    };
    this.#areasActions.push(trigger);
    return trigger;
  }

  addBind() {
    
  }
}

export default Input;