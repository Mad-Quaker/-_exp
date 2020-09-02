const $ = (a,b)=>document.querySelector(a,b);
const $$ = (a,b)=>document.querySelectorAll(a,b);
const _ce = (tagname, options = {}, ...childs) => {
  let element = document.createElement(tagname);
  for (let att in options) {
    element[att] = options[att];
  }
  childs.forEach((child)=>{
    if (typeof child == 'string' || typeof child == 'number') {
      element.appendChild(document.createTextNode(child));
    } else if (child.nodeType) {
      element.appendChild(child);
    }
  })
  return element;
};

// function step1 (ctx) {
//   // ctx.drawRectangle() ...
//   ctx.rotate(10 * Math.PI / 180);
//   ctx.fillRect(70, 0, 100, 30);
//   ctx.rotate(10 * Math.PI / 180);
//   ctx.fillRect(70, 0, 100, 30);
// }


// (['a','b','c','d','e','f']).forEach((s)=>{
//   let el = $(`INPUT#${s}`);
//   let out = $(`DIV#i_${s}`);
//   const upd = () => { if (out.innerText != el.value) { out.innerText = el.value; } }
//   el.onmousedown = () => el.onmousemove = function() { upd(); matrixUpdate(); redraw(); };
//   el.onmouseup = () => { upd(); el.onmousemove = null; redraw();  } ;
// })

// let stacks = [];

function draw(stacks) {
  const ctx = window.ctx;
  stacks.forEach(({action, args})=>{
    ctx[action](...args);
  })
}
