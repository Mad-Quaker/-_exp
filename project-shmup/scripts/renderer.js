import { Atlas } from './atlas.js';

const blending = {
  "normal" : "source-over",
  "additive" : "screen",
  "shadow" : "soft-light",
};
export class Renderer {
  constructor (options={}) {
    this.atlas = new Atlas();
    
    this.canvas = document.createElement('canvas');
    document.body.appendChild(this.canvas);
    window.addEventListener('resize', ()=>this.reset());
    this.ctx = this.canvas.getContext('2d');
    this.reset(options);
    document.addEventListener('fullscreenchange', e => { this.fullscreen = document.fullscreen; });
    
    this._draw = true;
    this.defaultAlpha = 1.0;
    this.defaultBlending = 'normal';
    this.drawDebug = false;
    this.fullscreen = false;
    return this;
  }
  configure(options){
    const defaults = {
      width: window.innerWidth, // target width
      height: window.innerHeight, // target height
      noUpScale: false, // can't resize canvas more than target size, decrease only
      blur: false, // alpha for previous frame ()
      depth: 9, // how many draw layers
      smoothing: false, // smooth or sharp edges (for resized ctx.drawImage ???)
    };
    Object.keys(defaults).forEach(key=>{
      if (options[key] !== undefined) this[key] = options[key];
      if (this[key] === undefined) this[key] = defaults[key];
    });
  }
  reset(options) {
    if (options) this.configure(options);
    const target = { 
      width: this.width || window.innerWidth,
      height: this.height || window.innerHeight,
      ratio: (this.width || window.innerWidth) / (this.height || window.innerHeight),
      scale: 1,
    };
    const available = { width: window.innerWidth, height: window.innerHeight, ratio: window.innerWidth / window.innerHeight };
    this.size = (target.ratio > available.ratio) ? 
    {
      width: available.width,
      height: Math.round(available.width / target.ratio),
      ratio: target.ratio,
      scale: available.width / target.width,
    } : {
      height: available.height,
      width: Math.round(available.height * target.ratio),
      ratio: target.ratio,
      scale: available.height / target.height,
    };
    if (this.noUpScale && this.size.scale > 1) {
      this.canvas.width = target.width;
      this.canvas.height = target.height;
      this.size = target;
    } else {
      this.canvas.width = this.size.width;
      this.canvas.height = this.size.height;
    }
    this.setSmoothing(this.smoothing);
  }
  setSmoothing(value) {
    this.ctx.imageSmoothingEnabled = value || false;
  }
  blendMode(mode) {
    if (mode in blending && this.defaultBlending !== blending[mode]) this.defaultBlending = blending[mode];
    return this;
  }
  loadBundle(url) {
    fetch(url).then(
      bundle => bundle.json().then(bundle=> {
        Object.keys(bundle).forEach(imageURL => {
          this.atlas.load(imageURL, bundle[imageURL]);
        })
      }),
      error => { throw Error(error) },
    )
    return this;
  }
  async isReady() { return await this.atlas.isLoaded() }
  clear () {
    if (!this.blur) {
      this.ctx.clearRect(0, 0, this.size.width, this.size.height);
      return;
    }
    this.ctx.globalAlpha = this.blur || 0.8;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = '#000';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillRect(0, 0, this.size.width, this.size.height);
  }
  setOnOff (state) {
    if (state === this._draw) return;
    this._draw = state;
    const now = new Date;
    console.log(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - ${state?'resumed':'paused'}`);
  }
  renderObjects (objects, {now, delta}) {
    if (!this._draw) return;
    const objectsLength = objects.length;
    for (let z = 0; z <= this.depth; z++) {
      for (let i = 0; i < objectsLength; i++) {
        if (!(objects[i] && objects[i].active)) continue; // skip inactive
        if (objects[i] && objects[i].z) {
          if (objects[i].z == z) this.drawSpriteOrParticle(objects[i], i, now, delta);
        } else if (z == 0) this.drawSpriteOrParticle(objects[i], i, now, delta)
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
    const rescale = (v) => v * this.size.scale;
    ctx.globalAlpha = o.alpha === undefined ? this.defaultAlpha : o.alpha;
    ctx.globalCompositeOperation = (o.blend && o.blend in blending) ? blending[o.blend] : blending[this.defaultBlending];
    if (o.sprite) {
      const sprite = this.atlas.list[o.sprite];
      if (!sprite) { return; }
      const spriteDrawArgs = sprite.draw({x: o.x, y: o.y, now: now - (o.phase || 0), size: o.size || 1}); // generate args for ctx.drawImage() with provided function
      [5,6,7,8].map(arg=>spriteDrawArgs[arg]=rescale(spriteDrawArgs[arg])); // rescale some of args
      ctx.drawImage(...spriteDrawArgs); // ... and drop it here
      if (this.drawDebug == 'sprite') {
        ctx.strokeStyle = '#28F';
        ctx.strokeRect(...sprite.drawBox({...o}).map(rescale)); // [left,top,width,height].rescaled !!
      }
    } else {
      ctx.fillStyle = o.color || '#FFF';
      ctx.beginPath();
      ctx.arc(o.x * this.size.scale, o.y * this.size.scale, o.size, 0, 2*Math.PI);
      ctx.fill();
    }
    if (this.drawDebug == 'body' && o.body) {
      ctx.strokeStyle = o.bodyColor || '#2F2';
      ctx.strokeRect(...o.calcBox().map(rescale));
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
