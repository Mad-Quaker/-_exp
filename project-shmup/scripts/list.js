import { BaseObject } from "./baseObject.js";

class Node {
  z; // order criteria
  prev; next;
  props;
  constructor (props, list) {
    this.z = props.z || 0;
    this.props = props;
    this._list = list;
  }
  addAfter (o) { // only for particles?..
    if (!(o instanceof Node)) {o = new Node(o, this._list)}
    o.prev = this;
    o.next = this.next;
    if (this.next) this.next.prev = o;
    this.next = o;
    this._list._fixDepthIndex(o);
    return o;
  }
  addBefore (o) {
    if (!(o instanceof Node)) {o = new Node(o, this._list)}
    o.prev = this.prev;
    o.next = this;
    if (this.prev) this.prev.next = o;
    this.prev = o;
    return o;
  }
  replace (o) { // does it necessary at all for my case?
    if (!(o instanceof Node)) {o = new Node(o, this._list)}
    o.prev = this.prev;
    o.next = this.next;
    if (this.prev) this.prev.next = o;
    if (this.next) this.next.prev = o;
    this._list._fixDepthIndex(o);
    if (this._list.root === this) {
      this._list.root = o;
    }
    return this;
  }
  delete () { // called by this.die() from object props
    if (this.prev) this.prev.next = this.next;
    if (this.next) this.next.prev = this.prev;
    if (this.next && this.next.z === this.z) {
      // deleted node not impact on index, 'cuz next one has the same Z
    } else if (this.prev && this.prev.z === this.z) {
      // prev node has same Z (and next one - not) .. fix depth index
      this._list._fixDepthIndex(this.prev);
    } else {
      // clear index 'cuz none of neighbors have same Z
      delete this._list.depthIndices[this.z]; 
    }
    if (this._list.root === this) {
      this._list.root = this.next;
    }
  }
  spawn (props, f) {
    this._list.add(props, f);
  }
}

class List {
  constructor (options) {
    this.depth = options?.depth || 9;
    this.depthIndices = Array(this.depth);
    this.root;

    return this;
  }

  add (props, f, cnt, i) {
    const newEntity = new BaseObject({...props});
    const newNode = new Node(newEntity, this);
    if (f) f.call(newEntity, cnt, i);

    // TODO: ??? enrich newEntity with this.spawn(new.parent=this), this.emit(particleProps), this.die()

    this._insert(newNode);
    this._fixDepthIndex(newNode);

    return newEntity;
  }

  _insert (node, dir = 1) {
    let z = node.z;
    if (z > this.depth) z = this.depth;
    if (z < 0) z = 0;
    let selected;
    do { // picking closest to our current Z
      selected = this.depthIndices[z]
    } while (!selected && z-- >= 0);

    if (selected) {
      if (dir == 1) {
        selected.addAfter(node); 
      } else if (dir == -1) {
        selected.addBefore(node); 
      }
    } else if (selected === undefined) { // not found
      if (this.root) {
        selected = this.root;
        if (node.z < this.root.z) {
          this.root.addBefore(node);
          this.root = node;
        } else {
          this.root.addAfter(node);
        }
      } else {
        this.root = node;
        return ;
      }
    }
  }

  _fixDepthIndex(node) {
    let selected = node;
    while (selected?.next?.z <= node.z) { // if `next`.z not higher than fixing one
      selected = selected.next; // switch selected to `next` node
    }
    this.depthIndices[node.z] = selected; // fix it!
  }

}

let list;

export function Spawn (obj, f) {
  if (!list) list = new List();
  // const obj = new proto(props);
  return list.add(obj, f);
}
export function SpawnX (count, obj, f) {
  if (!list) list = new List();
  let cnt = 0;
  do {
    list.add(obj, f, cnt, (count === 1 ? 1 : cnt / (count-1)));
  } while (cnt++ < count - 1) 
}


export function Process ({now, delta}) {
  if (!list || !list.root) return 0;
  let node = list.root, otherNode;
  let object, otherObject;
  let activeCount = 0;
  delta = Math.min(0.2, delta);
  let bodyA, bodyB, touched = [false,false], substeps;
  do {
    object = node.props;
    if (!object.active) { node.delete(); continue; }
    if (object.ttl < now) { node.delete(); continue; } // disable when time's up
    activeCount++;
    object.oX = object.x;
    object.oY = object.y;
    if (object.body && node.next) { // check collisions
      otherNode = node.next;
      do {
        otherObject = otherNode.props;
        if (otherObject.body) {
          touched = [false,false];
          substeps = Math.hypot(object.vY - otherObject.vX, object.vY - otherObject.vY) * delta
            / Math.min(object.body.width, object.body.height, otherObject.body.width, otherObject.body.height);
          substeps = 1 + Math.floor(substeps);
          for(let i = 1; i <= substeps; i++) {
            if (touched[0] || touched[1]) continue;
            let subDelta = (i / substeps) * delta;
            bodyA = object.calcBody(subDelta);
            bodyB = otherObject.calcBody(subDelta);
            if (bodyA.left < bodyB.right && bodyA.right > bodyB.left && bodyA.top < bodyB.bottom && bodyA.bottom > bodyB.top) {
              if (object.touch) touched[0] = object.touch(otherObject, {now, delta, subDelta});
              if (otherObject.touch) touched[1] = otherObject.touch(object, {now, delta, subDelta});
            }
          }
        } 
      } while (otherNode = otherNode.next) 
    }
    if (object.step) object.step.call(object, {now,delta});
    object.x += (object.vX*delta || 0); // NaN protection;
    object.y += (object.vY*delta || 0); // NaN protection;
  } while (node = node.next);
  return activeCount;
}

export function Render (func) {
  if (!list || !list.root) return 0;
  let node = list.root;
  do {
    func(node.props);
  } while (node = node.next);
}

export function ListDebug (expose) {
  let node = list.root;
  do {
    console.log(expose(node.props));
  } while (node = node.next);
}