export class Atlas {
  constructor() {
    this.errors = [];
    this.list = {};
    this._promises = [];
  }
  
  load(url, defs) {
    const image = new Image();
    this._promises.push(new Promise((resolve,reject) => {
      image.onload = ()=>{
        defs.forEach(({id, bounds, animate},i)=> {
          if (!id) { throw Error(`'${url}'[${i}]: no 'id' provided`) };
          const [offsetX,offsetY,width,height,centerOX,centerOY] = bounds;
          this.list[id] = {
            drawBox: function({x,y,size=1}) { // ctx.strokeRect(...sprite.drawBox());
              return [
                x - width * size / 2, // left
                y - height * size / 2, // right
                width * size, // width
                height * size, // height              
              ];
            },
            draw: function({x,y,size=1,now}){
              const currentFrameOffset = (now = 0) => {
                if (!animate) return 0;
                const msPerFrame = 1000 / animate.fps; // 1000 / 10 = 100ms
                const totalAnimationTime = msPerFrame * animate.frames; // 100 * 6 = 600ms full animation cycle
                const ret = Math.floor((now % totalAnimationTime) / msPerFrame) * width;
                return ret;
              }
              return [image, 
                offsetX + currentFrameOffset(now), offsetY, width, height,
                ...[
                  x-width*size/2-(centerOX||0),
                  y-height*size/2-(centerOY||0),
                  width*size,
                  height*size,
                ].map(Math.floor)];
            },
          };
        });
        resolve(true);
      };
      image.onerror = err=>{
        const error = `'${url}': ${err}`;
        this.errors.push(error);
        resolve(false);
      }
    }));
    image.src = url;
    return this;
  }
  async isLoaded() { return await Promise.all(this._promises) }
}
