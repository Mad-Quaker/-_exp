const blending = {
  "normal" : "source-over",
  "additive" : "screen",
  "shadow" : "soft-light",
};
export class Renderer {
  constructor (options={}) {
    const width = options.width || window.innerWidth;
    const height = options.height || window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);

    this.blur = options.blur || false;
    this._draw = true;
    this.defaultAlpha = 1.0;
    this.defaultBlending = 'normal';
    this.drawDebug = false;
    this.fullscreen = false;
    this.element = canvas;
    this.depth = options.depth || 9;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = options.smoothing || false;
    this.width = canvas.width;
    this.height = canvas.height;
    return this;
  }
  smoothing(value) {
    this.ctx.imageSmoothingEnabled = value || false;
  }
  blendMode(mode) {
    if (mode in blending && this.defaultBlending !== blending[mode]) this.defaultBlending = blending[mode];
    return this;
  }
  clear () {
    if (this.blur === false) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }
    this.ctx.globalAlpha = this.blur || 0.8;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = '#000';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  setOnOff (state) {
    if (state === this._draw) return;
    this._draw = state;
    const now = new Date;
    console.log(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - ${state?'resumed':'paused'}`);
  }
  renderObjects (objects, {now, delta}, _perObject = (...a)=>this.drawSpriteOrParticle(...a)) {
    if (!this._draw) return;
    const objectsLength = objects.length;
    for (let z = 0; z <= this.depth; z++) {
      for (let i = 0; i < objectsLength; i++) {
        if (!(objects[i] && objects[i].active)) continue; // skip inactive
        if (objects[i] && objects[i].z) {
          if (objects[i].z == z) _perObject(objects[i], i, now, delta);
        } else if (z == 0) _perObject(objects[i], i, now, delta)
      }
    }
  }
  renderInfo (lines, options) {
    const boxHeight = lines.length * 15; // 60
    this.ctx.font = options?.font || '10pt serif';
    let boxWidth = options?.minWidth || 0;
    if (options?.width) {
      boxWidth = options.width;
    } else {
      lines.forEach(text => {
        let width = this.ctx.measureText(text).width;
        boxWidth = (boxWidth < width) ? width : boxWidth;
      });
    }

    this.ctx.globalCompositeOperation = blending['normal'];
    this.ctx.globalAlpha = options?.bg?.alpha || 0.3;
    this.ctx.fillStyle = options?.bg?.color || '#444';
    this.ctx.fillRect(5, 5, boxWidth + 10, boxHeight + 5);
    
    this.ctx.globalAlpha = options?.text?.alpha || 1;
    this.ctx.fillStyle = options?.text?.color || '#DDD';
    
    lines.forEach((line, index) => {
      this.ctx.fillText(line, 10, 20 + 15 * index);
    });
  }
  setAlpha(value) {
    this.alpha = value > 0 ? value : 1;
  }
  drawSpriteOrParticle(o, i, now, delta) {
    const ctx = this.ctx;
    ctx.globalAlpha = o.alpha === undefined ? this.defaultAlpha : o.alpha;
    ctx.globalCompositeOperation = (o.blend && o.blend in blending) ? blending[o.blend] : blending[this.defaultBlending];
    if (o.sprite) {
      if (typeof o.sprite === 'string') {
        ctx.drawImage(...this.atlas.list[o.sprite].draw({x: o.x, y: o.y, now: now - (o.phase || 0), size: o.size || 1}));
      } else {
        ctx.drawImage(...o.sprite.draw({x: o.x, y: o.y, now: now - (o.phase || 0), size: o.size || 1}));
      }
    } else {
      ctx.fillStyle = o.color || '#FFF';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size, 0, 2*Math.PI);
      ctx.fill();
    }
    if (this.drawDebug == 'body' && o.body) {
      ctx.strokeStyle = o.bodyColor || '#2F2';
      ctx.strokeRect(...o.calcBox());
    }
    if (this.drawDebug == 'sprite' && o.sprite) {
      const sizes = o.sprite.drawBox({...o}); // [left,top,width,height]
      ctx.strokeStyle = '#28F';
      ctx.strokeRect(...sizes);
    }
  }
  drawPointer(pos) {
    this.ctx.beginPath();
    this.ctx.globalAlpha = 1;
    // inverted inside
    this.ctx.globalCompositeOperation = 'exclusion';
    this.ctx.fillStyle = 'white';
    this.ctx.arc(pos.x, pos.y, 8, 0, 2*Math.PI);
    this.ctx.fill();
    // stroked out
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = '#f00';
    this.ctx.arc(pos.x, pos.y, 9, 0, 2*Math.PI);
    this.ctx.lineWidth = 0.4;
    this.ctx.stroke();      
  }

}
