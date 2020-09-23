import { Timer } from './timer.js';
import { Atlas } from './atlas.js';
import { Renderer } from './renderer.js';
// import { objectsMap } from './objects/map.js'

const FPS_SMOOTHING = 0.25;
const DEBUG_DATA = 1;

// main engine class
export class Engine  {
  constructor(options = {}, initFunction) {
    this._debug = {
      flags: 0,
      list: [],
    };
    this._sys = {
      fps: 0,
    };
    this.time = new Timer();
    this.renderer = new Renderer({smoothing: false, depth: 3, blur: false, ...(options?.renderer || {})});
    this.renderer.atlas = this.atlas = new Atlas();
    this.objectMapping = objectsMap || { player: function player() {} };
    // 
    this.init = initFunction;
    // init.call(this);
    return this;
  }
  
  tick(f) {
    this.gameTick = f;
  }
  
  loop(prev) {
    this._debug.list = [];
    const {real, realDelta, now, delta} = this.time.calc(prev);
    this._sys.fps = Math.round(1000/delta);
    requestAnimationFrame(()=>this.loop(this.time.now));
    this.renderer.clear();
    this.gameTick({now, delta});
    // this.renderer();
    if (this._debug.list.length > 0) this.renderer.renderInfo(this._debug.list, {minWidth: 160});
  }

  run() {
    this.init();
    Promise.all([this.atlas.isLoaded()]).then(()=>{
      if (this._debug.flags & DEBUG_DATA) console.log(this.atlas);
      this.loop(this.time.sysNow());
      console.log('Running...');
    });
  }

}