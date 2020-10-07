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
    $rootElement.addEventListener('contextmenu', (e)=>e.preventDefault()); // disable context menu
    $rootElement.addEventListener('mousedown', (e) => this._handleMouse(INPUT_DOWN, e));
    $rootElement.addEventListener('mouseup', (e) => this._handleMouse(INPUT_UP, e));
    $rootElement.addEventListener('mousemove', (e) => this._handleMouse(INPUT_MOVE, e));
    $rootElement.addEventListener('wheel', (e) => this._handleMouse(INPUT_WHEEL, e));
    $rootElement.addEventListener('keydown', (e) => this._handleKeyboard(INPUT_KEYDOWN, e));
    $rootElement.addEventListener('keyup', (e) => this._handleKeyboard(INPUT_KEYUP, e));
    this.isOn = false;
    document.addEventListener('pointerlockchange', (e) => {
      if(document.pointerLockElement === document.body) {
        console.log('ON');
        this.isOn = true;
      } else {
        console.log('OFF');
        this.isOn = false;
        document.exitPointerLock();
      }
    });
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
    }
    if (e.code === 'Escape' || e.code ==='KeyZ') {
      window.document.exitPointerLock();
      if (window.document.fullscreen) document.exitFullscreen();
    }
  }

  _handleMouse(type, e) {
    if (type !== INPUT_WHEEL) e.preventDefault();
    if (!this.isOn && type == INPUT_DOWN) {
      window.document.body.requestPointerLock();
    }
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