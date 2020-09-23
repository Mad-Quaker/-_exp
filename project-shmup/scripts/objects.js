import { BaseObject } from "./baseObject.js";

export class Objects {
  items = [];
  constructor (classname, max) {
    this.classname = classname;
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
      let newItem = new BaseObject({...opts});
      newItem.oX = newItem.x || 0;
      newItem.oY = newItem.y || 0;
      if (f) f.call(newItem, cnt, (count === 1 ? 1 : cnt / (count-1)));
      this.#insert(newItem);
      cnt++;
    } while (cnt < count)
    return this;
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
      console.error(`!!! No space for new ${this.classname} !!!`);
    }
  }
  isTouching(objA, objB) {
    return (objA.left < objB.right && objA.right > objB.left &&
      objA.top < objB.bottom && objA.bottom > objB.top);
  }
  process({now,delta}, {perItem} = {perItem: null}) {
    const prts = this.items;
    this.activeCount = 0;
    let subActiveCount = 0;
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
      
      subActiveCount++;
      // check collisions
      for (let j = i+1; j < prts.length; j++) {
        if (!(prts[j] && prts[j].active)) continue;
        if (prts[i].body && prts[j].body && this.isTouching(prts[i].calcBody(), prts[j].calcBody())) {
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
    this.activeCount = subActiveCount;
  }
}