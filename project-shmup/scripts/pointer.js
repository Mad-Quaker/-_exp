export function Pointer(options) {
  const { pos, bounds} = options;
  return {
    isOn: false,
    pos,
    oldPos: {x:pos.x,y:pos.y},
    bounds,
    handleDown: (e) => {},
    handleUp: (e) => {},
    handleMove: ({x,y}) => {},
    set (newPos) {
      this.pos.x = newPos[0];
      this.pos.y = newPos[1];
    },
    get () {
      const v = {
        x: this.pos.x,
        y: this.pos.y,
        vX: this.pos.x - this.oldPos.x,
        vY: this.pos.y - this.oldPos.y,
      };
      this.oldPos.x = this.pos.x;
      this.oldPos.y = this.pos.y;
      return v;
    },
    onMove (e) {
      this.pos.x = this.pos.x + e.movementX;
      this.pos.y = this.pos.y + e.movementY;
      this.handleMove(this.pos);
      return;
      if (this.bounds) {
        if (this.pos.x < this.bounds.left)   { this.pos.x = this.bounds.left   }
        if (this.pos.x > this.bounds.right)  { this.pos.x = this.bounds.right  }
        if (this.pos.y < this.bounds.top)    { this.pos.y = this.bounds.top    }
        if (this.pos.y > this.bounds.bottom) { this.pos.y = this.bounds.bottom }
      }
    },
  };
}
