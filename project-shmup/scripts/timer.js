export function Timer() {
  return {
    now: 0, // current time
    delta: 0, // delta time per frame (now - prev)
    _scale: 1, // bullet time!
    calc(prev) {
      this._scale = this._nextScale;
      this.real = new Date().getTime();
      this.realDelta = (this.real - prev);
      this.delta = (this.realDelta * this._scale || 0); 
      this.now += this.delta;
      return this;
    },
    scale(scale) {
      this._nextScale = (scale >= 0) ? scale : this._nextScale;
      // this._scale = (scale >= 0) ? scale : this._scale;
      return this;
    },
  };
}