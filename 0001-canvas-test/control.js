function control(element, options = {}) {
  return {
    element,
    options,
    values: [],
    updates: [],
    make (...initial) {
      this.element.innerHTML = '';
      this.defaults = [...initial.map(v=>v?.value || v)];
      this.values = [...this.defaults];

      this.values.forEach((value, i) => {
        const labelText = 'abcdefghi'.split('')[i];
        const preEl = _ce('div', {}, labelText);
        const oV = typeof value == 'object' ? value : {value};
        const el = _ce('input', {type: 'range', ...this.options, ...oV})
        const postEl = _ce('div', {}, oV.value);
        this.values[i] = oV.value;
        // console.log(value,i);
        // console.log(preEl,el,postEl);

        const vi = i;
        const update = (newValue = null) => {
          if (newValue !== null) { el.value = newValue; }
          this.values[vi] = Number(el.value);
          postEl.innerText = el.value;
        };
        this.updates[i] = update;

        el.onmousedown = () => { el.onmousemove = ()=>{update();this.onUpdate()}; el.onchange = ()=>{update();this.onUpdate()}; }
        el.onmouseup = () => { el.onmousemove = null; }

        this.element.appendChild(preEl);
        this.element.appendChild(el);
        this.element.appendChild(postEl);
      });

      return this;
    },
    reset () { this.setValues(...this.defaults); },
    setValues (...values) { values.forEach((v,i)=>this.updates[i](v)); this.onUpdate(); },
    getValues () { return this.values },
    update () { this.updates.forEach(f=>f()); this.onUpdate(); },
    log () { console.log(this.values) },
    onUpdate () {},
  }
}

