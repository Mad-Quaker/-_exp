class Renderer {
  #primitives = [];
  constructor ($root, targetSize) {
    this.targetSize = targetSize;
    const $canvas = this.$canvas = $root.createElement('canvas');
    $root.body.appendChild(this.$canvas);
    this.initAction = ()=>{};
    this.configure();
    this.setStyles();
    this.ctx = this.$canvas.getContext('2d');
  }
  
  configure (newTargetSize) {
    const currentSize = {width: window.innerWidth, height: window.innerHeight, ratio: window.innerWidth / window.innerHeight};
    let targetSize = newTargetSize || this.targetSize;
    targetSize.ratio = targetSize.width / targetSize.height;
    
    this.size = (targetSize.ratio > currentSize.ratio) ? 
    {
      width: currentSize.width,
      height: Math.round(currentSize.width / targetSize.ratio),
      ratio: targetSize.ratio,
    } : {
      height: currentSize.height,
      width: Math.round(currentSize.height * targetSize.ratio),
      ratio: targetSize.ratio,
    };

    this.$canvas.width = this.size.width;
    this.$canvas.height = this.size.height;
    this.bound = {
      left: Math.round((window.innerWidth - this.size.width) / 2),
      top: Math.round((window.innerHeight - this.size.height) / 2),
      width: this.size.width,
      height: this.size.height,
    };
    this.initAction();
  }
  
  setStyles () {
    document.body.style = `
      margin: 0px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100wh;
      background: #000;
    `;
    this.$canvas.style = `
      background: #377;
      pointer-events: none;
    `;
  }

  addTestRect (box, options) {
    const ctx = this.ctx;
    const drawBox =  {
      box, options,
      style: function(newOptions) { this.options = newOptions },
      reset: function() { this.options = options }
    };
    this.#primitives.push(drawBox);
    
    return drawBox;
  }
  
  _renderPrimitive({options, box}) {
    this.ctx.beginPath();
    this.ctx.fillStyle = "#A11";
    if (options) { Object.keys(options).forEach(key=> {
      this.ctx[key] = options[key];
    }) }
    this.ctx.fillRect(box.left || box.x, box.top || box.y, box.width, box.height);
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.#primitives.forEach(primitive=> {
      this._renderPrimitive(primitive);
    })
    requestAnimationFrame(()=>this.render());
  }
}

export default Renderer;