export class Primitive {
  active = true;
  x=0;y=0;z=0; // coordinates + z-index/depth
  vX=0;vY=0;
  size=1.0;
  alpha=1.0;

  pos() { return [this.x,this.y] }

}

export class BaseObject extends Primitive {
  parent;
  
  onCreate() {}
  onTouch() {}
  onDie() {}
  
  constructor(options = {}) {
    super();
    for (let v in options) this[v] = options[v];
    this.oX = this.x;
    this.oY = this.y;
  }

  pos(added) {
    const [addX, addY] = added || [0,0];
    if (this.parent) {
      return this.parent.pos([this.x + addX,this.y + addY]);
    } else {
      return [this.x + addX, this.y + addY];
    }
  }

  calcBody() { // for collision check
    const [x,y] = this.pos();
    return this.body = {
      ...this.body,
      left: x - this.body.width / 2,
      right: x + this.body.width / 2,
      top: y - this.body.height / 2,
      bottom: y + this.body.height / 2,
    };
  }
  calcBox() { // for ctx.fillRect() or ctx.strokeRect()
    const [x,y] = this.pos();
    return [
      x - this.body.width / 2, // left
      y - this.body.height / 2, // right
      this.body.width, // width
      this.body.height, // height
    ]
  }
}