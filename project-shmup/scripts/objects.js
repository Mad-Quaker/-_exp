export class Objects {
  items = [];
  constructor (classname, max) {
    this.classname = classname; // rewrite in 
    this.activeCount = 0;
    this.cntMax = max;
    this.cntPointer = 0;
    this.startedIndex = 0;
    this.items = Array(max).fill();
  }
  add (opts, f) {
    let actor;
    this.addX(1, opts, function() {
      if (f) f.call(this);
      actor = this;
    });
    return actor;
  }
  addX (count, opts, f) {
    // f should not be an arrow function, it wouldn't work this way
    let cnt = 0;
    do {
      let newItem = {
        active: true,
        x: 0, y: 0,
        z: 5, // for rendering
        alpha: 1, // opacity
        vX: 0, vY: 0, // "V"elocity per axis
        size: 1,
        ...opts,
      };
      /* item = {
       * active: boolean, // is it 
       * x: float, y: float, // position (but should be relative on screen in future, just better fits for varying resolutions)
       * vX: float, vY: float, 
       * now: , // when created
       * // advanced properties
       * parent: item, // for collision (your bullets can't hit you)
       * 
       * 
       * 
       * 
       * }
       */
      newItem.oX = newItem.x || 0;
      newItem.oY = newItem.y || 0;
      if (f) f.call(newItem, cnt, (count === 1 ? 1 : cnt / (count-1)));
      if (newItem.body) { this.makeSolid(newItem); }
      this.#insert(newItem);
      cnt++;
    } while (cnt < count)
    return this;
  }
  makeSolid(item) {
    item.body.calc = () => ({
      left: item.x - item.body.width / 2,
      right: item.x + item.body.width / 2,
      top: item.y - item.body.height / 2,
      bottom: item.y + item.body.height / 2,
    });
    item.body.calcBox = () => ([
      item.x - item.body.width / 2, // left
      item.y - item.body.height / 2, // right
      item.body.width, // width
      item.body.height, // height
    ]);
  }
  #insert(item) {
    this.startedIndex = this.cntPointer;
    let found = false;
    if (this.activeCount < this.cntMax - 1) {
      do {
        this.cntPointer++;
        if (this.cntPointer > this.cntMax - 1) this.cntPointer = 0;
        found = this.items[this.cntPointer] === undefined || this.items[this.cntPointer].active === false;
      } while (!found && this.startedIndex !== this.cntPointer)
    }
    if (found) {
      this.items[this.cntPointer] = item;
      return;
    } else {
      console.error(`!!! No space for new Object in ${this.classname} !!!`);
    }
  }
  isTouching(objA, objB) {
    return (objA.left < objB.right && objA.right > objB.left &&
      objA.top < objB.bottom && objA.bottom > objB.top);
  }
  process({now,delta}, {perItem} = {perItem: null}) {
    const prts = this.items;
    this.activeCount = 0;
    const normalizeDelta = 25; // 40 fps
    delta = Math.min(200, delta); //
    let subNow = now - delta;
    const preStep = (i, {now, delta}) => {
      if (!(prts[i] && prts[i].active)) return;
      
      prts[i].ox = prts[i].x;
      prts[i].oy = prts[i].y;
      prts[i].x = prts[i].x + (prts[i].vX*delta/1000 || 0); // NaN protection
      prts[i].y = prts[i].y + (prts[i].vY*delta/1000 || 0); // NaN protection
    }
    const subStep = (i, {now, delta}) => {
      if (!(prts[i] && prts[i].active)) return;
      
      // check collisions
      for (let j = i+1; j < prts.length; j++) {
        if (!(prts[j] && prts[j].active)) continue;
        this.activeCount++;
        if (prts[i].body && prts[j].body && this.isTouching(prts[i].body.calc(), prts[j].body.calc())) {
          if (prts[i].touch) prts[i].touch(prts[j], now);
          if (prts[j].touch) prts[j].touch(prts[i], now);
        }
      }
      
      if (prts[i].step) prts[i].step.call(prts[i], {now,delta});
      if (perItem) perItem.call(prts[i], {now,delta});
    }
    const postStep = (i, {now, delta}) => {
      if (!(prts[i] && prts[i].active)) return;
      if (prts[i].ttl && prts[i].ttl < now) { prts[i].active = false; return; } // disable when time's up
    } 
    let _subframes = 0;
    do {
      let subDelta = normalizeDelta < (now - subNow) ? normalizeDelta : now - subNow;
      for (let i = 0; i < prts.length; i++) preStep(i, {now: subNow, delta: subDelta});
      for (let i = 0; i < prts.length; i++) subStep(i, {now: subNow, delta: subDelta});
      for (let i = 0; i < prts.length; i++) postStep(i, {now: subNow, delta: subDelta});
      subNow += subDelta;
      _subframes++;
    } while (subNow < now && _subframes < 10);
  }
}