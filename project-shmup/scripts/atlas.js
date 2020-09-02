export function Atlas(url, def) {
  const atlas = {
    err: undefined,
    image: new Image(),
    sprite: [],
    titles: [],
    cnt: def.length,
    byId: function (id) { // find sprite index by id
      let returnIndex = this.titles.findIndex(e=>(e==id)?true:false);
      if (returnIndex === -1) {
        throw new Error(`Can't find sprite with id='${id}' in atlas('${url}')`);
      }
      return this.sprite[returnIndex];
    }
  };
  atlas.sprite[-1] = ({x,y})=>{ return [0,0,0,0, 0,0,0,0]; } // error fallback, prevent wall-of-errors
  return new Promise((resolve, reject) => { 
    atlas.image.onload = ()=>{
      def.forEach(({id, bounds: initBounds, animate}, i)=> {
        const [offsetX,offsetY,width,height] = initBounds;
        atlas.titles[i] = id;
        atlas.sprite[i] = function({x,y,size=1,now}){
          const currentFrameOffset = (now = 0) => {
            if (!animate) return 0;
            const msPerFrame = 1000 / animate.fps; // 1000 / 10 = 100ms
            const totalAnimationTime = msPerFrame * animate.frames; // 100 * 6 = 600ms full animation cycle
            const ret = Math.floor((now % totalAnimationTime) / msPerFrame) * width;
            return ret;
          }
          return [atlas.image, offsetX + currentFrameOffset(now), offsetY, width, height, ...[x-width*size/2, y-height*size/2, width*size, height*size].map(Math.floor)];
        };
      });
      resolve();
    };
    atlas.image.onerror = err=>{
      atlas.err = err;
      reject(err); 
    };

    atlas.image.src = url;
  }).then(()=>atlas);
}
