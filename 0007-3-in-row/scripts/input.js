const INPUT_DOWN = 1,
      INPUT_UP = 2,
      INPUT_MOVE = 4,
      INPUT_WHEEL = 8;
class Input {
  #areasActions = [];
  bound = {left: 0, top: 0,right: 0, bottom: 0};
  logging = 0;
  static types = [
    INPUT_UP,
    INPUT_DOWN,
    INPUT_MOVE,
    INPUT_WHEEL,
  ];
  constructor ($rootElement, log) {
    $rootElement.addEventListener('contextmenu', (e)=>e.preventDefault()); // disable context menu
    $rootElement.addEventListener('mousedown', (e) => this._handleMouse(INPUT_DOWN, e));
    $rootElement.addEventListener('mouseup', (e) => this._handleMouse(INPUT_UP, e));
    $rootElement.addEventListener('mousemove', (e) => this._handleMouse(INPUT_MOVE, e));
    $rootElement.addEventListener('wheel', (e) => this._handleMouse(INPUT_WHEEL, e));
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

  _handleMouse(type, e) {
    e.preventDefault();
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
      wheelDelta: !e.wheelDelta ? 0 : (e.wheelDelta < 0 ? +1 : -1),
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
    if (this.logging && type) console.log(e); // 
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