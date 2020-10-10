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
    delta = Math.min(200, delta);
    for (let i = 0; i < prts.length; i++) {
      if (!(prts[i] && prts[i].active)) continue;
      if (prts[i].ttl < now) { prts[i].active = false; continue; } // disable when time's up
      this.activeCount++;
      prts[i].ox = prts[i].x;
      prts[i].oy = prts[i].y;
      prts[i].x = prts[i].x + (prts[i].vX*delta/1000 || 0); // NaN protection
      prts[i].y = prts[i].y + (prts[i].vY*delta/1000 || 0); // NaN protection
      if (prts[i].body) { // check collisions
        for (let j = i+1; j < prts.length; j++) {
          if (!(prts[j] && prts[j].active)) continue;
          if (prts[j].body && this.isTouching(prts[i].calcBody(), prts[j].calcBody())) {
            if (prts[i].touch) prts[i].touch(prts[j], now);
            if (prts[j].touch) prts[j].touch(prts[i], now);
          }
        }
      }
      if (prts[i].step) prts[i].step.call(prts[i], {now,delta});
      if (perItem) perItem.call(prts[i], {now,delta});
    }
  }
}