export class BaseObject {
  active = true;
  x=0;y=0;z=0; // coordinates + z-index/depth
  vX=0;vY=0;
  size=1.0;
  alpha=1.0;
  parent;
  
  onCreate() {}
  onTouch() {}
  onDie() {}
  
  constructor(options = {}) {
    for (let v in options) this[v] = options[v];
    this.oX = this.x;
    this.oY = this.y;
  }

  calcBody() { // for collision check
    return this.body = {
      ...this.body,
      left: this.x - this.body.width / 2,
      right: this.x + this.body.width / 2,
      top: this.y - this.body.height / 2,
      bottom: this.y + this.body.height / 2,
    };
  }
  calcBox() { // for ctx.fillRect() or ctx.strokeRect()
    return [
      this.x - this.body.width / 2, // left
      this.y - this.body.height / 2, // right
      this.body.width, // width
      this.body.height, // height
    ]
  }
}