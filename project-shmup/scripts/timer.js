export class Timer {
  constructor() {
    this.now = 0; // current time
    this.delta = 0; // delta time per frame (now - prev)
    this._scale = 1; // bullet time!
    this._paused = false;
    this.sysNow = ()=>new Date().getTime();
  }
  calc(prev = this.sysNow()) {
    this.real = this.sysNow();
    this.realDelta = (this.real - prev);
    this.delta = (this.realDelta * this._scale || 0); 
    this.now += this.delta;
    return this;
  }
  pause() {
    this._paused = true;
    return this;
  };
  resume() {
    this._paused = false;
    return this;
  };
  scale(scale) {
    this._scale = (scale >= 0) ? scale : this._scale;
    return this;
  }
}