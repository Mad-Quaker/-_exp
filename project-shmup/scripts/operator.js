class Node {
  x; y; z;
  prev; next;
  props;
  constructor (props, operator) {
    const values = {...props};
    this.x = values.x || 0;
    this.y = values.y || 0;
    this.z = values.z || 0;
    delete values.x;
    delete values.y;
    delete values.z;
    this.props = {...values};
    this._operator = operator;
  }
  addAfter (o) {
    o.prev = this;
    o.next = this.next;
    if (this.next) this.next.prev = o;
    this.next = o;
    this._operator._fixDepthIndex(o);
    return o;
  }
  addBefore (o) {
    o.prev = this.prev;
    o.next = this;
    if (this.prev) this.prev.next = o;
    this.prev = o;
    this._operator._fixDepthIndex(o);
    return o;
  }
  replace (o) {
    o.prev = this.prev;
    o.next = this.next;
    if (this.prev) this.prev.next = o;
    if (this.next) this.next.prev = o;
    this._operator._fixDepthIndex(o);
    return this;
  }
  delete () {
    if (this.prev) this.prev.next = this.next;
    if (this.next) this.next.prev = this.prev;
    if (this.next && this.next.z === this.z) {
      // deleted node not impact on index, 'cuz next one hase the same Z
    } else if (this.prev && this.prev.z === this.z) {
      // prev node has same Z .. fix depth index
      this._operator._fixDepthIndex(this.prev);
    } else {
      delete this._operator.depthIndices[this.z]; 
    }
    if (this._operator.root === this) {
      this._operator.root = this.next;
    }
  }
}

class Operator {
  constructor (options) {
    this.objects = Array(options?.objectsLimit || 1000).fill();
    this.depth = options?.depth || 9;
    this.depthIndices = Array(this.depth);
    this.root;

    return this;
  }

  spawn (props, f) {
    const newEntity = new Node(props, this);

    this._insert(newEntity);
    // this.depthIndices[newEntity.z] = newEntity;
    this._fixDepthIndex(newEntity.z);

    return newEntity;
  }

  // push noe into the end of Z partition
  _insert (node, dir = 1) {
    let z = node.z || 0;
    let selected;
    do { // picking closest to our current Z
      selected = this.depthIndices[z]
    } while (z-- > 0 && !selected);

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
